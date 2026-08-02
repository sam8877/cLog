// ─── 跨流程串联测试 (E2E) ─────────────────────────────────
// 覆盖用户真实路径中的多流程联动:
// A3 发布→首页精选位移→删除恢复 | B4 评论提交→审核→公开计数联动
// C2 媒体→文章→删除裂图 | D2 归档标签/分类计数不对称(契约)
// F2 版本恢复→公开页内容联动
// 数据前缀: 串联测试 / 串联评论 / 串联标签 / 串联分类 (cleanupTestData 兜底)

import { test, expect, type Browser } from '@playwright/test';
import { login, trackErrors, uid, cleanupTestData } from './helpers';

test.beforeAll(async ({ browser }) => {
  await cleanupTestData(browser);
});

// ─── A3 首页精选位移 ──────────────────────────────────────
test('串联A: 发布文章抢占首页精选, 删除后恢复', async ({ browser }) => {
  // 公开上下文: 读取当前精选卡标题
  const pubCtx = await browser.newContext();
  const pub = await pubCtx.newPage();
  await pub.goto('/');
  const origTitle = await pub.locator('.card-featured h2 a').textContent();
  expect(origTitle).toBeTruthy();

  // 管理员: 发布新文章
  const actx = await browser.newContext();
  const admin = await actx.newPage();
  await login(admin);
  const title = '串联测试发布' + uid();
  await admin.locator('a[data-view="editor"]').click();
  await admin.locator('#postTitle').fill(title);
  await admin.locator('#mdEditor').fill('## 串联正文');
  await admin.getByRole('button', { name: '发布' }).click();
  await expect(admin.locator('.toast')).toContainText('文章已发布');
  const slug = await admin.locator('#editSlug').inputValue();

  // 公开页: 新文章占据精选卡
  await pub.goto('/');
  await expect(pub.locator('.card-featured h2 a')).toHaveText(title);

  // 删除后恢复原精选
  await admin.request.delete('/api/posts/' + slug);
  await pub.goto('/');
  await expect(pub.locator('.card-featured h2 a')).toHaveText(origTitle!);

  await actx.close(); await pubCtx.close();
});

// ─── B4 评论计数联动 ─────────────────────────────────────
test('串联B: 访客评论 pending 不计 → 后台批准 → 公开计数+1', async ({ browser }) => {
  // 管理员: API 建发布文章 (聚焦评论链路)
  const actx = await browser.newContext();
  const admin = await actx.newPage();
  await login(admin);
  const slug = 'flow-cmt-' + uid();
  const title = '串联测试评论' + uid();
  const r = await admin.request.post('/api/posts', {
    data: { slug, title, content: '评论联动文章', status: 'published' },
  });
  expect(r.ok()).toBeTruthy();

  // 访客: 提交评论 → 待审核
  const author = '串联评论' + uid();
  const vctx = await browser.newContext();
  const vis = await vctx.newPage();
  await vis.goto('/post/' + slug);
  await expect(vis.locator('.comments-section h2')).toContainText('评论 (0)');
  await vis.locator('#cname').fill(author);
  await vis.locator('#ccontent').fill('串联评论内容');
  await vis.locator('#submitBtn').click();
  await expect(vis.locator('.toast')).toContainText('审核后显示');
  // 刷新: pending 不渲染, 计数仍 0
  await vis.reload();
  await expect(vis.locator('.comments-section h2')).toContainText('评论 (0)');
  await expect(vis.locator('.comment', { hasText: author })).toHaveCount(0);

  // 管理员: 后台批准
  await admin.locator('a[data-view="comments"]').click();
  const row = admin.locator('.comment-row', { hasText: author });
  await row.getByRole('button', { name: '批准' }).click();
  await expect(row.locator('.badge')).toHaveText('已批准');

  // 访客: 刷新后可见 + 计数 1
  await vis.reload();
  await expect(vis.locator('.comments-section h2')).toContainText('评论 (1)');
  await expect(vis.locator('.comment', { hasText: author })).toBeVisible();

  // 清理
  const list = await (await admin.request.get('/api/comments')).json() as { id: string; author: string }[];
  for (const c of list) {
    if (c.author === author) await admin.request.delete(`/api/comments/${c.id}`);
  }
  await admin.request.delete('/api/posts/' + slug);
  await actx.close(); await vctx.close();
});

