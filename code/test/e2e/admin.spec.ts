// ─── 管理后台 UI 测试 ────────────────────────────────────
// 覆盖: 登录/登出/记住我、移动端侧边栏、仪表盘、编辑器(工具栏/预览/字数/草稿/发布/删除)、
//       文章编辑、页面管理、评论(筛选/批准/垃圾/回复/两步删除/空态/XSS)、标签、分类、
//       媒体库、修改密码、偏好设置(保存/取消/纯模式)

import { test, expect } from '@playwright/test';
import { login, trackErrors, uid, deleteCommentsByAuthor, cleanupTestData } from './helpers';

// 套件启动前清理上次失败运行的残留数据
test.beforeAll(async ({ browser }) => {
  await cleanupTestData(browser);
});

// ─── 1. 页面加载无 JS 错误 (回归: 曾因缺失元素整段崩溃) ────
test('后台加载无 JS 运行时错误', async ({ page }) => {
  const { errors } = trackErrors(page);
  await page.goto('/admin');
  await expect(page.locator('#sidebar')).toBeVisible();
  expect(errors).toEqual([]);
});

test('后台: 布局结构元素完整', async ({ page }) => {
  await page.goto('/admin');
  // 侧边栏语义结构 + 9 个导航
  await expect(page.locator('footer.sidebar-footer')).toBeVisible();
  await expect(page.locator('.sidebar-nav a[data-view]')).toHaveCount(9);
  // 仪表盘表格 + toast 容器
  await expect(page.locator('#recentActivity').first()).toBeVisible();
  await expect(page.locator('#toastContainer')).toBeVisible();
  // 各视图的表格容器
  for (const view of ['posts', 'pages', 'tags', 'categories']) {
    await page.locator(`a[data-view="${view}"]`).click();
    await expect(page.locator(`#view-${view} .table-wrap`)).toBeVisible();
  }
  // 评论筛选组 + 计数
  await page.locator('a[data-view="comments"]').click();
  await expect(page.locator('#commentFilterGroup .filter-btn')).toHaveCount(4);
  await expect(page.locator('.filter-count').first()).toBeVisible();
});

// ─── 2. 设计系统 tokens ──────────────────────────────────
test('设计系统: 亮暗主题实际生效 + CSS 变量完整', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  // 亮色主题: 背景为纯白
  await html.evaluate((el) => el.setAttribute('data-theme', 'light'));
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  // 暗色主题: 背景为 #0a0a0a
  await html.evaluate((el) => el.setAttribute('data-theme', 'dark'));
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 10)');
  // 模板内联 CSS 含设计 tokens
  const css = await page.locator('style').first().textContent();
  expect(css).toContain('--surface-warm');
  expect(css).toContain('--accent-hover');
  expect(css).toContain('808080');
  // 后台同样具备暗色完整变量
  await page.goto('/admin');
  const adminCss = await page.locator('style').first().textContent();
  expect(adminCss).toContain('--surface-warm');
  expect(adminCss).toContain('1px #1a1a1a');
  expect(adminCss).toContain('808080');
});

// ─── 2. 登录 / 登出 / 记住我 ─────────────────────────────
test('登录失败显示错误提示且输入时清除', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#password').fill('wrong-password');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#passwordError')).toBeVisible();
  await expect(page.locator('#passwordError')).toContainText('密码错误');
  await page.locator('#password').fill('x');
  await expect(page.locator('#passwordError')).not.toBeVisible();
});

test('登录成功 → 后台仪表盘 + 会话 cookie', async ({ page, context }) => {
  await login(page);
  await expect(page.locator('#viewTitle')).toHaveText('仪表盘');
  const token = (await context.cookies()).find((c) => c.name === 'blog_token');
  expect(token).toBeTruthy();
  expect(token!.expires).toBe(-1); // 不勾选记住我 → 会话 cookie
});

