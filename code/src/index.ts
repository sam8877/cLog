// ─── 静思录 Blog · Cloudflare Worker Entry ──────────────

import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { createDbService, type DbService } from './services/db';
import { homeTemplate } from './templates/home';
import { postTemplate } from './templates/post';
import { pageTemplate } from './templates/page';
import { archiveTemplate } from './templates/archive';
import { searchTemplate } from './templates/search';
import { loginTemplate } from './templates/login';
import { adminTemplate } from './templates/admin';
import { rssXml } from './templates/rss';
import { authMiddleware, loginHandler, logoutHandler, checkAuthHandler, changePasswordHandler, getJwtSecret, verifyJwt } from './api/auth';
import { ensureSchema, seedDatabase } from './seed';
import type { Post, Comment, Tag, Category, Media } from './types';

type Bindings = {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_PASSWORD?: string;
  DEMO_SEED?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ─── Security headers (CSP 允许现有内联脚本/样式) ─────────
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
}));

// 初始化门: 每 worker 实例仅首次请求执行建表+seed (幂等), 之后请求零开销
// 失败时不置位, 后续请求自动重试; 错误记录日志不再静默
let dbReady = false;
app.use('*', async (c, next) => {
  if (!dbReady) {
    try {
      await ensureSchema(c.env.DB);
      await seedDatabase(c.env.DB, { ADMIN_PASSWORD: c.env.ADMIN_PASSWORD, DEMO_SEED: c.env.DEMO_SEED });
      dbReady = true;
    } catch (e) {
      console.error('[初始化] 建表/seed 失败, 下个请求重试:', e);
    }
  }
  await next();
});

// ─── Helper — get DB service ────────────────────────────
function db(c: any): DbService {
  return createDbService(c.env.DB);
}

// ─── Public Page Routes ──────────────────────────────────

// Home page (paginated)
app.get('/', async (c) => {
  const d = db(c);
  const [posts, tags, categories, blogTitle, blogTagline, perPageSetting] = await Promise.all([
    d.getPosts('published'),
    d.getTags(),
    d.getCategories(),
    d.getSetting('blog_title'),
    d.getSetting('blog_tagline'),
    d.getSetting('per_page'),
  ]);
  const perPage = Math.max(1, parseInt(perPageSetting || '10') || 10);
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1);
  return c.html(homeTemplate({
    posts, tags, categories,
    blogTitle: blogTitle || undefined,
    blogTagline: blogTagline || undefined,
    page, perPage,
  }));
});

// Post detail
app.get('/post/:slug', async (c) => {
  const d = db(c);
  const slug = c.req.param('slug');
  const post = await d.getPost(slug);
  const blogTitle = await d.getSetting('blog_title');

  if (!post || post.status !== 'published') {
    return c.html(pageTemplate(null, blogTitle || undefined), 404);
  }

  const comments = await d.getComments(slug, 'approved');
  const allPosts = await d.getPosts('published');
  const relatedPosts = allPosts
    .filter(p => p.slug !== slug && (p.category === post.category || p.tags?.some(t => post.tags?.some(pt => pt.slug === t.slug))))
    .slice(0, 4);

  return c.html(postTemplate({ post, comments }, relatedPosts, blogTitle || undefined));
});

// Static page
app.get('/page/:slug', async (c) => {
  const d = db(c);
  const slug = c.req.param('slug');
  const page = await d.getPage(slug);
  const blogTitle = await d.getSetting('blog_title');

  if (!page || page.status !== 'published') {
    return c.html(pageTemplate(null, blogTitle || undefined), 404);
  }

  return c.html(pageTemplate(page, blogTitle || undefined));
});

// Archive (all-posts tab paginated)
app.get('/archive', async (c) => {
  const d = db(c);
  const [posts, tags, categories, blogTitle, perPageSetting] = await Promise.all([
    d.getPosts('published'),
    d.getTags(),
    d.getCategories(),
    d.getSetting('blog_title'),
    d.getSetting('per_page'),
  ]);
  const perPage = Math.max(1, parseInt(perPageSetting || '10') || 10);
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1);
  return c.html(archiveTemplate({ posts, tags, categories, blogTitle: blogTitle || undefined, page, perPage }));
});

