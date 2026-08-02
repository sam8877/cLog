// ─── 静思录 Blog · API 集成测试 ───────────────────────────
// 用法:  node test.js [baseUrl]
// ────────────────────────────────────────────────────────

const BASE = process.argv[2] || 'http://localhost:8787';
let passed = 0, failed = 0, skipped = 0;

const G='\x1b[32m', R='\x1b[31m', Y='\x1b[33m', B='\x1b[1m', D='\x1b[2m', X='\x1b[0m';
const OK=`${G}✓${X}`, NO=`${R}✕${X}`, SK=`${Y}⊘${X}`;

function ok(l,c){if(c){console.log(`  ${OK} ${l}`);passed++}else{console.log(`  ${NO} ${l}`);failed++}}
function fail(l,m){console.log(`  ${NO} ${l} — ${m}`);failed++}
function skip(l,r){console.log(`  ${SK} ${l} (${r})`);skipped++}

// ─── 执行时间统计 (节级计时 + 汇总) ──────────────────────
const secTimes = [];
let secStart = null;
let secName = '';
function sec(t){
  if (secStart !== null) secTimes.push({ name: secName, ms: Date.now() - secStart });
  secName = t; secStart = Date.now();
  console.log(`\n${B}── ${t}${X}`);
}
function note(m){console.log(`  ${D}${m}${X}`)}

// ─── HTTP 工具 ──────────────────────────────────────────

let cookie = '';

async function req(method, path, opts = {}) {
  const url = BASE + path;
  const headers = { ...opts.headers };
  if (opts.body !== undefined && opts.body !== null) {
    if (typeof opts.body === 'string') {
      headers['Content-Type'] = opts.contentType || 'text/plain';
    } else {
      headers['Content-Type'] = 'application/json';
    }
  }
  if (cookie) headers['Cookie'] = cookie;
  const res = await fetch(url, {
    method, headers,
    body: typeof opts.body === 'string' ? opts.body
          : (opts.body !== undefined && opts.body !== null ? JSON.stringify(opts.body) : undefined),
    redirect: 'manual'
  });
  // 兼容 Node 版本差异: undici 规范要求用 getSetCookie() 读取 set-cookie
  // (Node 22 的 headers.get('set-cookie') 返回 null, Node 24 部分版本可读)
  const sc = res.headers.getSetCookie?.()?.[0] || res.headers.get('set-cookie');
  if (sc) { const m = sc.match(/blog_token=([^;]+)/); if (m) cookie = `blog_token=${m[1]}`; }
  const text = await res.text();
  try { return { status: res.status, headers: res.headers, data: JSON.parse(text), text }; }
  catch { return { status: res.status, headers: res.headers, text }; }
}

const get  = (p,o) => req('GET', p, o);
const post = (p,o) => req('POST', p, o);
const put  = (p,o) => req('PUT', p, o);
const del  = (p,o) => req('DELETE', p, o);

const is200 = r => r.status === 200;
const is201 = r => r.status === 201;
const is400 = r => r.status === 400;
const is401 = r => r.status === 401;
const is404 = r => r.status === 404;
const is500 = r => r.status === 500;
const has   = (r, s) => r.text.includes(s);
const jsonType = r => (r.headers.get('content-type') || '').includes('application/json');

// ─── 登录助手 ──────────────────────────────────────────

async function login(pw = 'admin123') {
  cookie = '';
  const r = await post('/api/auth/login', { body: { password: pw } });
  return r;
}

// ────────────────────────────────────────────────────────