// ─── C2 媒体 → 文章 → 删除裂图 ───────────────────────────
test('串联C: 媒体上传 → 插入文章 → 发布渲染 → 删媒体裂图', async ({ browser }) => {
  const actx = await browser.newContext();
  const admin = await actx.newPage();
  await login(admin);
  await admin.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  // 上传图片并复制链接
  await admin.locator('a[data-view="media"]').click();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  await admin.locator('#mediaInput').setInputFiles({ name: 'flow.png', mimeType: 'image/png', buffer: png });
  await expect(admin.locator('.toast').last()).toContainText('上传成功');
  await admin.locator('.media-copy').first().click();
  const mediaUrl = await admin.evaluate(() => navigator.clipboard.readText());
  expect(mediaUrl).toMatch(/\/media\/[0-9a-f-]+$/);
  const mediaId = mediaUrl.split('/').pop();

  // 编辑器: 插入图片引用并发布
  const title = '串联测试媒体' + uid();
  await admin.locator('a[data-view="editor"]').click();
  await admin.locator('#postTitle').fill(title);
  await admin.locator('#mdEditor').fill(`![串联图](${mediaUrl})`);
  await admin.getByRole('button', { name: '发布' }).click();
  await expect(admin.locator('.toast').last()).toContainText('文章已发布');
  const slug = await admin.locator('#editSlug').inputValue();

  // 公开页: 图片真实渲染
  const pubCtx = await browser.newContext();
  const pub = await pubCtx.newPage();
  await pub.goto('/post/' + slug);
  const img = pub.locator('.post-body img').first();
  await expect(img).toBeVisible();
  await pub.waitForFunction(() => {
    const el = document.querySelector('.post-body img') as HTMLImageElement | null;
    return !!el && el.complete && el.naturalWidth > 0;
  });

  // 管理员: 删除媒体
  await admin.locator('a[data-view="media"]').click();
  pageDialog(admin);
  await admin.locator('.media-card').first().getByRole('button', { name: '删除' }).click();
  await expect(admin.locator('.media-card')).toHaveCount(0);

  // 新访客 (无缓存): 图片请求 404 → 裂图 (img 仍在, naturalWidth=0)
  // 注意: 媒体响应带 immutable 缓存头, 复用原 context 会命中缓存, 必须用全新上下文
  const freshCtx = await browser.newContext();
  const fresh = await freshCtx.newPage();
  await fresh.goto('/post/' + slug);
  await expect(fresh.locator('.post-body img')).toBeVisible();
  await fresh.waitForFunction(() => {
    const el = document.querySelector('.post-body img') as HTMLImageElement | null;
    return !!el && el.complete && el.naturalWidth === 0;
  });
  const res = await fresh.request.get('/media/' + mediaId);
  expect(res.status()).toBe(404);
  await freshCtx.close();

  await admin.request.delete('/api/posts/' + slug);
  await actx.close(); await pubCtx.close();

  function pageDialog(page: import('@playwright/test').Page) {
    page.once('dialog', (d) => { void d.accept(); });
  }
});