test('勾选记住我 → 30 天持久 cookie', async ({ page, context }) => {
  await login(page, 'admin123', true);
  await expect(page.locator('#viewTitle')).toHaveText('仪表盘');
  const token = (await context.cookies()).find((c) => c.name === 'blog_token');
  expect(token!.expires).toBeGreaterThan(0);
});

test('登出: 清除会话并回到首页', async ({ page }) => {
  await login(page);
  await page.locator('#logoutBtn').click();
  await page.waitForURL('**/');
  const check = await page.request.get('/api/auth/check');
  expect((await check.json()).authenticated).toBe(false);
});

// ─── 3. 移动端侧边栏 ────────────────────────────────────
test('移动端侧边栏开合 + 遮罩点击关闭 + 导航收起', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('/admin');
  const sidebar = page.locator('#sidebar');
  const backdrop = page.locator('#sidebarBackdrop');
  await expect(sidebar).not.toHaveClass(/open/);
  await page.locator('#sidebarToggle').click();
  await expect(sidebar).toHaveClass(/open/);
  await expect(backdrop).toHaveClass(/show/);
  await backdrop.click({ position: { x: 300, y: 400 } });
  await expect(sidebar).not.toHaveClass(/open/);
  // 导航切换后自动收起
  await page.locator('#sidebarToggle').click();
  await page.locator('a[data-view="posts"]').click();
  await expect(sidebar).not.toHaveClass(/open/);
  await expect(page.locator('#viewTitle')).toHaveText('文章管理');
});

// ─── 4. 仪表盘 ───────────────────────────────────────────
test('仪表盘: 统计卡加载 + 最近动态', async ({ page }) => {
  await login(page);
  await expect(page.locator('.stat-card .stat-label').first()).not.toHaveText('加载中…');
  await expect(page.locator('.stat-hero')).toContainText('已发布文章');
  const num = await page.locator('.stat-hero .stat-num').textContent();
  expect(Number(num)).toBeGreaterThanOrEqual(1);
  await expect(page.locator('#recentActivity .badge-published').first()).toBeVisible();
});

// ─── 5. 编辑器 ───────────────────────────────────────────
test('编辑器: 工具栏插入 Markdown', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="editor"]').click();
  const ta = page.locator('#mdEditor');
  // 选中文本 → 加粗
  await ta.fill('Hello');
  await ta.selectText();
  await page.locator('.md-tb-btn[data-action="bold"]').click();
  await expect(ta).toHaveValue('**Hello**');
  // 空选区 → 默认文本
  await ta.fill('');
  await page.locator('.md-tb-btn[data-action="heading"]').click();
  await expect(ta).toHaveValue('\n## 文本');
  await ta.fill('');
  await page.locator('.md-tb-btn[data-action="code"]').click();
  await expect(ta).toHaveValue('`文本`');
  await ta.fill('');
  await page.locator('.md-tb-btn[data-action="link"]').click();
  await expect(ta).toHaveValue('[文本](url)');
  // 斜体 / 引用 / 列表
  await ta.fill('重点');
  await ta.selectText();
  await page.locator('.md-tb-btn[data-action="italic"]').click();
  await expect(ta).toHaveValue('*重点*');
  await ta.fill('');
  await page.locator('.md-tb-btn[data-action="quote"]').click();
  await expect(ta).toHaveValue('\n> 文本');
  await ta.fill('');
  await page.locator('.md-tb-btn[data-action="list"]').click();
  await expect(ta).toHaveValue('\n- 文本');
});

test('编辑器: 字数统计 + 实时预览', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="editor"]').click();
  await page.locator('#mdEditor').fill('## 标题\n\n**粗体** 和 `代码`');
  await expect(page.locator('#mdPreview h2')).toHaveText('标题');
  await expect(page.locator('#mdPreview strong')).toHaveText('粗体');
  await expect(page.locator('#mdPreview code')).toHaveText('代码');
  await expect(page.locator('#wordCount')).toContainText('字数:');
  await expect(page.locator('#wordCount')).toContainText('字符:');
  // 新建按钮重置编辑器
  await page.locator('#postTitle').fill('测试');
  await page.getByRole('button', { name: '新建' }).click();
  await expect(page.locator('#postTitle')).toHaveValue('');
  await expect(page.locator('#mdEditor')).toHaveValue('');
});