// Search
app.get('/search', async (c) => {
  const d = db(c);
  const [posts, blogTitle] = await Promise.all([
    d.getPosts('published'),
    d.getSetting('blog_title'),
  ]);
  const query = c.req.query('q') || '';
  return c.html(searchTemplate({ posts, query, blogTitle: blogTitle || undefined }));
});

// Login page
app.get('/login', async (c) => {
  const d = db(c);
  const blogTitle = await d.getSetting('blog_title');
  return c.html(loginTemplate(undefined, blogTitle || undefined));
});

// ─── RSS Feed ────────────────────────────────────────────
app.get('/rss.xml', async (c) => {
  const d = db(c);
  const [posts, blogTitle, blogTagline, siteUrl] = await Promise.all([
    d.getPosts('published'),
    d.getSetting('blog_title'),
    d.getSetting('blog_tagline'),
    d.getSetting('site_url'),
  ]);
  const xml = rssXml({
    posts,
    title: blogTitle || '静思录',
    description: blogTagline || '文字自有重量',
    siteUrl: siteUrl || '',
  });
  return c.newResponse(xml, 200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
});

// ─── Media (public read, admin manage) ────────────────────
app.get('/media/:id', async (c) => {
  const d = db(c);
  const media = await d.getMedia(c.req.param('id'));
  if (!media) return c.json({ error: '文件不存在' }, 404);
  const obj = await c.env.MEDIA.get(media.key);
  if (!obj) return c.json({ error: '文件不存在' }, 404);
  // workers-types 的 ReadableStream 泛型与新版 TS lib 不兼容, 显式断言
  return c.newResponse(obj.body as unknown as ReadableStream, 200, {
    'Content-Type': media.content_type,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
});

// Admin SPA
app.get('/admin', (c) => {
  return c.html(adminTemplate());
});

app.get('/admin/*', (c) => {
  return c.html(adminTemplate());
});

// ─── Auth API ────────────────────────────────────────────

app.post('/api/auth/login', loginHandler);
app.post('/api/auth/logout', logoutHandler);
app.get('/api/auth/check', checkAuthHandler);

// ─── Public API ──────────────────────────────────────────

// Submit comment — auto-approve if from authenticated admin
app.post('/api/comments', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<{ post_slug: string; author: string; email?: string; body: string }>();
    if (!body.post_slug || !body.author || !body.body) {
      return c.json({ error: '缺少必填字段' }, 400);
    }
    // Auto-approve if submitted by logged-in admin
    let autoApproved = false;
    const cookie = c.req.header('Cookie') || '';
    const match = cookie.match(/blog_token=([^;]+)/);
    if (match) {
      try {
        const secret = await getJwtSecret(c.env.DB);
        const payload = await verifyJwt(match[1], secret);
        if (payload) autoApproved = true;
      } catch { /* not admin */ }
    }
    // 访客评论限流: 10 分钟窗口内超过阈值 → 429 (管理员豁免)
    if (!autoApproved) {
      const ip = c.req.header('cf-connecting-ip') || 'unknown';
      const maxComments = Math.max(1, parseInt((await d.getSetting('comment_max_per_window')) || '10') || 10);
      const count = await d.incrRateLimit(`comment:${ip}`, 600);
      if (count > maxComments) {
        return c.json({ error: '评论过于频繁，请稍后再试' }, 429);
      }
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await d.createComment({
      id, post_slug: body.post_slug, author: body.author,
      email: body.email || '', body: body.body,
      status: autoApproved ? 'approved' : 'pending',
      created_at: now,
    });
    return c.json({ success: true, id });
  } catch (e) {
    return c.json({ error: '提交失败' }, 500);
  }
});

// ─── Admin API (JWT protected) ───────────────────────────

const admin = app.basePath('/api');

// Apply auth middleware to all admin routes
admin.use('*', async (c, next) => {
  const auth = authMiddleware(c.env.DB);
  return auth(c, next);
});

// ─── Stats ───────────────────────────────────────────────
admin.get('/stats', async (c) => {
  const d = db(c);
  const stats = await d.getStats();
  return c.json(stats);
});

// ─── Posts CRUD ──────────────────────────────────────────
admin.get('/posts', async (c) => {
  const d = db(c);
  const posts = await d.getPosts();
  return c.json(posts);
});

admin.get('/posts/:slug', async (c) => {
  const d = db(c);
  const post = await d.getPost(c.req.param('slug'));
  if (!post) return c.json({ error: '文章不存在' }, 404);
  return c.json(post);
});

admin.post('/posts', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<{
      slug: string; title: string; content: string; excerpt: string;
      category: string; status: 'draft' | 'published'; tags: string[];
    }>();
    const now = new Date().toISOString().slice(0, 19);
    const slugBase = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const slug = body.slug || slugBase || 'post-' + Date.now().toString(36);

    // Create or get tags
    const tagSlugs: string[] = [];
    if (body.tags && body.tags.length > 0) {
      for (const tagName of body.tags) {
        const raw = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const tagSlug = raw || 'tag-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        await d.createTag({ slug: tagSlug, name: tagName });
        tagSlugs.push(tagSlug);
      }
    }

    await d.createPost({
      slug,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || '',
      category: body.category || '',
      status: body.status || 'draft',
      created_at: now,
      updated_at: now,
    });

    await d.setPostTags(slug, tagSlugs);

    // 发布时生成首个版本快照
    if ((body.status || 'draft') === 'published') {
      const revTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
      await d.createRevision({
        entity_type: 'post', entity_slug: slug,
        title: body.title, content: body.content,
        excerpt: body.excerpt || '', category: body.category || '',
        status: 'published', note: '发布', created_at: revTime,
      });
    }
    return c.json({ success: true, slug });
  } catch (e: any) {
    return c.json({ error: e.message || '创建失败' }, 500);
  }
});

