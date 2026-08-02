// ─── 公开页面 UI 测试 ─────────────────────────────────────
// 覆盖: 首页结构/搜索/分类跳转、移动端导航、主题、文章页渲染/评论/回复/相关/404、
//       页面渲染、归档 tab/过滤/URL 参数、搜索实时/高亮/空态/注入、XSS 转义

import { test, expect, type Browser } from '@playwright/test';
import { login, trackErrors, uid, cleanupComments, cleanupTestData } from './helpers';

// 套件启动前清理上次失败运行的残留数据
test.beforeAll(async ({ browser }) => {
  await cleanupTestData(browser);
});

// ─── 1. 页面加载无 JS 错误 ──────────────────────────────
test('公开页加载无 JS 运行时错误', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('Failed to load resource')) {
      errors.push(`console: ${m.text()}`);
    }
  });
  for (const p of ['/', '/archive', '/search', '/login', '/page/about', '/post/knowledge-management-system']) {
    errors.length = 0;
    await page.goto(p);
    await page.waitForLoadState('load');
    expect(errors, `页面 ${p} 出现 JS 错误: ${errors.join('; ')}`).toEqual([]);
  }
});

// ─── 2. 首页结构 ─────────────────────────────────────────
test('首页: 精选卡片/文章列表/侧边栏组件齐全', async ({ page }) => {
  await page.goto('/');
  // 精选卡片
  const featured = page.locator('.card-featured');
  await expect(featured).toBeVisible();
  await expect(featured.locator('.pill')).toHaveText('精选');
  await expect(featured.locator('h2 a')).toHaveAttribute('href', /\/post\/.+/);
  await expect(featured.locator('.meta')).toContainText('阅读约');
  await expect(featured.locator('.tag').first()).toBeVisible();
  // 文章列表
  await expect(page.locator('.log-row').first()).toBeVisible();
  await expect(page.locator('.log-row h3 a').first()).toHaveAttribute('href', /\/post\//);
  await expect(page.locator('.log-row .log-desc').first()).not.toBeEmpty();
  await expect(page.locator('.log-row').first()).toContainText('阅读约');
  // 侧边栏 (关于博主默认空不展示)
  await expect(page.locator('.sidebar .search-box')).toBeVisible();
  await expect(page.locator('.sidebar-widget', { hasText: '关于博主' })).toHaveCount(0);
  await expect(page.locator('.sidebar-widget', { hasText: '分类' })).toBeVisible();
  await expect(page.locator('.cat-link').first()).toBeVisible();
  await expect(page.locator('.tag-cloud .tag').first()).toBeVisible();
  // 页脚
  await expect(page.locator('.pagefoot')).toBeVisible();
});

test('首页: 侧边栏搜索 → 跳转搜索页并出结果', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sideSearch').fill('Rust');
  await page.locator('.search-box button').click();
  await page.waitForURL('**/search?q=Rust');
  await expect(page.locator('.result-row').first()).toBeVisible();
});

test('首页: 分类链接 → 归档分类过滤', async ({ page }) => {
  await page.goto('/');
  await page.locator('.cat-link', { hasText: '技术' }).click();
  await page.waitForURL('**/archive?cat=tech');
  await expect(page.locator('#panel-categories')).toHaveClass(/active/);
  await expect(page.locator('#cat-results .filtered-posts')).toBeVisible();
  await expect(page.locator('#cat-results')).toContainText('篇');
});

// ─── 3. 移动端导航 ───────────────────────────────────────
test('移动端: 汉堡菜单开合', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('/');
  const nav = page.locator('#mainNav');
  await expect(nav).not.toHaveClass(/open/);
  await page.locator('#hamburger').click();
  await expect(nav).toHaveClass(/open/);
  await expect(nav).toBeVisible();
  await page.locator('#hamburger').click();
  await expect(nav).not.toHaveClass(/open/);
});

// ─── 4. 主题切换 ─────────────────────────────────────────
test('主题切换生效并持久化', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.locator('#themeToggle').click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  const stored = await page.evaluate(() => localStorage.getItem('blog-theme'));
  expect(stored).toBe(after);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after!);
});