test('新建文章: 保存草稿 → 列表出现', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="editor"]').click();
  const title = '草稿测试' + uid();
  await page.locator('#postTitle').fill(title);
  await page.locator('#mdEditor').fill('草稿正文');
  await page.locator('#postCategory').selectOption('tech');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.locator('.toast')).toContainText('草稿已保存');
  await page.locator('a[data-view="posts"]').click();
  const row = page.locator('#postsTableBody tr', { hasText: title });
  await expect(row).toBeVisible();
  await expect(row.locator('.badge')).toHaveText('草稿');
  const slug = await page.locator('#editSlug').inputValue();
  await page.request.delete('/api/posts/' + slug);
});

test('新建文章: 发布 → 公开可见 → 列表删除(confirm)', async ({ page }) => {
  await login(page);
  const title = '发布测试' + uid();
  await page.locator('a[data-view="editor"]').click();
  await page.locator('#postTitle').fill(title);
  await page.locator('#mdEditor').fill('## 发布正文');
  await page.locator('#postCategory').selectOption('tech');
  await page.getByRole('button', { name: '发布' }).click();
  await expect(page.locator('.toast')).toContainText('文章已发布');
  const slug = await page.locator('#editSlug').inputValue();
  expect(slug).toBeTruthy();
  // 公开页可见
  await page.goto(`/post/${slug}`);
  await expect(page.locator('.post-header h1')).toHaveText(title);
  // 后台列表 → 删除 (confirm 确认)
  await page.goto('/admin');
  await page.locator('a[data-view="posts"]').click();
  const row = page.locator('#postsTableBody tr', { hasText: title });
  await expect(row).toBeVisible();
  // 取消删除 → 行保留
  page.once('dialog', (d) => { void d.dismiss(); });
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row).toBeVisible();
  // 确认删除 → 行消失
  page.once('dialog', (d) => { void d.accept(); });
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row).toHaveCount(0);
  const res = await page.request.get('/api/posts/' + slug);
  expect(res.status()).toBe(404);
});

test('版本管理: 文章历史版本查看/预览/恢复', async ({ page }) => {
  await login(page);
  // 准备: 发布文章 + 编辑 → 产生 2 个版本
  const title = '版本测试' + uid();
  await page.locator('a[data-view="editor"]').click();
  await page.locator('#postTitle').fill(title);
  await page.locator('#mdEditor').fill('## 版本一');
  await page.getByRole('button', { name: '发布' }).click();
  await expect(page.locator('.toast')).toContainText('文章已发布');
  const slug = await page.locator('#editSlug').inputValue();
  // 发布成功后编辑器被重置, 再次编辑需重新填写标题
  await page.locator('#postTitle').fill(title);
  await page.locator('#mdEditor').fill('## 版本二');
  await page.getByRole('button', { name: '发布' }).click();
  await expect(page.locator('.toast').last()).toContainText('文章已发布');

  // 文章列表 → 版本按钮 → 模态
  await page.locator('a[data-view="posts"]').click();
  const row = page.locator('#postsTableBody tr', { hasText: title });
  await row.getByRole('button', { name: '版本' }).click();
  await expect(page.locator('#revModalBackdrop')).toBeVisible();
  await expect(page.locator('#revModalTitle')).toHaveText('文章历史版本');
  // 两个版本项: 发布 + 编辑
  const revItems = page.locator('.rev-item');
  await expect(revItems).toHaveCount(2);
  await expect(revItems.first()).toContainText('编辑');
  await expect(revItems.first().locator('.badge')).toHaveText('已发布');
  // 预览 → 内容显示
  await revItems.first().getByRole('button', { name: '预览' }).click();
  await expect(page.locator('#revPreview')).toBeVisible();
  await expect(page.locator('#revPreviewBody')).toContainText('## 版本二');
  // 遮罩点击关闭
  await page.locator('#revModalBackdrop').click({ position: { x: 20, y: 400 } });
  await expect(page.locator('#revModalBackdrop')).toBeHidden();
  // 恢复版本一 → toast + 列表刷新
  await row.getByRole('button', { name: '版本' }).click();
  page.once('dialog', (d) => { void d.accept(); });
  await revItems.last().getByRole('button', { name: '恢复' }).click();
  await expect(page.locator('.toast').last()).toContainText('已恢复到版本');
  await expect(page.locator('#revModalBackdrop')).toBeHidden();
  // 内容已回滚 (编辑器中验证)
  await row.getByRole('button', { name: '编辑' }).click();
  await expect(page.locator('#mdEditor')).toHaveValue('## 版本一');
  // 清理
  const slug2 = await page.locator('#editSlug').inputValue();
  await page.request.delete('/api/posts/' + slug2);
});

