// ─── E2E 共享辅助函数 ─────────────────────────────────────

import type { Page, Browser } from '@playwright/test';

// 测试环境统一使用非默认密码 (默认 admin123 会触发强制改密拦截)
export const TEST_PW = 'a1b2c3d8';

/** 通过登录页登录并等待跳转到后台 */
export async function login(page: Page, password = TEST_PW, remember = false): Promise<void> {
  await page.goto('/login');
  await page.locator('#password').fill(password);
  if (remember) await page.locator('#rememberMe').check();
  await page.locator('#loginBtn').click();
  // 注意: 初始密码未修改时会跳 /admin?welcome=1 (带 query), glob 需兼容
  await page.waitForURL('**/admin*');
}

/** 捕获页面 JS 错误与 alert/prompt/confirm 弹窗 */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  const dialogs: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // 未登录时后台 API 401 是设计行为, 仅追踪真实 JS 异常
    if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('Failed to load resource')) {
      errors.push(`console: ${m.text()}`);
    }
  });
  page.on('dialog', (d) => { dialogs.push(d.type() + ': ' + d.message()); void d.dismiss(); });
  return { errors, dialogs };
}

/** 唯一后缀, 避免测试数据撞车 */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** 按作者删除评论 (需已登录的 page) */
export async function deleteCommentsByAuthor(page: Page, author: string, bodyContains?: string): Promise<void> {
  const res = await page.request.get('/api/comments');
  if (!res.ok()) return;
  const list = await res.json() as { id: string; author: string; body: string }[];
  for (const c of list) {
    if (c.author === author && (!bodyContains || c.body.includes(bodyContains))) {
      await page.request.delete(`/api/comments/${c.id}`);
    }
  }
}

/** 用管理员会话清理评论 (访客上下文无法调 admin API) */
export async function cleanupComments(browser: Browser, author: string, bodyContains?: string): Promise<void> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page);
  await deleteCommentsByAuthor(page, author, bodyContains);
  await ctx.close();
}

/** 用管理员会话删除文章 */
export async function deletePostsByTitle(browser: Browser, title: string): Promise<void> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page);
  const res = await page.request.get('/api/posts');
  if (!res.ok()) { await ctx.close(); return; }
  const list = await res.json() as { slug: string; title: string }[];
  for (const p of list) {
    if (p.title.includes(title)) {
      await page.request.delete(`/api/posts/${p.slug}`);
    }
  }
  await ctx.close();
}

/**
 * 套件启动前清理上次失败运行残留的测试数据 (幂等, 防止脏数据累积)。
 * 匹配约定: 测试创建的数据都使用固定前缀 + uid() 后缀。
 */
export async function cleanupTestData(browser: Browser): Promise<void> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // 基线: 确保测试密码为 TEST_PW 且无强制改密标记
  // (覆盖: 已是 TEST_PW / 默认密码 admin123+标记(全新库或残留) 两种状态)
  try {
    await page.goto('/login');
    await page.locator('#password').fill(TEST_PW);
    await page.locator('#loginBtn').click();
    await page.waitForURL('**/admin*', { timeout: 5000 });
  } catch {
    // 密码是默认 admin123: 登录(可能受限) → 改密迁移到 TEST_PW
    await page.goto('/login');
    await page.locator('#password').fill('admin123');
    await page.locator('#loginBtn').click();
    await page.waitForURL('**/admin*');
    // 若处于强制改密界面, 直接改密; 否则通过设置接口
    const forceVisible = await page.locator('#forcePwd').isVisible().catch(() => false);
    if (forceVisible) {
      await page.locator('#forcePwdCurrent').fill('admin123');
      await page.locator('#forcePwdNew').fill(TEST_PW);
      await page.locator('#forcePwdConfirm').fill(TEST_PW);
      await page.locator('#forcePwdSubmit').click();
      await page.waitForURL('**/login', { timeout: 8000 });
      await page.locator('#password').fill(TEST_PW);
      await page.locator('#loginBtn').click();
      await page.waitForURL('**/admin*');
    } else {
      await page.request.put('/api/auth/password', { data: { currentPassword: 'admin123', newPassword: TEST_PW } });
      await page.goto('/login');
      await page.locator('#password').fill(TEST_PW);
      await page.locator('#loginBtn').click();
      await page.waitForURL('**/admin*');
    }
  }

  // 放宽评论限流阈值: e2e 多轮运行会累积访客评论计数(同 IP), 触发限流导致测试失败
  // 生产默认 10 条/10分钟 不受影响 (test.js 的限流测试会自行设置并恢复)
  await page.request.put('/api/settings', { data: { comment_max_per_window: '1000' } });
  // 清除强制改密标记: 初始密码状态会拦截所有后台 API, 测试基线需要正常 token
  await page.request.delete('/api/settings/password_initial');

  // 评论: 测试作者前缀 或 回复正文标记
  const comments = await (await page.request.get('/api/comments')).json().catch(() => []) as { id: string; author: string; body: string }[];
  for (const c of comments) {
    // 含 test.js §6 评论边界测试的命名 (失败运行可能残留)
    if (/^(访客|审核测试|筛选测试|垃圾测试|回复目标|串联评论|边界测试|长文本测试)/.test(c.author) || c.author.startsWith('<script') || /^(管理员回复|博主回复内容)/.test(c.body)) {
      await page.request.delete(`/api/comments/${c.id}`);
    }
  }
  // 文章
  const posts = await (await page.request.get('/api/posts')).json().catch(() => []) as { slug: string; title: string }[];
  for (const p of posts) {
    if (/^(草稿测试|发布测试|E2E|版本测试|串联测试)/.test(p.title) || p.title === '无标题文章' || p.slug.startsWith('xss-title-')) {
      await page.request.delete(`/api/posts/${p.slug}`);
    }
  }
  // 标签 (含 test.js 留下的孤儿标签: 删文章不删标签)
  const tags = await (await page.request.get('/api/tags')).json().catch(() => []) as { slug: string; name: string; post_count?: number }[];
  for (const t of tags) {
    if (/^(测试标签|串联标签)/.test(t.name) || t.name === '纯中文标签名' || (t.name === '测试' && !t.post_count)) {
      await page.request.delete(`/api/tags/${t.slug}`);
    }
  }
  // 分类
  const cats = await (await page.request.get('/api/categories')).json().catch(() => []) as { slug: string; name: string }[];
  for (const c of cats) {
    if (/^(测试分类|串联分类)/.test(c.name)) await page.request.delete(`/api/categories/${c.slug}`);
  }
  // 媒体: 测试环境无真实媒体, 全量清理 (失败运行的残留会污染媒体库空状态断言)
  const media = await (await page.request.get('/api/media')).json().catch(() => []) as { id: string }[];
  for (const m of media) await page.request.delete(`/api/media/${m.id}`);
  await ctx.close();
}