// ─── 5. 登录页交互 ───────────────────────────────────────
test('登录页: 密码显示切换 + 记住我复选框', async ({ page }) => {
  await page.goto('/login');
  const pw = page.locator('#password');
  await pw.fill('secret123');
  await expect(pw).toHaveAttribute('type', 'password');
  // 显示密码
  await page.locator('#pwToggle').click();
  await expect(pw).toHaveAttribute('type', 'text');
  await expect(pw).toHaveValue('secret123');
  // 再次点击隐藏
  await page.locator('#pwToggle').click();
  await expect(pw).toHaveAttribute('type', 'password');
  // 记住我复选框
  await expect(page.locator('#rememberMe')).toBeVisible();
  await page.locator('#rememberMe').check();
  await expect(page.locator('#rememberMe')).toBeChecked();
});

// ─── 6. 文章页 ───────────────────────────────────────────
test('文章页: Markdown 渲染(标题/引用/代码高亮)', async ({ page }) => {
  await page.goto('/post/knowledge-management-system');
  await expect(page.locator('.post-body h2').first()).toHaveText('问题：为什么大多数笔记系统会失效？');
  await expect(page.locator('.post-body blockquote').first()).toBeVisible();
  await expect(page.locator('.post-body strong').first()).toBeVisible();
  await expect(page.locator('.post-body em').first()).toBeVisible();
  // 评论表单携带文章 slug
  await expect(page.locator('#commentForm')).toHaveAttribute('data-post-slug', 'knowledge-management-system');
  // 代码块语法高亮
  await page.goto('/post/css-container-queries');
  await expect(page.locator('.post-body pre code.hljs').first()).toBeVisible();
  await expect(page.locator('.post-body pre')).toBeVisible();
  // 排版样式规则: figure/figcaption + hljs 配色 ≥8 类 (由模板内联 CSS 提供)
  const css = await page.locator('style').first().textContent();
  expect(css).toContain('figcaption');
  expect((css.match(/hljs-/g) || []).length).toBeGreaterThanOrEqual(8);
});

test('文章页: 元信息(日期/阅读时间/分类链接/标签)', async ({ page }) => {
  await page.goto('/post/knowledge-management-system');
  await expect(page.locator('.post-meta')).toContainText('2026-07-20');
  await expect(page.locator('.post-meta')).toContainText('阅读约');
  await expect(page.locator('.post-meta a[href="/archive?cat=tech"]')).toHaveText('技术');
  await expect(page.locator('.post-header .tag').first()).toBeVisible();
  // 评论计数 + 邮箱不公开 (邮箱不出现在页面任何位置)
  await expect(page.locator('.comments-section h2')).toContainText('评论 (2)');
  await expect(page.locator('.comment')).toHaveCount(2);
  await expect(page.locator('body')).not.toContainText('lihua@email.com');
});

test('文章页: 相关文章卡片显示', async ({ page }) => {
  await page.goto('/post/knowledge-management-system');
  await expect(page.locator('.related-posts')).toBeVisible();
  const count = await page.locator('.related-card').count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(4);
  await expect(page.locator('.related-card').first().locator('h4')).not.toBeEmpty();
});

test('不存在的文章 → 404', async ({ page }) => {
  const resp = await page.goto('/post/__never_exists__');
  expect(resp!.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('页面不存在');
});

// ─── 6. 评论交互 (公开页) ────────────────────────────────
test('访客提交评论 → 提示审核后显示, 不立即公开', async ({ page, browser }) => {
  const author = '访客' + uid();
  await page.goto('/post/knowledge-management-system');
  await page.locator('#cname').fill(author);
  await page.locator('#cemail').fill('visitor@example.com');
  await page.locator('#ccontent').fill('这是一条待审核评论');
  await page.locator('#submitBtn').click();
  await expect(page.locator('.toast', { hasText: '审核后显示' })).toBeVisible();
  // 刷新后不显示 (pending)
  await page.reload();
  await expect(page.locator('.comment', { hasText: author })).toHaveCount(0);
  await cleanupComments(browser, author);
});

test('评论昵称 XSS 渲染为纯文本, 不弹窗', async ({ browser }) => {
  const actx = await browser.newContext();
  const ap = await actx.newPage();
  await login(ap);
  const author = '<script>alert(1)</script>';
  const res = await ap.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: '<b>xss</b>' },
  });
  expect(res.ok()).toBeTruthy();
  const id = (await res.json()).id;

  const vctx = await browser.newContext();
  const vp = await vctx.newPage();
  const { dialogs } = trackErrors(vp);
  await vp.goto('/post/knowledge-management-system');
  const authorEl = vp.locator('.comment-author').filter({ hasText: 'alert(1)' });
  await expect(authorEl).toBeVisible();
  expect(await authorEl.textContent()).toBe('<script>alert(1)</script>');
  expect(dialogs).toEqual([]);
  const bodyEl = vp.locator('.comment-body').filter({ hasText: '<b>xss</b>' });
  expect(await bodyEl.textContent()).toContain('<b>xss</b>');

  await ap.request.delete(`/api/comments/${id}`);
  await actx.close(); await vctx.close();
});