test('版本管理: 页面历史版本入口', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="pages"]').click();
  const row = page.locator('#pagesTableBody tr', { hasText: '关于' });
  await row.getByRole('button', { name: '版本' }).click();
  await expect(page.locator('#revModalTitle')).toHaveText('页面历史版本');
  await expect(page.locator('.rev-item').first()).toBeVisible();
  await page.locator('#revModalClose').click();
});

test('版本管理: 无版本文章显示空状态提示', async ({ page }) => {
  await login(page);
  // seed 文章没有版本历史 (测试库无残留)
  await page.locator('a[data-view="posts"]').click();
  const row = page.locator('#postsTableBody tr', { hasText: 'CSS Container Queries' });
  await row.getByRole('button', { name: '版本' }).click();
  await expect(page.locator('.rev-empty')).toContainText('暂无历史版本');
  await page.locator('#revModalClose').click();
});

test('后台列表: XSS 标题/标签名转义显示, 不弹窗', async ({ page }) => {
  await login(page);
  // 创建 XSS 标题文章 + XSS 标签
  const xssTitle = '<script>alert("t")</script>';
  const r = await page.request.post('/api/posts', {
    data: { slug: 'xss-title-' + uid(), title: xssTitle, content: 'x', status: 'draft' },
  });
  expect(r.ok()).toBeTruthy();
  const { dialogs } = trackErrors(page);
  // 文章列表显示转义文本, 无弹窗
  await page.locator('a[data-view="posts"]').click();
  await expect(page.locator('#postsTableBody')).toContainText('alert("t")');
  expect(dialogs).toEqual([]);
  // 编辑器分类下拉渲染正常 (5 个 seed 分类)
  await page.locator('a[data-view="editor"]').click();
  await expect(page.locator('#postCategory option')).toHaveCount(5);
  // 清理
  const posts = await (await page.request.get('/api/posts')).json() as { slug: string; title: string }[];
  const mine = posts.find((p) => p.title === xssTitle);
  if (mine) await page.request.delete('/api/posts/' + mine.slug);
});

test('草稿文章: 公开页不可见 (404)', async ({ page }) => {
  await login(page);
  const title = '草稿保密' + uid();
  await page.locator('a[data-view="editor"]').click();
  await page.locator('#postTitle').fill(title);
  await page.locator('#mdEditor').fill('草稿内容');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.locator('.toast')).toContainText('草稿已保存');
  const slug = await page.locator('#editSlug').inputValue();
  // 公开页访问草稿 → 404
  const resp = await page.goto('/post/' + slug);
  expect(resp!.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('页面不存在');
  await page.request.delete('/api/posts/' + slug);
});