admin.put('/posts/:slug', async (c) => {
  const d = db(c);
  try {
    const slug = c.req.param('slug');
    const body = await c.req.json<Partial<Post> & { tags?: string[] }>();
    const oldPost = await d.getPost(slug);

    // Update tags if provided
    if (body.tags) {
      const tagSlugs: string[] = [];
      for (const tagName of body.tags) {
        const raw = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        const tagSlug = raw || 'tag-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        await d.createTag({ slug: tagSlug, name: tagName });
        tagSlugs.push(tagSlug);
      }
      await d.setPostTags(slug, tagSlugs);
    }

    await d.updatePost(slug, body);

    // 版本快照: 文章处于(或曾处于)发布状态时留痕
    const curPost = await d.getPost(slug);
    if (oldPost?.status === 'published' || curPost?.status === 'published') {
      const note = oldPost?.status !== curPost?.status
        ? (curPost?.status === 'published' ? '发布' : '下线')
        : '编辑';
      await d.createRevision({
        entity_type: 'post', entity_slug: slug,
        title: curPost?.title || '', content: curPost?.content || '',
        excerpt: curPost?.excerpt || '', category: curPost?.category || '',
        status: curPost?.status || 'draft', note,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '更新失败' }, 500);
  }
});

admin.delete('/posts/:slug', async (c) => {
  const d = db(c);
  await d.deletePost(c.req.param('slug'));
  return c.json({ success: true });
});

// ─── Pages API ───────────────────────────────────────────
admin.get('/pages', async (c) => {
  const d = db(c);
  const pages = await d.getPages();
  return c.json(pages);
});

admin.put('/pages/:slug', async (c) => {
  const d = db(c);
  try {
    const slug = c.req.param('slug');
    const body = await c.req.json<{ title?: string; content?: string; status?: 'draft' | 'published' }>();
    const oldPage = await d.getPage(slug);
    await d.updatePage(slug, body);

    // 版本快照: 页面处于(或曾处于)发布状态时留痕
    const curPage = await d.getPage(slug);
    if (oldPage?.status === 'published' || curPage?.status === 'published') {
      const note = oldPage?.status !== curPage?.status
        ? (curPage?.status === 'published' ? '发布' : '下线')
        : '编辑';
      await d.createRevision({
        entity_type: 'page', entity_slug: slug,
        title: curPage?.title || '', content: curPage?.content || '',
        excerpt: '', category: '',
        status: curPage?.status || 'draft', note,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '更新失败' }, 500);
  }
});

// ─── Revisions API ────────────────────────────────────────
admin.get('/posts/:slug/revisions', async (c) => {
  const d = db(c);
  return c.json(await d.getRevisions('post', c.req.param('slug')));
});

admin.get('/pages/:slug/revisions', async (c) => {
  const d = db(c);
  return c.json(await d.getRevisions('page', c.req.param('slug')));
});

admin.get('/revisions/:id', async (c) => {
  const d = db(c);
  const rev = await d.getRevision(Number(c.req.param('id')));
  if (!rev) return c.json({ error: '版本不存在' }, 404);
  return c.json(rev);
});

// 恢复版本: 回滚标题/内容/摘要/分类, 保持当前状态, 恢复动作本身也留痕
admin.post('/revisions/:id/restore', async (c) => {
  const d = db(c);
  try {
    const rev = await d.getRevision(Number(c.req.param('id')));
    if (!rev) return c.json({ error: '版本不存在' }, 404);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (rev.entity_type === 'post') {
      const post = await d.getPost(rev.entity_slug);
      if (!post) return c.json({ error: '文章不存在' }, 404);
      await d.updatePost(rev.entity_slug, {
        title: rev.title, content: rev.content,
        excerpt: rev.excerpt, category: rev.category,
      });
      await d.createRevision({
        entity_type: 'post', entity_slug: rev.entity_slug,
        title: rev.title, content: rev.content,
        excerpt: rev.excerpt, category: rev.category,
        status: post.status, note: `从版本 #${rev.id} 恢复`, created_at: now,
      });
    } else {
      const page = await d.getPage(rev.entity_slug);
      if (!page) return c.json({ error: '页面不存在' }, 404);
      await d.updatePage(rev.entity_slug, { title: rev.title, content: rev.content });
      await d.createRevision({
        entity_type: 'page', entity_slug: rev.entity_slug,
        title: rev.title, content: rev.content,
        excerpt: '', category: '',
        status: page.status, note: `从版本 #${rev.id} 恢复`, created_at: now,
      });
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '恢复失败' }, 500);
  }
});

// ─── Comments API (admin) ────────────────────────────────
admin.get('/comments', async (c) => {
  const d = db(c);
  const comments = await d.getComments();
  return c.json(comments);
});

admin.put('/comments/:id', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<{ status?: 'pending' | 'approved' | 'spam' }>();
    await d.updateComment(c.req.param('id'), body);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '更新失败' }, 500);
  }
});