test('评论: 管理员提交自动通过, 刷新立即可见', async ({ browser }) => {
  const author = '博主直达' + uid();
  const actx = await browser.newContext();
  const ap = await actx.newPage();
  await login(ap);
  // 管理员提交 (自动批准)
  const r = await ap.request.post('/api/comments', {
    data: { post_slug: 'knowledge-management-system', author, body: '自动通过内容' },
  });
  expect(r.ok()).toBeTruthy();
  // 刷新文章页 → 立即可见 (无需审核)
  await ap.goto('/post/knowledge-management-system');
  await expect(ap.locator('.comment', { hasText: author })).toBeVisible();
  // 清理
  const list = await (await ap.request.get('/api/comments')).json() as { id: string; author: string }[];
  const mine = list.find((c) => c.author === author);
  if (mine) await ap.request.delete(`/api/comments/${mine.id}`);
  await actx.close();
});

test('回复按钮: 访客隐藏, 管理员可见并即时显示回复', async ({ browser }) => {
  const vctx = await browser.newContext();
  const vp = await vctx.newPage();
  await vp.goto('/post/knowledge-management-system');
  await expect(vp.locator('.comment-reply-link').first()).toBeHidden();

  const actx = await browser.newContext();
  const ap = await actx.newPage();
  await login(ap);
  await ap.goto('/post/knowledge-management-system');
  await expect(ap.locator('.comment-reply-link').first()).toBeVisible();
  // 管理员回复 → 即时插入 + 成功提示
  const replyText = '博主回复内容' + uid();
  await ap.locator('.comment-reply-link').first().click();
  await ap.locator('.reply-form-inline textarea').fill(replyText);
  await ap.locator('.reply-form-inline .reply-submit').click();
  // 回复条目为内联样式无 class, 按文本定位
  await expect(ap.getByText(replyText)).toBeVisible();
  await expect(ap.getByText(/博主回复 ·/).first()).toBeVisible();
  await expect(ap.locator('.toast', { hasText: '回复已提交' })).toBeVisible();
  // 清理回复 (author=博主, body 含回复内容)
  const list = await (await ap.request.get('/api/comments')).json() as { id: string; author: string; body: string }[];
  for (const c of list) {
    if (c.author === '博主' && c.body.includes(replyText)) await ap.request.delete(`/api/comments/${c.id}`);
  }
  await actx.close(); await vctx.close();
});

// ─── 7. 页面 (About / 404) ───────────────────────────────
test('关于页渲染; 友链页链接; 不存在的页面 → 404', async ({ page }) => {
  await page.goto('/page/about');
  await expect(page.locator('.page-body h2').first()).toContainText('关于 cLog');
  await expect(page.locator('.page-body blockquote').first()).toBeVisible();
  // 友情链接页的链接列表
  await page.goto('/page/links');
  await expect(page.locator('.page-body a[href="https://misc.shop"]')).toBeVisible();
  await expect(page.locator('.page-body a[href="https://onlyread.cc"]')).toBeVisible();
  const resp = await page.goto('/page/__never_exists__');
  expect(resp!.status()).toBe(404);
});