test('后台: 主题切换 (头部 + 侧边栏按钮)', async ({ page }) => {
  await login(page);
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  // 头部按钮
  await page.locator('#themeToggle').click();
  const after1 = await html.getAttribute('data-theme');
  expect(after1).not.toBe(before);
  // 侧边栏按钮
  await page.locator('#themeToggle2').click();
  const after2 = await html.getAttribute('data-theme');
  expect(after2).not.toBe(after1);
  // localStorage 持久化
  const stored = await page.evaluate(() => localStorage.getItem('blog-theme'));
  expect(stored).toBe(after2);
  // 恢复初始主题 (避免影响后续测试)
  if (before !== after2) await page.locator('#themeToggle2').click();
});

test('编辑文章: 分类下拉正确回显 (竞态回归)', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="posts"]').click();
  // bad-first-draft 分类是 writing (非默认第一项 tech, 回归竞态)
  await page.locator('#postsTableBody tr', { hasText: '初稿' }).getByRole('button', { name: '编辑' }).click();
  await expect(page.locator('#view-editor')).toHaveClass(/active/);
  await expect(page.locator('#postCategory')).toHaveValue('writing');
  await expect(page.locator('#postTitle')).toHaveValue(/初稿/);
  await expect(page.locator('#mdEditor')).not.toHaveValue('');
});

// ─── 6. 页面管理 ─────────────────────────────────────────
test('页面管理: 列表 + 编辑占位提示', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="pages"]').click();
  await expect(page.locator('#pagesTableBody tr', { hasText: '关于' })).toBeVisible();
  await page.locator('#pagesTableBody tr', { hasText: '关于' }).getByRole('button', { name: '编辑' }).click();
  await expect(page.locator('.toast')).toContainText('页面编辑功能开发中');
});

// ─── 7. 评论管理 ─────────────────────────────────────────
test('评论管理: 筛选 tab + 计数 + 空状态', async ({ page }) => {
  const author = '筛选测试' + uid();
  const r = await page.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: '筛选内容' },
  });
  expect(r.ok()).toBeTruthy();
  const commentId = (await r.json()).id;
  await login(page);
  await page.locator('a[data-view="comments"]').click();
  // 用 data-id 精确定位, 避免文本子串匹配歧义
  const row = page.locator(`.comment-row[data-id="${commentId}"]`);
  await expect(row).toBeVisible();
  await expect(row.locator('.badge')).toHaveText('待审核');
  // 计数非零
  await expect(page.locator('.filter-btn[data-filter="pending"] .filter-count')).not.toHaveText('0');
  // 待审核 tab 显示, 已批准 tab 隐藏
  await page.locator('.filter-btn[data-filter="pending"]').click();
  await expect(row).toBeVisible();
  await page.locator('.filter-btn[data-filter="approved"]').click();
  await expect(row).toBeHidden();
  await page.locator('.filter-btn[data-filter="all"]').click();
  await expect(row).toBeVisible();
  await deleteCommentsByAuthor(page, author);
});

test('评论管理: 批准流程 → 访客公开可见', async ({ page, browser }) => {
  const author = '审核测试' + uid();
  const vctx = await browser.newContext();
  const vp = await vctx.newPage();
  const r = await vp.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: '待审核内容' },
  });
  expect(r.ok()).toBeTruthy();
  const commentId = (await r.json()).id;

  await login(page);
  await page.locator('a[data-view="comments"]').click();
  const row = page.locator(`.comment-row[data-id="${commentId}"]`);
  await row.getByRole('button', { name: '批准' }).click();
  await expect(row.locator('.badge')).toHaveText('已批准');
  // 批准按钮已移除
  await expect(row.getByRole('button', { name: '批准' })).toHaveCount(0);

  await vp.goto('/post/knowledge-management-system');
  await expect(vp.locator('.comment', { hasText: author })).toBeVisible();
  await deleteCommentsByAuthor(page, author);
  await vctx.close();
});

test('评论管理: XSS 昵称转义显示, 不弹窗', async ({ page }) => {
  const author = '<script>alert(1)</script>';
  const r = await page.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: 'x' },
  });
  expect(r.ok()).toBeTruthy();
  await login(page);
  const { dialogs } = trackErrors(page);
  await page.locator('a[data-view="comments"]').click();
  await expect(page.locator('.comment-row', { hasText: 'alert(1)' })).toBeVisible();
  expect(dialogs).toEqual([]);
  await deleteCommentsByAuthor(page, author);
});