// ─── D2 归档计数不对称 (契约) ────────────────────────────
test('串联D: 草稿文章标签云计数+1/分类不变, 发布后联动', async ({ browser }) => {
  // 管理员: API 建分类 + draft 文章 (带标签)
  const actx = await browser.newContext();
  const admin = await actx.newPage();
  await login(admin);
  const catName = '串联分类' + uid();
  const catSlug = 'flow-cat-' + uid();
  // 标签用 ASCII slug 当名称传 (slugify 后等于自身, 关联到同一标签)
  const tagSlug = 'flow-tag-' + uid();
  const slug = 'flow-draft-' + uid();
  await admin.request.post('/api/categories', {
    data: { slug: catSlug, name: catName, description: '', sort_order: 99 },
  });
  const r = await admin.request.post('/api/posts', {
    data: { slug, title: '串联测试草稿' + uid(), content: 'x', category: catSlug, status: 'draft', tags: [tagSlug] },
  });
  expect(r.ok()).toBeTruthy();

  // 公开归档: 标签云计 1 (draft 也计), 分类 0 篇 (只计 published) — 契约固化
  const pubCtx = await browser.newContext();
  const pub = await pubCtx.newPage();
  await pub.goto('/archive');
  await pub.locator('.tab-btn[data-tab="tags"]').click();
  await expect(pub.locator('.tag-pill', { hasText: tagSlug }).locator('.count')).toHaveText('1');
  await pub.locator('.tab-btn[data-tab="categories"]').click();
  await expect(pub.locator('.cat-row', { hasText: catName }).locator('.cat-count')).toContainText('0 篇');
  // 点击草稿标签 → 0 结果空态 (计数与筛选不对称的公开页表现: 计数 1 但筛选为空)
  await pub.locator('.tab-btn[data-tab="tags"]').click();
  await pub.locator('.tag-pill', { hasText: tagSlug }).click();
  await expect(pub.locator('#tag-results .empty-state')).toContainText('暂无匹配文章');

  // 发布 → 分类计数联动
  await admin.request.put('/api/posts/' + slug, { data: { status: 'published' } });
  await pub.goto('/archive');
  await pub.locator('.tab-btn[data-tab="categories"]').click();
  await expect(pub.locator('.cat-row', { hasText: catName }).locator('.cat-count')).toContainText('1 篇');
  await pub.locator('.tab-btn[data-tab="tags"]').click();
  await pub.locator('.tag-pill', { hasText: tagSlug }).click();
  await expect(pub.locator('#tag-results .filtered-posts')).toContainText('1 篇文章');

  // 清理
  await admin.request.delete('/api/posts/' + slug);
  await admin.request.delete('/api/tags/' + tagSlug);
  await admin.request.delete('/api/categories/' + catSlug);
  await actx.close(); await pubCtx.close();
});

// ─── F2 版本恢复 → 公开页内容联动 ─────────────────────────
test('串联F: 版本恢复后公开页内容回滚', async ({ browser }) => {
  const actx = await browser.newContext();
  const admin = await actx.newPage();
  await login(admin);
  const title = '串联测试版本' + uid();

  // 发布版本一
  await admin.locator('a[data-view="editor"]').click();
  await admin.locator('#postTitle').fill(title);
  await admin.locator('#mdEditor').fill('## 版本一');
  await admin.getByRole('button', { name: '发布' }).click();
  await expect(admin.locator('.toast').last()).toContainText('文章已发布');
  const slug = await admin.locator('#editSlug').inputValue();
  // 编辑器已重置, 重填标题编辑为版本二
  await admin.locator('#postTitle').fill(title);
  await admin.locator('#mdEditor').fill('## 版本二');
  await admin.getByRole('button', { name: '发布' }).click();
  await expect(admin.locator('.toast').last()).toContainText('文章已发布');

  // 公开页: 版本二
  const pubCtx = await browser.newContext();
  const pub = await pubCtx.newPage();
  await pub.goto('/post/' + slug);
  await expect(pub.locator('.post-body h2')).toHaveText('版本二');

  // 管理员: 版本模态恢复最旧版本 (发布版本)
  await admin.locator('a[data-view="posts"]').click();
  const row = admin.locator('#postsTableBody tr', { hasText: title });
  await row.getByRole('button', { name: '版本' }).click();
  await expect(admin.locator('.rev-item')).toHaveCount(2);
  admin.once('dialog', (d) => { void d.accept(); });
  await admin.locator('.rev-item').last().getByRole('button', { name: '恢复' }).click();
  await expect(admin.locator('.toast').last()).toContainText('已恢复到版本');

  // 公开页: 内容回滚到版本一
  await pub.goto('/post/' + slug);
  await expect(pub.locator('.post-body h2')).toHaveText('版本一');

  await admin.request.delete('/api/posts/' + slug);
  await actx.close(); await pubCtx.close();
});