// ─── 8. 归档 ─────────────────────────────────────────────
test('归档: 三个 tab 切换', async ({ page }) => {
  await page.goto('/archive');
  await expect(page.locator('#panel-all')).toHaveClass(/active/);
  await expect(page.locator('#panel-all .log-row').first()).toBeVisible();
  await page.locator('.tab-btn[data-tab="tags"]').click();
  await expect(page.locator('#panel-tags')).toHaveClass(/active/);
  await expect(page.locator('.tag-pill').first()).toBeVisible();
  await page.locator('.tab-btn[data-tab="categories"]').click();
  await expect(page.locator('#panel-categories')).toHaveClass(/active/);
  await expect(page.locator('.cat-row').first()).toBeVisible();
});

test('归档: 点击标签云过滤文章', async ({ page }) => {
  await page.goto('/archive');
  await page.locator('.tab-btn[data-tab="tags"]').click();
  await page.locator('.tag-pill', { hasText: 'CSS' }).click();
  await expect(page.locator('#tag-results .filtered-posts')).toBeVisible();
  await expect(page.locator('#tag-results')).toContainText('CSS Container Queries');
});

test('归档: 分类过滤 (点击 + URL 参数直达)', async ({ page }) => {
  // URL 参数直达
  await page.goto('/archive?cat=writing');
  await expect(page.locator('#panel-categories')).toHaveClass(/active/);
  await expect(page.locator('#cat-results .filtered-posts')).toBeVisible();
  await expect(page.locator('#cat-results')).toContainText('初稿');
  // 点击切换过滤
  await page.locator('.cat-row', { hasText: '技术' }).click();
  await expect(page.locator('#cat-results')).toContainText('Rust 中的异步运行时');
});

test('归档: 标签 URL 参数直达过滤', async ({ page }) => {
  await page.goto('/archive?tag=rust');
  await expect(page.locator('#panel-tags')).toHaveClass(/active/);
  await expect(page.locator('#tag-results .filtered-posts')).toBeVisible();
  await expect(page.locator('#tag-results')).toContainText('Rust 中的异步运行时');
});

// ─── 9. 搜索 ─────────────────────────────────────────────
test('搜索: 实时过滤 + 关键词高亮', async ({ page }) => {
  await page.goto('/search');
  await page.locator('#searchInput').fill('rust');
  await expect(page.locator('.result-row').first()).toBeVisible();
  await expect(page.locator('#resultsCount')).toContainText('找到');
  await expect(page.locator('.result-row mark').first()).toBeVisible();
});

test('搜索: 无结果空状态', async ({ page }) => {
  await page.goto('/search');
  await page.locator('#searchInput').fill('zzzz不存在的关键词');
  await expect(page.locator('#emptyState')).toBeVisible();
  await expect(page.locator('.result-row')).toHaveCount(0);
});

test('搜索: URL 参数打开自动回填并搜索', async ({ page }) => {
  await page.goto('/search?q=TypeScript');
  await expect(page.locator('#searchInput')).toHaveValue('TypeScript');
  await expect(page.locator('.result-row').first()).toBeVisible();
  await expect(page.locator('.result-row')).toContainText('TypeScript');
});

test('搜索: q 参数脚本注入被中和', async ({ page }) => {
  const { dialogs } = trackErrors(page);
  const q = '</script><script>alert(1)</script>';
  await page.goto('/search?q=' + encodeURIComponent(q));
  await expect(page.locator('#searchInput')).toHaveValue(q);
  await expect(page.locator('.results-count')).toBeVisible();
  expect(dialogs).toEqual([]);
});

// ─── 10. RSS ─────────────────────────────────────────────
test('RSS: 订阅可用 + 页脚入口', async ({ page }) => {
  const res = await page.request.get('/rss.xml');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type'] || '').toContain('application/rss+xml');
  const body = await res.text();
  expect(body).toContain('<rss version="2.0"');
  expect(body).toContain('知识管理系统');
  expect(body).toContain('content:encoded');
  expect(body).toContain('<category>');
  // 页脚 RSS 链接
  await page.goto('/');
  await expect(page.locator('.pagefoot a[href="/rss.xml"]')).toBeVisible();
});