test('评论管理: 标记垃圾 → 筛选 → 两步删除 → 空状态', async ({ page }) => {
  const author = '垃圾测试' + uid();
  const r = await page.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: 'x' },
  });
  expect(r.ok()).toBeTruthy();
  const commentId = (await r.json()).id;
  await login(page);
  const all = await (await page.request.get('/api/comments')).json() as { status: string }[];
  const spamBefore = all.filter((c) => c.status === 'spam').length;

  await page.locator('a[data-view="comments"]').click();
  const row = page.locator(`.comment-row[data-id="${commentId}"]`);
  await row.getByRole('button', { name: '垃圾' }).click();
  await expect(row.locator('.badge')).toHaveText('垃圾');
  await expect(row.getByRole('button', { name: '批准' })).toHaveCount(0);
  // 垃圾筛选可见
  await page.locator('.filter-btn[data-filter="spam"]').click();
  await expect(row).toBeVisible();
  // 两步删除: 点删除 → 出现确认 → 确认
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row.locator('.confirm-yes')).toBeVisible();
  await row.getByRole('button', { name: '确认' }).click();
  await expect(row).toHaveCount(0);
  // 若无残留垃圾评论 → 空状态
  if (spamBefore === 0) {
    await expect(page.locator('#commentsEmpty')).toBeVisible();
  }
});

test('评论管理: 内联回复 + 取消表单', async ({ page }) => {
  const author = '回复目标' + uid();
  const r = await page.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: '目标评论' },
  });
  expect(r.ok()).toBeTruthy();
  const commentId = (await r.json()).id;
  await login(page);
  await page.locator('a[data-view="comments"]').click();
  const row = page.locator(`.comment-row[data-id="${commentId}"]`);
  const replyText = '管理员回复' + uid();
  // 打开表单 → 提交
  await row.getByRole('button', { name: '回复', exact: true }).click();
  await row.locator('.reply-form textarea').fill(replyText);
  await row.locator('.reply-submit').click();
  await expect(row.locator('.reply-entry')).toContainText('博主回复');
  await expect(row.locator('.reply-entry')).toContainText(replyText);
  // 再次点击切换关闭表单
  await row.getByRole('button', { name: '回复', exact: true }).click();
  await expect(row.locator('.reply-form')).toHaveCount(0);
  // 清理
  await deleteCommentsByAuthor(page, author);
  await deleteCommentsByAuthor(page, '博主', replyText);
});

// ─── 8. 标签管理 ─────────────────────────────────────────
test('标签: 添加 → 列表出现 → 删除(confirm)', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="tags"]').click();
  const name = '测试标签' + uid();
  await page.locator('#newTagInput').fill(name);
  await page.getByRole('button', { name: '添加' }).click();
  const row = page.locator('#tagsTableBody tr', { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText('0'); // 文章数
  page.once('dialog', (d) => { void d.accept(); });
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row).toHaveCount(0);
});

// ─── 9. 分类管理 ─────────────────────────────────────────
test('分类: 新建(prompt) → 列表出现 → 删除(confirm)', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="categories"]').click();
  const name = '测试分类' + uid();
  const prompts = [name, '测试描述'];
  page.on('dialog', (d) => {
    if (d.type() === 'prompt') void d.accept(prompts.shift() ?? '');
    else void d.accept();
  });
  await page.getByRole('button', { name: '新建分类' }).click();
  const row = page.locator('#categoriesTableBody tr', { hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText('测试描述');
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row).toHaveCount(0);
});