async function run() {
  const runStart = Date.now();
  const bar = '═'.repeat(38);
  console.log(`\n${B}╔${bar}╗${X}`);
  console.log(`${B}║${X}  静思录 Blog · 全功能验证 v2          ${B}║${X}`);
  console.log(`${B}║${X}  ${D}${BASE}${X}  ${B}║${X}`);
  console.log(`${B}╚${bar}╝${X}`);

  // ========================================================
  //  1. 公开页面路由
  // ========================================================
  sec('1. 公开页面路由');

  const routes = [
    ['GET /', '/'],
    ['GET /post/knowledge-management-system', '/post/knowledge-management-system'],
    ['GET /page/about', '/page/about'],
    ['GET /archive', '/archive'],
    ['GET /search?q=Rust', '/search?q=Rust'],
    ['GET /login', '/login'],
    ['GET /admin', '/admin'],
    ['GET /admin/settings', '/admin/settings'],
  ];
  for (const [label, path] of routes) {
    const r = await get(path);
    ok(`${label} → 200 + HTML`, is200(r) && has(r, '<!doctype html'));
  }
  {
    const r = await get('/post/__never_exists__');
    ok('GET /post/不存在 → 404', is404(r));
  }
  {
    const r = await get('/page/__never_exists__');
    ok('GET /page/不存在 → 404', is404(r));
  }
  {
    const r = await get('/api/__bogus__');
    ok('GET /api/不存在 → 401 (auth拦截)', is401(r));
  }

  // ========================================================
  //  2. 认证 — 正常流程
  // ========================================================
  sec('2. 认证 — 正常流程');

  {
    const r = await post('/api/auth/login', { body: { password: 'wrong' } });
    ok('错误密码 → 401 + JSON', is401(r) && jsonType(r));
  }
  {
    const r = await post('/api/auth/login', { body: { password: '' } });
    ok('空密码 → 400', is400(r));
  }
  {
    const r = await post('/api/auth/login', { body: { password: 'admin123' } });
    ok('正确密码 → 200 + Set-Cookie', is200(r) && r.data?.success && !!cookie);
  }
  {
    const r = await get('/api/auth/check');
    ok('已登录 → authenticated=true', is200(r) && r.data?.authenticated === true);
  }
  {
    const r = await post('/api/auth/logout');
    ok('登出 → 200', is200(r));
    cookie = '';
  }
  {
    const r = await get('/api/auth/check');
    ok('登出后 → authenticated=false', is200(r) && r.data?.authenticated === false);
  }

  // ========================================================
  //  3. 认证 — 边界 & 异常
  // ========================================================
  sec('3. 认证 — 边界 & 异常');

  {
    const r = await post('/api/auth/login', { body: 'not-json', contentType: 'text/plain' });
    ok('非法 JSON body → 500', is500(r));
  }
  {
    const r = await post('/api/auth/login', { body: {} });
    ok('缺少 password 字段 → 400', is400(r));
  }
  {
    const r = await post('/api/auth/login', { body: { password: 'a'.repeat(1000) } });
    ok('超长密码 → 401 (不是400)', is401(r));
  }
  // 伪造 token
  {
    cookie = 'blog_token=evil.fake.token';
    const r = await get('/api/stats');
    ok('伪造 token → 401', is401(r));
    cookie = '';
  }
  // Bearer token 认证
  {
    await login();
    const token = cookie.replace('blog_token=', '');
    cookie = '';
    const r = await get('/api/stats', { headers: { 'Authorization': `Bearer ${token}` } });
    ok('Bearer Authorization → 200', is200(r));
  }
  {
    const r = await get('/api/stats', { headers: { 'Authorization': 'Bearer bad.token.here' } });
    ok('非法 Bearer token → 401', is401(r));
  }
  // 无认证
  {
    cookie = '';
    const r = await get('/api/posts');
    ok('未登录 GET /api/posts → 401', is401(r));
  }
  {
    const r = await post('/api/posts', { body: { title: 'x' } });
    ok('未登录 POST /api/posts → 401', is401(r));
  }

  // ─── 重新登录给后续后台测试用
  await login();
  if (!cookie) { fail('重新登录', '无法获取 cookie，后台 API 测试将不可用'); }

  // ═══ 以下所有测试依赖 cookie ═══════════════════════

  // ========================================================
  //  4. 文章 — 创建边界
  // ========================================================
  sec('4. 文章 — 创建边界');

  // 清理之前测试可能留下的脏数据（避免 slug 冲突）
  {
    const all = await get('/api/posts');
    const seeds = new Set(['knowledge-management-system','css-container-queries','rust-async-runtime','blog-system-design','typescript-56','bad-first-draft']);
    if (Array.isArray(all.data)) {
      let cleaned = 0;
      for (const p of all.data) {
        if (seeds.has(p.slug)) continue;
        if (!p.slug) continue; // 空 slug 无法通过 REST 删除，跳过
        await del('/api/posts/' + encodeURIComponent(p.slug));
        cleaned++;
      }
      if (cleaned > 0) note(`预清理 ${cleaned} 条残留测试数据`);
    }
  }

  const ts = 't' + Date.now().toString(36);
  let createdSlugs = [];

  // Test helper: create post + remember slug for cleanup
  async function tryCreate(body, label, check) {
    const r = await post('/api/posts', { body });
    ok(label, check(r));
    if (r.data?.slug && r.status === 200) createdSlugs.push(r.data.slug);
    return r;
  }

  await tryCreate(
    { title: '纯中文标题测试', content: '正文', status: 'draft' },
    '纯中文标题自动生成 slug',
    r => is200(r) && r.data?.slug && r.data.slug.startsWith('post-')
  );
  await tryCreate(
    { slug: 'custom-slug-' + ts, title: '指定 slug', content: '正文', status: 'draft' },
    '手动指定 slug 生效',
    r => is200(r) && r.data?.slug === 'custom-slug-' + ts
  );
  await tryCreate(
    { slug: 'custom-slug-' + ts, title: '重复 slug', content: '正文', status: 'draft' },
    '重复 slug → 500',
    r => is500(r)
  );
  await tryCreate(
    { title: '最小字段', content: '', status: 'draft' },
    '空正文可以创建',
    r => is200(r) && r.data?.success
  );
  await tryCreate(
    { slug: 'tag-test-' + ts, title: '标签测试', content: '正文', status: 'draft', tags: ['纯中文标签名'] },
    '纯中文标签自动生成 slug',
    r => is200(r) && r.data?.success
  );
  await tryCreate(
    { slug: 'xss-test-' + ts, title: '特殊字符 <script>alert(1)</script>', content: '正文', status: 'draft' },
    '标题含 HTML 标签 → 200',
    r => is200(r)
  );
  await tryCreate(
    { slug: 'sqli-test-' + ts, title: "SQL注入测试' OR 1=1--", content: '正文', status: 'draft' },
    '标题含 SQL 片段 → 200',
    r => is200(r)
  );
  {
    const r = await post('/api/posts', { body: {
      slug: 'empty-tags-' + ts, title: '空标签数组', content: '正文', status: 'draft', tags: []
    }});
    ok('空 tags 数组 → 200', is200(r));
    if (r.data?.slug) createdSlugs.push(r.data.slug);
  }
  {
    // non-JSON body
    const r = await post('/api/posts', { body: 'garbage', contentType: 'text/plain' });
    ok('非法 JSON → 500', is500(r));
  }

  // 清理创建的测试文章
  note(`清理 ${createdSlugs.length} 篇测试文章...`);
  for (const s of createdSlugs) await del('/api/posts/' + s);
  createdSlugs = [];
  // 清理孤儿标签 (删文章不删标签, 防跨运行累积)
  {
    const allTags = await get('/api/tags');
    let cleanedTags = 0;
    if (Array.isArray(allTags.data)) {
      for (const t of allTags.data) {
        if (t.name === '纯中文标签名') { await del('/api/tags/' + t.slug); cleanedTags++; }
      }
    }
    if (cleanedTags > 0) note(`清理 ${cleanedTags} 个孤儿标签`);
  }

  // ========================================================
  //  5. 文章 — 更新 & 删除边界
  // ========================================================
  sec('5. 文章 — 更新 & 删除边界');

  {
    const r = await put('/api/posts/__never_exists__', { body: { title: 'x' } });
    ok('更新不存在的文章 → 200 (静默)', is200(r));
  }
  {
    const r = await del('/api/posts/__never_exists__');
    ok('删除不存在的文章 → 200 (幂等)', is200(r));
  }
  {
    const r = await put('/api/posts/knowledge-management-system', { body: { status: 'draft' } });
    ok('修改状态为草稿 → 200', is200(r));
    await put('/api/posts/knowledge-management-system', { body: { status: 'published' } });
    note('恢复状态: OK');
  }
  {
    const r = await put('/api/posts/knowledge-management-system', { body: {} });
    ok('空 body 更新 → 200 (无变更)', is200(r));
  }

  // ========================================================
  //  6. 评论 — 边界 & 异常
  // ========================================================
  sec('6. 评论 — 边界 & 异常');

  let testCommentIds = [];

  {
    const r = await post('/api/comments', { body: {
      post_slug: 'knowledge-management-system', author: '边界测试', body: '正常评论'
    }});
    ok('正常提交 → 200 + id', is200(r) && r.data?.success && r.data?.id);
    if (r.data?.id) testCommentIds.push(r.data.id);
  }
  {
    const r = await post('/api/comments', { body: {
      post_slug: 'knowledge-management-system', author: '', body: '空作者'
    }});
    ok('空作者名 → 400', is400(r));
  }
  {
    const r = await post('/api/comments', { body: {
      post_slug: 'knowledge-management-system', author: '用户', body: ''
    }});
    ok('空评论正文 → 400', is400(r));
  }
  {
    const r = await post('/api/comments', { body: {
      author: '用户', body: '无post_slug'
    }});
    ok('缺少 post_slug → 400', is400(r));
  }
  {
    const r = await post('/api/comments', { body: {
      post_slug: '__never_exists__', author: '用户', body: '评论不存在的文章'
    }});
    ok('评论不存在的文章 → 500', is500(r));
  }
  {
    const bodyText = 'A'.repeat(10000);
    const r = await post('/api/comments', { body: {
      post_slug: 'knowledge-management-system', author: '长文本测试', body: bodyText
    }});
    ok('超长评论 10000 字符 → 200', is200(r));
    if (r.data?.id) testCommentIds.push(r.data.id);
  }
  {
    const r = await post('/api/comments', { body: {
      post_slug: 'knowledge-management-system', author: '<script>alert(1)</script>', body: '<b>XSS</b>'
    }});
    ok('评论含 HTML → 200 (不转义存储)', is200(r));
    if (r.data?.id) testCommentIds.push(r.data.id);
  }
  {
    // non-JSON body
    const r = await post('/api/comments', { body: 'not json', contentType: 'text/plain' });
    ok('非法 JSON → 500', is500(r));
  }

  // 审核边界
  if (testCommentIds.length > 0) {
    const cid = testCommentIds[0];
    {
      const r = await put('/api/comments/' + cid, { body: { status: 'approved' } });
      ok('批准评论 → 200', is200(r));
    }
    {
      const r = await put('/api/comments/' + cid, { body: { status: 'invalid_status' } });
      ok('无效 status 值 → 500', is500(r));
    }
    {
      const r = await put('/api/comments/__never_exists__', { body: { status: 'approved' } });
      ok('审核不存在的评论 → 200 (静默)', is200(r));
    }
    // 批量清理
    for (const cid of testCommentIds) await del('/api/comments/' + cid);
    note(`清理 ${testCommentIds.length} 条测试评论: OK`);
    testCommentIds = [];
  }

  // ========================================================
  //  7. 标签 — 边界
  // ========================================================
  sec('7. 标签 — 边界');

  const tagTs = Date.now().toString(36);
  {
    const r = await post('/api/tags', { body: { slug: 'edge-tag-' + tagTs, name: '边界标签' } });
    ok('创建标签 → 200', is200(r));
  }
  {
    const r = await post('/api/tags', { body: { slug: 'edge-tag-' + tagTs, name: '重复slug' } });
    ok('重复 slug 创建 → 200 (INSERT OR IGNORE)', is200(r));
  }
  {
    const r = await put('/api/tags/__never_exists__', { body: { name: 'x' } });
    ok('更新不存在的标签 → 200 (静默)', is200(r));
  }
  {
    const r = await del('/api/tags/__never_exists__');
    ok('删除不存在的标签 → 200 (幂等)', is200(r));
  }
  {
    const r = await put('/api/tags/edge-tag-' + tagTs, { body: { name: '边界标签-已更名' } });
    ok('更新标签名 → 200', is200(r));
  }
  // 清理
  await del('/api/tags/edge-tag-' + tagTs);

  // ========================================================
  //  8. 分类 — 边界
  // ========================================================
  sec('8. 分类 — 边界');

  const catTs = Date.now().toString(36);
  {
    const r = await post('/api/categories', { body: {
      slug: 'edge-cat-' + catTs, name: '边界分类', description: '', sort_order: 0
    }});
    ok('创建分类 → 200', is200(r));
  }
  {
    const r = await post('/api/categories', { body: {
      slug: 'edge-cat-' + catTs, name: '重复分类', description: '', sort_order: 1
    }});
    ok('重复 slug 分类 → 200 (INSERT OR IGNORE)', is200(r));
  }
  {
    const r = await put('/api/categories/__never_exists__', { body: { name: 'x' } });
    ok('更新不存在的分类 → 200 (静默)', is200(r));
  }
  {
    const r = await del('/api/categories/__never_exists__');
    ok('删除不存在的分类 → 200 (幂等)', is200(r));
  }
  // 清理
  await del('/api/categories/edge-cat-' + catTs);

  // ========================================================
  //  9. 密码修改 — 边界
  // ========================================================
  sec('9. 密码修改 — 边界');

  {
    const r = await put('/api/auth/password', { body: 'garbage', contentType: 'text/plain' });
    ok('非法 JSON → 500', is500(r));
  }
  {
    const r = await put('/api/auth/password', { body: {} });
    ok('空 JSON → 400', is400(r));
  }
  {
    const r = await put('/api/auth/password', { body: {
      currentPassword: 'admin123', newPassword: ''
    }});
    ok('空新密码 → 400', is400(r));
  }
  {
    const r = await put('/api/auth/password', { body: {
      currentPassword: 'admin123', newPassword: '12345678'
    }});
    ok('纯数字密码 → 400 (需含字母)', is400(r));
  }
  {
    const r = await put('/api/auth/password', { body: {
      currentPassword: 'admin123', newPassword: 'abcdefgh'
    }});
    ok('纯字母密码 → 400 (需含数字)', is400(r));
  }
  {
    const r = await put('/api/auth/password', { body: {
      currentPassword: 'admin123', newPassword: 'a1b2c3d8'
    }});
    ok('刚好 8 位含字母数字 → 200', is200(r) && r.data?.success);
  }
  // 改回
  await put('/api/auth/password', { body: {
    currentPassword: 'a1b2c3d8', newPassword: 'admin123'
  }});

  // ========================================================
  // 10. 设置 — 边界
  // ========================================================
  sec('10. 设置 — 边界');

  {
    const r = await put('/api/settings', { body: {} });
    ok('空对象 → 200', is200(r));
  }
  {
    const r = await put('/api/settings', { body: 'bad', contentType: 'text/plain' });
    ok('非法 JSON → 500', is500(r));
  }
  {
    const r = await put('/api/settings', { body: { unknown_key: 'value' } });
    ok('未知 key → 200 (允许任意kv)', is200(r));
  }
  // 白名单读取 — 绝不返回敏感设置
  {
    const r = await get('/api/settings');
    ok('GET /api/settings → 200 + JSON', is200(r) && jsonType(r));
    {
      const saved = cookie;
      cookie = '';
      const r401 = await get('/api/settings');
      ok('未登录 GET /api/settings → 401', is401(r401));
      cookie = saved;
    }
    ok('含 blog_title', typeof r.data?.blog_title === 'string');
    ok('含 blog_tagline', typeof r.data?.blog_tagline === 'string');
    ok('不含 password_hash', !('password_hash' in (r.data || {})));
    ok('不含 jwt_secret', !('jwt_secret' in (r.data || {})));
  }
  // site_url → RSS 绝对链接
  {
    await put('/api/settings', { body: { site_url: 'https://example.com' } });
    const r = await get('/rss.xml');
    ok('site_url 生效: RSS 绝对链接', has(r, '<link>https://example.com/post/'));
    await put('/api/settings', { body: { site_url: '' } });
    const r2 = await get('/rss.xml');
    ok('清空 site_url → RSS 相对链接', !has(r2, 'https://example.com'));
  }

  // ========================================================
  // 11. 统计 — 数据一致性
  // ========================================================
  sec('11. 统计 — 数据一致性');

  // 创建文章 → 统计增加 → 删除文章 → 统计恢复
  let s1, s2, s3;
  {
    s1 = (await get('/api/stats')).data;
    ok('stats 是合法 JSON 对象', s1 && typeof s1.total_posts === 'number');
  }
  const tmpTitle = 'Stats-Test-' + Date.now().toString(36);
  {
    const r = await post('/api/posts', { body: {
      title: tmpTitle, content: '正文', status: 'published'
    }});
    ok('创建文章成功', is200(r) && r.data?.success);
    if (r.data?.slug) createdSlugs.push(r.data.slug);
  }
  {
    s2 = (await get('/api/stats')).data;
    ok('total_posts +1', s2.total_posts === s1.total_posts + 1);
  }
  // 清理
  for (const s of createdSlugs) await del('/api/posts/' + s);
  {
    s3 = (await get('/api/stats')).data;
    ok('删除后 total_posts 恢复', s3.total_posts === s1.total_posts);
  }

  // ========================================================
  // 12-16 (页面 HTML 结构检查) 已迁移至 e2e UI 测试 —
  // 原为字符串包含的弱断言, e2e 中以可见性/computed style 等更强断言覆盖

  // ========================================================
  // 17. 安全响应头
  // ========================================================
  sec('12. 安全响应头');

  {
    const r = await get('/');
    ok('CSP 存在', (r.headers.get('content-security-policy') || '').includes("default-src 'self'"));
    ok('X-Content-Type-Options: nosniff', r.headers.get('x-content-type-options') === 'nosniff');
    ok('X-Frame-Options 存在', !!r.headers.get('x-frame-options'));
    ok('Referrer-Policy 存在', !!r.headers.get('referrer-policy'));
  }

  // ========================================================
  // 18. RSS 订阅
  // ========================================================
  sec('13. RSS 订阅');

  {
    const r = await get('/rss.xml');
    ok('RSS 200 + XML', is200(r) && has(r, '<rss version="2.0"'));
    ok('RSS 含文章标题', has(r, '知识管理系统'));
    ok('RSS 全文 content:encoded', has(r, 'content:encoded'));
    ok('RSS content-type', (r.headers.get('content-type') || '').includes('application/rss+xml'));
  }

  // ========================================================
  // 19. 媒体上传 (R2 + D1)
  // ========================================================
  sec('14. 媒体上传');

  let mediaId = null;
  const PNG_1PX = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  {
    const fd = new FormData();
    fd.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'test.png');
    const r = await fetch(BASE + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd });
    const data = await r.json().catch(() => null);
    ok('上传图片 → 200 + id', r.status === 200 && data?.id);
    mediaId = data?.id || null;
  }
  if (mediaId) {
    const r = await get('/media/' + mediaId);
    ok('公开读取 → 200 + image/png', is200(r) && (r.headers.get('content-type') || '').includes('image/png'));
  }
  {
    const fd = new FormData();
    fd.append('file', new Blob(['text'], { type: 'text/plain' }), 'a.txt');
    const r = await fetch(BASE + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd });
    ok('非图片文件 → 400', r.status === 400);
  }
  {
    const fd = new FormData();
    fd.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'x.png');
    const r = await fetch(BASE + '/api/media', { method: 'POST', body: fd });
    ok('未登录上传 → 401', r.status === 401);
  }
  {
    // 超过 10MB 限制
    const big = Buffer.alloc(10 * 1024 * 1024 + 1024);
    const fd = new FormData();
    fd.append('file', new Blob([big], { type: 'image/png' }), 'big.png');
    const r = await fetch(BASE + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd });
    ok('超过 10MB → 400', r.status === 400);
  }
  if (mediaId) {
    const r = await del('/api/media/' + mediaId);
    ok('删除媒体 → 200', is200(r));
    const r2 = await get('/media/' + mediaId);
    ok('删除后读取 → 404', is404(r2));
  }

  // ========================================================
  // 20. 分页
  // ========================================================
  sec('15. 分页');

  {
    await put('/api/settings', { body: { per_page: '2' } });
    const r1 = await get('/');
    ok('per_page=2 时首页有分页器', has(r1, '<nav class="pager"'));
    ok('分页信息 1 / 3', has(r1, '1 / 3'));
    const r2 = await get('/?page=2');
    ok('第 2 页 → 200', is200(r2));
    ok('第 2 页含文章列表', has(r2, 'log-row'));
    const r3 = await get('/archive?page=2');
    ok('归档分页 → 200', is200(r3));
    ok('归档含分页器', has(r3, '<nav class="pager"'));
    await put('/api/settings', { body: { per_page: '10' } });
    const r4 = await get('/');
    ok('恢复 10 篇/页后无分页器', !has(r4, '<nav class="pager"'));
    // 非法分页参数回退第 1 页
    for (const bad of ['0', '-1', 'abc', '999']) {
      const r = await get('/?page=' + bad);
      ok('page=' + bad + ' → 200 且可渲染', is200(r) && has(r, '<!doctype html'));
    }
    // 非法 per_page 回退默认 10
    await put('/api/settings', { body: { per_page: 'abc' } });
    const r5 = await get('/');
    ok('per_page 非法 → 回退默认(无分页器)', is200(r5) && !has(r5, '<nav class="pager"'));
    await put('/api/settings', { body: { per_page: '10' } });
  }

  // ========================================================
  // 21. 限流 (阈值临时调低, 测试后恢复)
  // ========================================================
  sec('16. 限流');

  {
    await login(); // 成功登录清除失败计数
    await put('/api/settings', { body: { login_max_attempts: '2' } });
    const s1 = await post('/api/auth/login', { body: { password: 'wrong' } });
    const s2 = await post('/api/auth/login', { body: { password: 'wrong' } });
    const s3 = await post('/api/auth/login', { body: { password: 'wrong' } });
    ok('登录失败 1/2 次 → 401', is401(s1) && is401(s2));
    ok('登录失败第 3 次 → 429', s3.status === 429);
    await put('/api/settings', { body: { login_max_attempts: '10' } });
    const r = await login();
    ok('恢复阈值后可正常登录', is200(r));
  }
  {
    await login();
    await put('/api/settings', { body: { comment_max_per_window: '2' } });
    // 用独立模拟 IP 隔离计数, 避免历史访客评论计数干扰
    // (生产环境 Cloudflare 会覆盖客户端传入的 cf-connecting-ip, 无安全风险)
    const fakeIp = { 'cf-connecting-ip': '203.0.113.' + (1 + Math.floor(Math.random() * 250)) };
    cookie = '';
    const c1 = await post('/api/comments', { body: { post_slug: 'knowledge-management-system', author: '限流测试A', body: 'x' }, headers: fakeIp });
    const c2 = await post('/api/comments', { body: { post_slug: 'knowledge-management-system', author: '限流测试B', body: 'x' }, headers: fakeIp });
    const c3 = await post('/api/comments', { body: { post_slug: 'knowledge-management-system', author: '限流测试C', body: 'x' }, headers: fakeIp });
    ok('访客评论 1/2 条 → 200', is200(c1) && is200(c2));
    ok('访客评论第 3 条 → 429', c3.status === 429);
    await login();
    await put('/api/settings', { body: { comment_max_per_window: '10' } });
    const allC = await get('/api/comments');
    if (Array.isArray(allC.data)) {
      let cleaned = 0;
      for (const c of allC.data) {
        if (/^限流测试/.test(c.author || '')) { await del('/api/comments/' + c.id); cleaned++; }
      }
      if (cleaned > 0) note(`清理 ${cleaned} 条限流测试评论`);
    }
  }

  // ========================================================
  // 17. 版本管理
  // ========================================================
  sec('17. 版本管理');

  const revSlug = 'rev-' + Date.now().toString(36);
  let revIds = [];
  {
    // 草稿创建 → 无版本
    await post('/api/posts', { body: { slug: revSlug, title: '版本测试', content: 'v0 草稿', status: 'draft' } });
    const r = await get('/api/posts/' + revSlug + '/revisions');
    ok('草稿创建 → 版本列表为空', is200(r) && Array.isArray(r.data) && r.data.length === 0);
    // 发布 → 版本 #1
    await put('/api/posts/' + revSlug, { body: { status: 'published' } });
    const r1 = await get('/api/posts/' + revSlug + '/revisions');
    ok('发布 → 生成版本 (note=发布)', is200(r1) && r1.data.length === 1 && r1.data[0].note === '发布');
    revIds = r1.data.map(v => v.id);
    // 编辑已发布 → 新版本
    await put('/api/posts/' + revSlug, { body: { content: 'v2 修改' } });
    const r2 = await get('/api/posts/' + revSlug + '/revisions');
    ok('编辑已发布 → 新版本 (note=编辑)', is200(r2) && r2.data.length === 2 && r2.data[0].note === '编辑');
    // 版本列表不含 content (轻量)
    ok('列表不含 content', r2.data.every(v => !('content' in v)));
    // 版本详情含 content
    const detail = await get('/api/revisions/' + revIds[0]);
    ok('版本详情 → 200 + content', is200(detail) && detail.data?.content === 'v0 草稿');
    // 恢复 → 内容回滚 + 留痕
    const restore = await post('/api/revisions/' + revIds[0] + '/restore');
    ok('恢复版本 → 200', is200(restore));
    const postData = await get('/api/posts/' + revSlug);
    ok('恢复后内容回滚', postData.data?.content === 'v0 草稿');
    ok('恢复后状态保持 (published)', postData.data?.status === 'published');
    const r3 = await get('/api/posts/' + revSlug + '/revisions');
    ok('恢复动作留痕', r3.data.length === 3 && /从版本 #/.test(r3.data[0].note));
    // 下线 → 版本 (note=下线)
    await put('/api/posts/' + revSlug, { body: { status: 'draft' } });
    const r4 = await get('/api/posts/' + revSlug + '/revisions');
    ok('下线 → 新版本 (note=下线)', r4.data.length === 4 && r4.data[0].note === '下线');
    // 恢复不存在的版本 → 404
    const bad = await post('/api/revisions/999999/restore');
    ok('恢复不存在版本 → 404', is404(bad));
    {
      const r = await get('/api/revisions/999999');
      ok('版本详情不存在 → 404', is404(r));
    }
    // 清理
    await del('/api/posts/' + revSlug);
    const r5 = await get('/api/posts/' + revSlug + '/revisions');
    ok('删除文章后版本仍保留 (审计留痕)', is200(r5) && r5.data.length === 4);
    // 清理版本记录 (保持测试库干净)
    for (const id of r5.data.map(v => v.id)) {
      const revRow = await get('/api/revisions/' + id);
      if (revRow.data?.entity_slug === revSlug) {
        // 版本记录无删除接口, 通过直接清理接口外 SQL 不现实 — 保留可接受 (测试库)
      }
    }
  }
  {
    // 页面版本 (无单页 GET 接口, 用列表取内容)
    const pageSlug = 'about';
    const orig = (await get('/api/pages')).data.find(p => p.slug === pageSlug);
    // 前置守卫: 测试会把内容修改再还原, 若前置数据已脏会传播污染 — 快速失败
    if (!orig?.content?.includes('关于静思录')) {
      fail('页面版本测试前置数据', 'about 页面内容异常, 请先恢复 seed 数据');
    }
    await put('/api/pages/' + pageSlug, { body: { content: '页面版本测试内容' } });
    const r = await get('/api/pages/' + pageSlug + '/revisions');
    ok('页面编辑(已发布) → 生成版本', is200(r) && r.data.length >= 1 && r.data[0].note === '编辑');
    // 恢复页面版本
    const rev = r.data[r.data.length - 1];
    const restore = await post('/api/revisions/' + rev.id + '/restore');
    ok('页面版本恢复 → 200', is200(restore));
    const after = (await get('/api/pages')).data.find(p => p.slug === pageSlug);
    ok('页面内容回滚', after?.content === '页面版本测试内容');
    // 还原原始内容 (避免污染后续测试)
    await put('/api/pages/' + pageSlug, { body: { content: orig.content } });
    const check = (await get('/api/pages')).data.find(p => p.slug === pageSlug);
    ok('还原页面原始内容', check?.content === orig.content);
  }

  // ========================================================
  // 18. 跨流程串联
  // ========================================================
  sec('18. 跨流程串联');

  // 数据前缀: 串联测试(文章) / 串联评论 / 串联标签 / 串联分类 / flow-* slug
  // 契约说明: 标签计数计草稿(getTags 不区分状态), 分类计数只计已发布(getCategories)
  //           — 不对称行为被固化为契约, 若产品统一口径此用例会首先失败提醒
  const fakeIp = () => ({ 'cf-connecting-ip': '203.0.113.' + (1 + Math.floor(Math.random() * 250)) });

  // ─── A: 发布→全站可见→下线→全站消失→重发布 (含相关推荐联动) ───
  {
    const slug = 'flow-pub-' + ts;
    const title = '串联测试发布' + Date.now().toString(36);
    const q = encodeURIComponent(title.slice(0, 6));
    await post('/api/posts', { body: { slug, title, content: '## 串联正文', category: 'tech', status: 'draft' } });
    // 草稿全站不可见
    ok('A: 草稿公开页 404', is404(await get('/post/' + slug)));
    ok('A: 草稿不在首页', !has(await get('/'), title));
    ok('A: 草稿不在归档', !has(await get('/archive'), title));
    ok('A: 草稿不在搜索', !has(await get('/search?q=' + q), title));
    ok('A: 草稿不在 RSS', !has(await get('/rss.xml'), title));
    ok('A: 草稿无版本', (await get('/api/posts/' + slug + '/revisions')).data?.length === 0);
    // 发布 → 全站可见
    await put('/api/posts/' + slug, { body: { status: 'published' } });
    ok('A: 发布后公开页 200', is200(await get('/post/' + slug)));
    ok('A: 发布后首页可见', has(await get('/'), title));
    ok('A: 发布后归档可见', has(await get('/archive'), title));
    ok('A: 发布后搜索可见', has(await get('/search?q=' + q), title));
    const rssA = await get('/rss.xml');
    ok('A: 发布后 RSS 可见 (含链接)', has(rssA, title) && has(rssA, '/post/' + slug));
    // 相关推荐联动: 同 tech 分类的 seed 文章相关卡片应含新文章
    ok('A: 相关推荐包含新文章', has(await get('/post/knowledge-management-system'), title));
    const rv1 = await get('/api/posts/' + slug + '/revisions');
    ok('A: 发布版本 note=发布', rv1.data?.length === 1 && rv1.data[0].note === '发布');
    // 下线 → 全站消失
    await put('/api/posts/' + slug, { body: { status: 'draft' } });
    ok('A: 下线后公开页 404', is404(await get('/post/' + slug)));
    ok('A: 下线后首页消失', !has(await get('/'), title));
    ok('A: 下线后 RSS 消失', !has(await get('/rss.xml'), title));
    ok('A: 下线后相关推荐移除', !has(await get('/post/knowledge-management-system'), title));
    const rv2 = await get('/api/posts/' + slug + '/revisions');
    ok('A: 下线版本 note=下线', rv2.data?.length === 2 && rv2.data[0].note === '下线');
    // 重发布 → 恢复
    await put('/api/posts/' + slug, { body: { status: 'published' } });
    ok('A: 重发布恢复可见', is200(await get('/post/' + slug)));
    await del('/api/posts/' + slug);
  }

  // ─── B: 评论计数动态 + 限流不计 + 下线保留 ───
  {
    const slug = 'flow-cmt-' + ts;
    const title = '串联测试评论' + Date.now().toString(36);
    await put('/api/settings', { body: { comment_max_per_window: '1000' } });
    await post('/api/posts', { body: { slug, title, content: 'x', status: 'published' } });
    ok('B: 自建文章基准计数 0', has(await get('/post/' + slug), '评论 (0)'));
    // 访客提交 2 条 (清 cookie 模拟访客 + 唯一 IP 隔离计数)
    const ip = fakeIp();
    const savedB = cookie;
    cookie = '';
    const authors = ['串联评论A' + ts, '串联评论B' + ts];
    const c1 = await post('/api/comments', { body: { post_slug: slug, author: authors[0], body: 'x' }, headers: ip });
    const c2 = await post('/api/comments', { body: { post_slug: slug, author: authors[1], body: 'x' }, headers: ip });
    cookie = savedB;
    ok('B: 访客评论提交 200', is200(c1) && is200(c2));
    ok('B: pending 不计入公开计数', has(await get('/post/' + slug), '评论 (0)'));
    // 逐条批准 → 计数联动
    await put('/api/comments/' + c1.data.id, { body: { status: 'approved' } });
    ok('B: 批准 1 条 → 计数 1', has(await get('/post/' + slug), '评论 (1)'));
    await put('/api/comments/' + c2.data.id, { body: { status: 'approved' } });
    ok('B: 批准 2 条 → 计数 2', has(await get('/post/' + slug), '评论 (2)'));
    // 删除 1 条 → 回落
    await del('/api/comments/' + c1.data.id);
    ok('B: 删除评论 → 计数回落 1', has(await get('/post/' + slug), '评论 (1)'));
    // 清理
    await del('/api/comments/' + c2.data.id);
    await del('/api/posts/' + slug);
    await put('/api/settings', { body: { comment_max_per_window: '10' } });
  }
  {
    // B2: 限流 429 不产生评论, 计数不变
    const slug = 'flow-cmt-' + ts + 'b';
    await post('/api/posts', { body: { slug, title: '串联测试限流', content: 'x', status: 'published' } });
    await put('/api/settings', { body: { comment_max_per_window: '2' } });
    const ip = fakeIp();
    const savedB2 = cookie;
    cookie = '';
    const r1 = await post('/api/comments', { body: { post_slug: slug, author: '串联评论1' + ts, body: 'x' }, headers: ip });
    const r2 = await post('/api/comments', { body: { post_slug: slug, author: '串联评论2' + ts, body: 'x' }, headers: ip });
    const r3 = await post('/api/comments', { body: { post_slug: slug, author: '串联评论3' + ts, body: 'x' }, headers: ip });
    cookie = savedB2;
    ok('B2: 限流第 3 条 → 429', is200(r1) && is200(r2) && r3.status === 429);
    ok('B2: 429 不产生评论, 计数仍 0', has(await get('/post/' + slug), '评论 (0)'));
    await put('/api/settings', { body: { comment_max_per_window: '10' } });
    await del('/api/comments/' + r1.data.id);
    await del('/api/comments/' + r2.data.id);
    await del('/api/posts/' + slug);
  }
  {
    // B3: 下线期间评论保留, 重发布后计数恢复
    const slug = 'flow-cmt-' + ts + 'c';
    await post('/api/posts', { body: { slug, title: '串联测试下线保留', content: 'x', status: 'published' } });
    const c = await post('/api/comments', { body: { post_slug: slug, author: '串联评论C' + ts, body: 'x' } }); // 管理员 → approved
    ok('B3: 发布期评论计数 1', has(await get('/post/' + slug), '评论 (1)'));
    await put('/api/posts/' + slug, { body: { status: 'draft' } });
    ok('B3: 下线后公开页 404', is404(await get('/post/' + slug)));
    ok('B3: 下线后评论数据保留', (await get('/api/comments')).data.some(x => x.id === c.data.id));
    await put('/api/posts/' + slug, { body: { status: 'published' } });
    ok('B3: 重发布后计数恢复 1', has(await get('/post/' + slug), '评论 (1)'));
    await del('/api/comments/' + c.data.id);
    await del('/api/posts/' + slug);
  }

  // ─── C: 媒体引用生命周期 ───
  {
    // C1: 上传 → 插入文章 → 发布渲染 → 删媒体 404 → 文章页裂图保留
    const slug = 'flow-media-' + ts;
    const fd = new FormData();
    fd.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'm.png');
    const up = await fetch(BASE + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd });
    const mediaId = (await up.json()).id;
    await post('/api/posts', { body: { slug, title: '串联测试媒体', content: '![图](/media/' + mediaId + ')', status: 'published' } });
    ok('C: 文章页含图片引用', has(await get('/post/' + slug), '/media/' + mediaId));
    ok('C: 媒体可访问 200', is200(await get('/media/' + mediaId)));
    await del('/api/media/' + mediaId);
    ok('C: 删除媒体后 404', is404(await get('/media/' + mediaId)));
    ok('C: 文章页仍含图片引用 (裂图闭环)', has(await get('/post/' + slug), '/media/' + mediaId));
    await del('/api/posts/' + slug);
  }
  {
    // C3: 删除文章不删媒体 (反向无级联, 契约)
    const slug = 'flow-media-' + ts + 'b';
    const fd = new FormData();
    fd.append('file', new Blob([PNG_1PX], { type: 'image/png' }), 'n.png');
    const up = await fetch(BASE + '/api/media', { method: 'POST', headers: { Cookie: cookie }, body: fd });
    const mediaId = (await up.json()).id;
    await post('/api/posts', { body: { slug, title: '串联测试媒体2', content: '![图](/media/' + mediaId + ')', status: 'published' } });
    await del('/api/posts/' + slug);
    ok('C3: 删除文章不删媒体', is200(await get('/media/' + mediaId)));
    await del('/api/media/' + mediaId);
    ok('C3: 删除媒体后 404', is404(await get('/media/' + mediaId)));
  }

  // ─── D: 标签/分类计数不对称 (契约) ───
  {
    const catSlug = 'flow-cat-' + ts;
    const tagSlug = 'flow-tag-' + ts;
    const slug = 'flow-draft-' + ts;
    await post('/api/categories', { body: { slug: catSlug, name: '串联分类' + ts, description: '', sort_order: 99 } });
    // tags 传 ASCII slug 当名称: slugify 后等于自身, 关联到预建标签
    await post('/api/tags', { body: { slug: tagSlug, name: '串联标签' + ts } });
    await post('/api/posts', { body: { slug, title: '串联测试草稿', content: 'x', category: catSlug, status: 'draft', tags: [tagSlug] } });
    const tagD1 = (await get('/api/tags')).data.find(t => t.slug === tagSlug);
    const catD1 = (await get('/api/categories')).data.find(c => c.slug === catSlug);
    ok('D: 草稿文章使标签计数+1 (契约)', tagD1?.post_count === 1);
    ok('D: 草稿文章分类计数为 0 (契约)', (catD1?.post_count || 0) === 0);
    await put('/api/posts/' + slug, { body: { status: 'published' } });
    ok('D: 发布后分类计数+1', (await get('/api/categories')).data.find(c => c.slug === catSlug)?.post_count === 1);
    await put('/api/posts/' + slug, { body: { status: 'draft' } });
    ok('D: 下线后标签仍计 1 (契约)', (await get('/api/tags')).data.find(t => t.slug === tagSlug)?.post_count === 1);
    ok('D: 下线后分类回 0', ((await get('/api/categories')).data.find(c => c.slug === catSlug)?.post_count || 0) === 0);
    await del('/api/posts/' + slug);
    const tagD4 = (await get('/api/tags')).data.find(t => t.slug === tagSlug);
    ok('D: 删除后标签计数回 0 且标签行保留 (孤儿)', tagD4?.post_count === 0 && !!tagD4);
    await del('/api/tags/' + tagSlug);
    await del('/api/categories/' + catSlug);
  }

  // ─── E: 删除级联 (评论/标签关联清除, 版本保留, 计数回落) ───
  {
    const slug = 'flow-cascade-' + ts;
    const tagSlug = 'flow-tag-' + ts + 'e';
    const catSlug = 'flow-cat-' + ts + 'e';
    const s1 = (await get('/api/stats')).data;
    await post('/api/categories', { body: { slug: catSlug, name: '串联分类E' + ts, description: '', sort_order: 99 } });
    await post('/api/posts', { body: { slug, title: '串联测试级联', content: 'x', category: catSlug, status: 'published', tags: [tagSlug] } });
    const cAdmin = await post('/api/comments', { body: { post_slug: slug, author: '串联评论EA' + ts, body: 'x' } }); // 管理员 → approved
    const cVis = await post('/api/comments', { body: { post_slug: slug, author: '串联评论EB' + ts, body: 'x' }, headers: fakeIp() });
    ok('E: stats 发布 +1', (await get('/api/stats')).data.total_posts === s1.total_posts + 1);
    ok('E: 首页/RSS 可见', has(await get('/'), '串联测试级联') && has(await get('/rss.xml'), '串联测试级联'));
    await del('/api/posts/' + slug);
    ok('E: 删除后公开页 404', is404(await get('/post/' + slug)));
    ok('E: 删除后 RSS 消失', !has(await get('/rss.xml'), '串联测试级联'));
    const commentsAfter = (await get('/api/comments')).data;
    ok('E: 评论级联删除', !commentsAfter.some(c => c.id === cAdmin.data.id || c.id === cVis.data.id));
    ok('E: stats 恢复', (await get('/api/stats')).data.total_posts === s1.total_posts);
    ok('E: 标签计数回 0', (await get('/api/tags')).data.find(t => t.slug === tagSlug)?.post_count === 0);
    ok('E: 分类计数回 0', ((await get('/api/categories')).data.find(c => c.slug === catSlug)?.post_count || 0) === 0);
    ok('E: 删除后版本保留 (审计)', (await get('/api/posts/' + slug + '/revisions')).data?.length >= 1);
    await del('/api/tags/' + tagSlug);
    await del('/api/categories/' + catSlug);
  }

  // ─── F: 版本恢复 → 公开页/RSS/评论/状态联动 ───
  {
    const slug = 'flow-rev-' + ts;
    await post('/api/posts', { body: { slug, title: '串联测试版本', content: '版本一内容', status: 'published' } });
    await put('/api/posts/' + slug, { body: { title: '串联测试版本2', content: '版本二内容' } });
    const c = await post('/api/comments', { body: { post_slug: slug, author: '串联评论F' + ts, body: 'x' } }); // approved
    ok('F: 编辑后公开页显示版本二', has(await get('/post/' + slug), '版本二内容'));
    ok('F: 评论计数 1', has(await get('/post/' + slug), '评论 (1)'));
    const revs = (await get('/api/posts/' + slug + '/revisions')).data;
    const rev1 = revs[revs.length - 1]; // 最旧 = 发布版本
    await post('/api/revisions/' + rev1.id + '/restore');
    ok('F: 恢复后公开页内容回滚', has(await get('/post/' + slug), '版本一内容'));
    ok('F: 恢复后标题回滚', has(await get('/post/' + slug), '<title>串联测试版本 —'));
    ok('F: 恢复后状态保持 published', (await get('/api/posts/' + slug)).data?.status === 'published');
    ok('F: 恢复不影响评论', has(await get('/post/' + slug), '评论 (1)'));
    ok('F: RSS 内容随恢复联动', has(await get('/rss.xml'), '版本一内容'));
    const revs2 = (await get('/api/posts/' + slug + '/revisions')).data;
    ok('F: 恢复留痕', revs2.length === 3 && /从版本 #/.test(revs2[0].note));
    // 子用例: 下线后恢复 → 仍 draft, 公开页不复活
    await put('/api/posts/' + slug, { body: { status: 'draft' } });
    const revs3 = (await get('/api/posts/' + slug + '/revisions')).data;
    await post('/api/revisions/' + revs3[revs3.length - 1].id + '/restore');
    ok('F: 下线后恢复仍 draft', (await get('/api/posts/' + slug)).data?.status === 'draft');
    ok('F: 恢复不复活公开页', is404(await get('/post/' + slug)));
    await del('/api/comments/' + c.data.id);
    await del('/api/posts/' + slug);
  }

  // ========================================================
  // 19. 本次 review 修复项回归 (UT)
  // ========================================================
  // 环境级修复项 (弱 JWT 密钥轮换 / DEMO_SEED 分支 / demo_seeded 分离 /
  // 初始化门) 无法在 HTTP 层验证 — 由 CI 生产模式 job 与隔离环境验证覆盖
  sec('19. review 修复项回归');

  {
    // 改密标记 (password_initial): 改回默认弱口令必须重新标记引导
    await login();
    const r1 = await post('/api/auth/login', { body: { password: 'admin123' } });
    ok('19: 默认密码登录带 must_change 引导', is200(r1) && r1.data?.must_change === true);
    // 改为强密码 → 标记清除
    await put('/api/auth/password', { body: { currentPassword: 'admin123', newPassword: 'a1b2c3d8' } });
    const r2 = await post('/api/auth/login', { body: { password: 'a1b2c3d8' } });
    ok('19: 强密码登录 must_change 清除', is200(r2) && r2.data?.must_change === false);
    // 改回默认弱口令 → 标记恢复 (review 修复: 防无提示弱口令状态)
    await put('/api/auth/password', { body: { currentPassword: 'a1b2c3d8', newPassword: 'admin123' } });
    const r3 = await post('/api/auth/login', { body: { password: 'admin123' } });
    ok('19: 改回默认密码后 must_change 恢复', is200(r3) && r3.data?.must_change === true);
    // 恢复登录态供后续使用
    await login();
    ok('19: 登录态恢复', !!cookie);
  }

  // ========================================================
  //  报告
  // ========================================================
  // 时间统计: 节级耗时 + 总耗时
  if (secStart !== null) secTimes.push({ name: secName, ms: Date.now() - secStart });
  const runTotalMs = Date.now() - runStart;
  console.log(`\n${B}── 执行时间统计${X}`);
  console.table(secTimes.map(t => ({ 节: t.name, '耗时(ms)': t.ms })));
  console.log(`  ${D}总耗时 ${runTotalMs}ms, 共 ${secTimes.length} 节, 平均 ${(runTotalMs / secTimes.length).toFixed(0)}ms/节${X}`);

  const total = passed + failed + skipped;
  console.log(`\n${B}╔${bar}╗${X}`);
  console.log(`${B}║${X}  总计  ${G}${String(passed).padStart(3)} 通过${X} / ${String(total).padStart(3)} 项  (${runTotalMs}ms)         ${B}║${X}`);
  if (failed) console.log(`${B}║${X}        ${R}${String(failed).padStart(3)} 失败${X}                                    ${B}║${X}`);
  if (skipped) console.log(`${B}║${X}        ${Y}${String(skipped).padStart(3)} 跳过${X}                                    ${B}║${X}`);
  console.log(`${B}╚${bar}╝${X}\n`);

  if (failed) console.log(`${R}${B}存在 ${failed} 项失败，请检查 ✕ 标记。${X}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error(`${R}脚本异常:${X}`, e.message); process.exit(2); });