admin.delete('/comments/:id', async (c) => {
  const d = db(c);
  await d.deleteComment(c.req.param('id'));
  return c.json({ success: true });
});

// ─── Tags API ────────────────────────────────────────────
admin.get('/tags', async (c) => {
  const d = db(c);
  const tags = await d.getTags();
  return c.json(tags);
});

admin.post('/tags', async (c) => {
  const d = db(c);
  try {
    const { slug, name } = await c.req.json<{ slug: string; name: string }>();
    await d.createTag({ slug, name });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '创建失败' }, 500);
  }
});

admin.put('/tags/:slug', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<{ name?: string }>();
    await d.updateTag(c.req.param('slug'), body);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '更新失败' }, 500);
  }
});

admin.delete('/tags/:slug', async (c) => {
  const d = db(c);
  await d.deleteTag(c.req.param('slug'));
  return c.json({ success: true });
});

// ─── Categories API ──────────────────────────────────────
admin.get('/categories', async (c) => {
  const d = db(c);
  const cats = await d.getCategories();
  return c.json(cats);
});

admin.post('/categories', async (c) => {
  const d = db(c);
  try {
    const { slug, name, description, sort_order } = await c.req.json<Category>();
    await d.createCategory({ slug, name, description: description || '', sort_order: sort_order || 0 });
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '创建失败' }, 500);
  }
});

admin.put('/categories/:slug', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<Partial<Category>>();
    await d.updateCategory(c.req.param('slug'), body);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '更新失败' }, 500);
  }
});