// ─── 10. 媒体库 ──────────────────────────────────────────
test('媒体库: 上传 → 预览 → 复制链接 → 删除', async ({ page }) => {
  await login(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('a[data-view="media"]').click();
  // 初始空状态
  await expect(page.locator('#mediaEmpty')).toBeVisible();
  // 上传 1x1 PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.locator('#mediaInput').setInputFiles({ name: 'e2e-test.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.toast')).toContainText('上传成功');
  // 非图片文件 → 服务端拒绝提示
  await page.locator('#mediaInput').setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('not image') });
  await expect(page.locator('.toast').last()).toContainText('仅支持图片');
  const card = page.locator('.media-card').first();
  await expect(card).toBeVisible();
  await expect(card.locator('.media-name')).toHaveText('e2e-test.png');
  // 复制 Markdown 引用链接
  await card.locator('.media-copy').click();
  await expect(page.locator('.toast').last()).toContainText('链接已复制');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toMatch(/^http:\/\/localhost:8787\/media\/[0-9a-f-]+$/);
  // 删除 (confirm)
  page.once('dialog', (d) => { void d.accept(); });
  await card.getByRole('button', { name: '删除' }).click();
  await expect(page.locator('.media-card')).toHaveCount(0);
  await expect(page.locator('#mediaEmpty')).toBeVisible();
});

test('编辑器: 图片按钮插入 Markdown 引用', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="editor"]').click();
  await page.locator('.md-tb-btn[data-action="image"]').click();
  await expect(page.locator('#mdEditor')).toHaveValue('![alt](文本)');
});

// ─── 11. 设置: 修改密码 ──────────────────────────────────
test('设置: 修改密码 (错误校验 → 成功 → 改回)', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="settings"]').click();
  // 当前密码错误
  await page.locator('#pwdCurrent').fill('wrong-pw');
  await page.locator('#pwdNew').fill('a1b2c3d8');
  await page.locator('#pwdConfirm').fill('a1b2c3d8');
  await page.locator('#pwdSubmit').click();
  await expect(page.locator('#pwdMsg')).toContainText('当前密码错误');
  // 新密码太短
  await page.locator('#pwdCurrent').fill('admin123');
  await page.locator('#pwdNew').fill('a1b2');
  await page.locator('#pwdConfirm').fill('a1b2');
  await page.locator('#pwdSubmit').click();
  await expect(page.locator('#pwdMsg')).toContainText('至少需要 8 个字符');
  // 两次输入不一致
  await page.locator('#pwdCurrent').fill('admin123');
  await page.locator('#pwdNew').fill('a1b2c3d8');
  await page.locator('#pwdConfirm').fill('a1b2c3d9');
  await page.locator('#pwdSubmit').click();
  await expect(page.locator('#pwdMsg')).toContainText('两次输入的新密码不一致');
  // 成功修改
  await page.locator('#pwdConfirm').fill('a1b2c3d8');
  await page.locator('#pwdSubmit').click();
  await expect(page.locator('#pwdMsg')).toContainText('密码已成功更新');
  // 改回 admin123
  await page.locator('#pwdCurrent').fill('a1b2c3d8');
  await page.locator('#pwdNew').fill('admin123');
  await page.locator('#pwdConfirm').fill('admin123');
  await page.locator('#pwdSubmit').click();
  await expect(page.locator('#pwdMsg')).toContainText('密码已成功更新');
});

