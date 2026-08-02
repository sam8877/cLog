// ─── 生产模式 seed 验证 (基础数据, 无 DEMO_SEED) ─────────
// 用法:  node test/prod-seed.check.js [baseUrl]   (默认 http://localhost:8788)
// 验证: 全新库在基础模式下仅初始化设置 + 分类骨架, 含 seed 默认文案;
//        用于 CI 与本地验证"生产初始化路径"
// ────────────────────────────────────────────────────────

const BASE = process.argv[2] || 'http://localhost:8788';

let passed = 0, failed = 0;
const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[1m', D = '\x1b[2m', X = '\x1b[0m';
const OK = `${G}✓${X}`, NO = `${R}✕${X}`;

function ok(l, c) { if (c) { console.log(`  ${OK} ${l}`); passed++; } else { console.log(`  ${NO} ${l}`); failed++; } }
function sec(t) { console.log(`\n${B}── ${t}${X}`); }

async function req(method, path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const text = await res.text();
  try { return { status: res.status, headers: res.headers, data: JSON.parse(text), text }; }
  catch { return { status: res.status, headers: res.headers, text }; }
}
const get = (p, o) => req('GET', p, o);
const post = (p, o) => req('POST', p, o);
const put = (p, o) => req('PUT', p, o);
const del = (p, o) => req('DELETE', p, o);
const is200 = r => r.status === 200;

async function run() {
  const t0 = Date.now();
  console.log(`${B}═══ 生产模式 seed 验证 (${BASE}) ═══${X}`);

  // ─── 初始密码登录 → 强制改密 ───
  sec('1. 初始密码与强制改密');
  const login = await post('/api/auth/login', { body: { password: 'admin123' } });
  ok('admin123 登录 → 200 + must_change', is200(login) && login.data?.success === true && login.data?.must_change === true);
  let cookie = login.headers.getSetCookie?.()?.[0] || login.headers.get('set-cookie');
  let H = { Cookie: cookie?.match(/blog_token=([^;]+)/)?.[0] || '' };
  if (!H.Cookie) { console.error('无法获取 cookie, 终止'); process.exit(1); }
  // 受限 token: 后台 API 一律 403
  const restricted = await get('/api/posts', { headers: H });
  ok('受限 token 访问后台 → 403', restricted.status === 403);
  // 改密 (受限 token 允许) → 清除标记
  const pwd = await put('/api/auth/password', { body: { currentPassword: 'admin123', newPassword: 'verify-pw-2026' }, headers: H });
  ok('受限 token 可改密', is200(pwd));
  const login2 = await post('/api/auth/login', { body: { password: 'verify-pw-2026' } });
  ok('改密后登录 must_change=false', is200(login2) && login2.data?.must_change === false);
  cookie = login2.headers.getSetCookie?.()?.[0] || login2.headers.get('set-cookie');
  H = { Cookie: cookie?.match(/blog_token=([^;]+)/)?.[0] || '' };

  // ─── 基础数据 (无演示内容) ───
  sec('2. 基础数据');
  const posts = await get('/api/posts', { headers: H });
  const pages = await get('/api/pages', { headers: H });
  const comments = await get('/api/comments', { headers: H });
  const media = await get('/api/media', { headers: H });
  const cats = await get('/api/categories', { headers: H });
  const tags = await get('/api/tags', { headers: H });
  ok('文章 0 (无演示内容)', Array.isArray(posts.data) && posts.data.length === 0);
  ok('页面 0', Array.isArray(pages.data) && pages.data.length === 0);
  ok('评论 0', Array.isArray(comments.data) && comments.data.length === 0);
  ok('媒体 0', Array.isArray(media.data) && media.data.length === 0);
  ok('分类 5 (基础骨架)', Array.isArray(cats.data) && cats.data.length === 5);
  ok('标签 0', Array.isArray(tags.data) && tags.data.length === 0);

  // ─── seed 默认文案 ───
  sec('3. seed 默认文案');
  const settings = await get('/api/settings', { headers: H });
  const s = settings.data || {};
  ok('blog_title = cLog', s.blog_title === 'cLog');
  ok('blog_tagline = 文字自有重量', s.blog_tagline === '文字自有重量');
  ok('blog_slogan 默认值', s.blog_slogan === '写作 · 思考 · 记录');
  ok('blog_description 默认值', s.blog_description === '关于技术、设计与日常思考的个人笔记。不追热点，只写值得留下的东西。');
  ok('footer_note 默认值', s.footer_note === '由 Cloudflare Workers + D1 驱动');
  ok('白名单不含 password_hash', !('password_hash' in s));
  ok('白名单不含 jwt_secret', !('jwt_secret' in s));

  // ─── 安全: 敏感设置不可清除 ───
  sec('4. 敏感设置保护');
  const delSensitive = await del('/api/settings/password_hash', { headers: H });
  ok('清除 password_hash → 400', delSensitive.status === 400);

  // ─── 报告 ───
  const totalMs = Date.now() - t0;
  console.log(`\n${B}╔${'═'.repeat(38)}╗${X}`);
  console.log(`${B}║${X}  生产模式验证  ${G}${passed} 通过${X} / ${passed + failed} 项 (${totalMs}ms)${' '.repeat(8)}${B}║${X}`);
  console.log(`${B}╚${'═'.repeat(38)}╝${X}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('脚本异常:', e.message); process.exit(2); });