admin.delete('/categories/:slug', async (c) => {
  const d = db(c);
  await d.deleteCategory(c.req.param('slug'));
  return c.json({ success: true });
});

// ─── Media API (admin) ───────────────────────────────────
admin.get('/media', async (c) => {
  const d = db(c);
  const media = await d.getMediaList();
  return c.json(media);
});

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

admin.post('/media', async (c) => {
  const d = db(c);
  try {
    const form = await c.req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return c.json({ error: '缺少文件' }, 400);
    }
    if (!file.type.startsWith('image/')) {
      return c.json({ error: '仅支持图片文件' }, 400);
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return c.json({ error: '图片不能超过 10MB' }, 400);
    }
    const ext = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'bin').toLowerCase();
    const id = crypto.randomUUID();
    const key = `${id}.${ext}`;
    await c.env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await d.createMedia({
      id, filename: file.name, key,
      content_type: file.type, size: file.size, created_at: now,
    });
    return c.json({ success: true, id, url: `/media/${id}` });
  } catch (e: any) {
    return c.json({ error: e.message || '上传失败' }, 500);
  }
});

admin.delete('/media/:id', async (c) => {
  const d = db(c);
  try {
    const media = await d.getMedia(c.req.param('id'));
    if (!media) return c.json({ error: '文件不存在' }, 404);
    await c.env.MEDIA.delete(media.key);
    await d.deleteMedia(media.id);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '删除失败' }, 500);
  }
});

// ─── Settings (白名单读取 / 任意写入) ────────────────────
// 只返回非敏感设置 — password_hash / jwt_secret 等绝不外泄
const PUBLIC_SETTING_KEYS = ['blog_title', 'blog_tagline', 'per_page', 'site_url'];

admin.get('/settings', async (c) => {
  const d = db(c);
  const out: Record<string, string> = {};
  for (const key of PUBLIC_SETTING_KEYS) {
    const v = await d.getSetting(key);
    if (v !== null) out[key] = v;
  }
  return c.json(out);
});

admin.put('/auth/password', changePasswordHandler);

admin.put('/settings', async (c) => {
  const d = db(c);
  try {
    const body = await c.req.json<Record<string, string>>();
    for (const [key, value] of Object.entries(body)) {
      await d.setSetting(key, value);
    }
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message || '保存失败' }, 500);
  }
});

// ─── Seed endpoint (for initial setup) ────────────────────
admin.get('/seed', async (c) => {
  try {
    // 与中间件一致: 传入 env (ADMIN_PASSWORD / DEMO_SEED), 避免行为分叉
    await ensureSchema(c.env.DB);
    await seedDatabase(c.env.DB, { ADMIN_PASSWORD: c.env.ADMIN_PASSWORD, DEMO_SEED: c.env.DEMO_SEED });
    return c.json({ success: true, message: '数据库已初始化' });
  } catch (e: any) {
    return c.json({ error: e.message || '初始化失败' }, 500);
  }
});

// ─── 404 ─────────────────────────────────────────────────
app.get('*', async (c) => {
  const d = db(c);
  const blogTitle = (await d.getSetting('blog_title')) || '静思录';
  return c.html(`<!doctype html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>404 · ${blogTitle}</title>
<style>
:root{--bg:#ffffff;--fg:#171717;--muted:#666666;--accent:#0070f3;--font-display:"Geist","Geist Sans",-apple-system,"Segoe UI",Arial,sans-serif;--font-body:"Geist","Geist Sans",-apple-system,"Segoe UI",Arial,sans-serif}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);display:grid;place-items:center;min-height:100vh;text-align:center}
h1{font-family:var(--font-display);font-size:clamp(48px,8vw,100px);margin:0;letter-spacing:-0.03em;color:var(--accent)}
p{color:var(--muted)}a{color:var(--accent)}
</style></head>
<body><div><h1>404</h1><p>页面不存在</p><p><a href="/">← 返回首页</a></p></div>
<script>
const s=localStorage.getItem('blog-theme');
if(s)document.documentElement.setAttribute('data-theme',s);
</script>
</body></html>`, 404);
});

export default app;