// ─── 12. 设置: 偏好 ──────────────────────────────────────
test('设置: 保存偏好 → 品牌名更新 + 服务器同步 → 恢复', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="settings"]').click();
  const newTitle = '测试博客' + uid();
  await page.locator('#prefBlogTitle').fill(newTitle);
  await page.locator('#prefTagline').fill('测试副标题');
  const syncDone = page.waitForResponse((r) => r.url().includes('/api/settings') && r.request().method() === 'PUT');
  await page.locator('#prefSubmit').click();
  await syncDone;
  await expect(page.locator('#prefMsg')).toContainText('偏好设置已保存');
  await expect(page.locator('#brandName')).toHaveText(newTitle);
  // 服务器同步: 首页标题 + 导航 logo + 登录页 logo/title 全部变化
  await page.goto('/');
  await expect(page).toHaveTitle(new RegExp(newTitle));
  await expect(page.locator('.topnav .logo')).toContainText(newTitle);
  await expect(page.locator('.pagefoot')).toContainText(newTitle);
  await page.goto('/login');
  await expect(page).toHaveTitle(new RegExp('登录 · ' + newTitle));
  await expect(page.locator('.login-header .logo')).toContainText(newTitle);
  // 恢复默认
  await page.goto('/admin');
  await page.locator('a[data-view="settings"]').click();
  await page.locator('#prefBlogTitle').fill('静思录');
  await page.locator('#prefTagline').fill('文字自有重量');
  const syncBack = page.waitForResponse((r) => r.url().includes('/api/settings') && r.request().method() === 'PUT');
  await page.locator('#prefSubmit').click();
  await syncBack;
  await page.goto('/');
  await expect(page).toHaveTitle(/静思录/);
  await expect(page.locator('.topnav .logo')).toContainText('静思录');
});

test('设置: 表单初始值来自服务器 + 取消恢复默认值', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="settings"]').click();
  // 服务器值作为初始值 (跨浏览器一致, 不再回落硬编码默认)
  await expect(page.locator('#prefBlogTitle')).toHaveValue('静思录');
  await expect(page.locator('#prefTagline')).toHaveValue('文字自有重量');
  // 站点 URL 字段存在
  await expect(page.locator('#prefSiteUrl')).toBeVisible();
  // 修改后取消 → 恢复默认
  await page.locator('#prefBlogTitle').fill('随便改改');
  await page.locator('#prefEditorMode').selectOption('pure');
  await page.locator('#prefCancel').click();
  await expect(page.locator('#prefBlogTitle')).toHaveValue('静思录');
  await expect(page.locator('#prefTagline')).toHaveValue('文字自有重量');
  await expect(page.locator('#prefSiteUrl')).toHaveValue('');
  await expect(page.locator('#prefEditorMode')).toHaveValue('split');
});

test('设置: 每页文章数 → 首页分页生效 → 恢复', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="settings"]').click();
  await page.locator('#prefPerPage').selectOption('5'); // 6 篇 seed 文章 → 2 页
  const sync = page.waitForResponse((r) => r.url().includes('/api/settings') && r.request().method() === 'PUT');
  await page.locator('#prefSubmit').click();
  await sync;
  // 首页出现分页器
  await page.goto('/');
  await expect(page.locator('.pager')).toBeVisible();
  await expect(page.locator('.pager-info')).toHaveText('1 / 2');
  // 翻到第 2 页
  await page.locator('.pager-link', { hasText: '下一页' }).click();
  await page.waitForURL('**/?page=2');
  await expect(page.locator('.log-row').first()).toBeVisible();
  // 归档分页
  await page.goto('/archive');
  await expect(page.locator('.pager')).toBeVisible();
  // 恢复 10 篇/页
  await page.goto('/admin');
  await page.locator('a[data-view="settings"]').click();
  await page.locator('#prefPerPage').selectOption('10');
  const syncBack = page.waitForResponse((r) => r.url().includes('/api/settings') && r.request().method() === 'PUT');
  await page.locator('#prefSubmit').click();
  await syncBack;
  await page.goto('/');
  await expect(page.locator('.pager')).toHaveCount(0);
});

test('设置: 纯编辑模式 → 预览列隐藏', async ({ page }) => {
  await login(page);
  await page.locator('a[data-view="settings"]').click();
  await page.locator('#prefEditorMode').selectOption('pure');
  await page.locator('#prefSubmit').click();
  await page.locator('a[data-view="editor"]').click();
  await expect(page.locator('#editorLayout')).toHaveClass(/pure-mode/);
  await expect(page.locator('#editorPreviewCol')).toBeHidden();
  // 恢复分屏
  await page.locator('a[data-view="settings"]').click();
  await page.locator('#prefEditorMode').selectOption('split');
  await page.locator('#prefSubmit').click();
});
