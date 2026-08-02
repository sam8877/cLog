// ─── Blog Home Page Template ──────────────────────────────

import { layoutHtml, DEFAULT_NAV, pagerHtml } from './shared';
import type { PostWithTags, Tag, Category } from '../types';

interface HomeData {
  posts: PostWithTags[];
  tags: Tag[];
  categories: Category[];
  blogTitle?: string;
  blogTagline?: string;
  page?: number;
  perPage?: number;
}

const EXTRA_CSS = `
.content-sidebar{display:grid;grid-template-columns:1fr 300px;gap:var(--gap-xl);align-items:start}
@media(max-width:860px){.content-sidebar{grid-template-columns:1fr}}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;transition:box-shadow var(--motion-fast) var(--ease-standard),transform var(--motion-fast) var(--ease-standard)}
.card:hover{box-shadow:var(--elev-raised);transform:translateY(-1px)}
.card-featured{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-lg);align-items:center;margin-bottom:var(--gap-xl)}
@media(max-width:640px){.card-featured{grid-template-columns:1fr}}
.card-featured .ph-placeholder{aspect-ratio:16/10;border-radius:var(--radius);overflow:hidden;background:linear-gradient(135deg,var(--accent-soft) 0%,var(--fg-soft) 50%,var(--accent-soft) 100%);display:grid;place-items:center;color:var(--meta);font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em}

.log-row{display:grid;grid-template-columns:100px 1fr;gap:var(--gap-md) var(--gap-lg);padding:20px 0;border-top:1px solid var(--border);align-items:baseline;transition:background var(--motion-fast) var(--ease-standard)}
.log-row:hover{background:var(--fg-soft)}
.log-row:first-child{border-top:0}
.log-row h3{font-size:19px;margin-bottom:4px}
.log-row h3 a:hover{color:var(--accent)}
.log-row .log-desc{margin:4px 0 8px;color:var(--muted);font-size:var(--fs-sm);line-height:1.5}
.log-row .log-meta-row{display:flex;gap:var(--gap-sm);flex-wrap:wrap;align-items:center}
.log-row .date{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta);white-space:nowrap}

.sidebar{display:flex;flex-direction:column;gap:var(--gap-lg);position:sticky;top:80px}
@media(max-width:860px){.sidebar{position:static}}
.sidebar-widget{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px}
.sidebar-widget h4{font-family:var(--font-display);font-size:16px;font-weight:500;margin:0 0 var(--gap-sm)}
.sidebar-widget p{margin:0;color:var(--muted);font-size:var(--fs-sm);line-height:1.5}
.search-box{display:flex;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.search-box input{flex:1;border:0;padding:10px 14px;font:inherit;font-size:14px;background:var(--surface);color:var(--fg);outline:2px solid transparent}
.search-box input:focus{background:var(--bg);outline-color:var(--accent)}
.search-box button{padding:10px 14px;color:var(--muted);transition:color var(--motion-fast)}
.search-box button:hover{color:var(--accent)}
.tag-cloud{display:flex;flex-wrap:wrap;gap:6px}
.cat-link{display:flex;justify-content:space-between;align-items:center;font-size:14px;padding:5px 0;border-bottom:1px solid var(--border);transition:color var(--motion-fast)}
.cat-link:last-child{border-bottom:0}
.cat-link:hover{color:var(--accent)}

.section{padding-block:clamp(40px,6vw,80px)}
`;

function calcReadingTime(content: string): number {
  const text = content.replace(/```[\s\S]*?```/g, '').replace(/[#*>`\[\]()~_|!-]/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.ceil(text.length / 400));
}

export function homeTemplate(data: HomeData): string {
  const { posts, tags, categories } = data;
  const blogTitle = data.blogTitle || '静思录';
  const blogTagline = data.blogTagline || '文字自有重量';

  // 分页: 每页 perPage 篇, 第一页的第一篇以精选卡片展示
  const page = data.page || 1;
  const perPage = data.perPage || 10;
  const start = (page - 1) * perPage;
  const pagePosts = posts.filter(p => p.status === 'published').slice(start, start + perPage);
  const featured = page === 1 ? pagePosts[0] : undefined;
  const listPosts = featured ? pagePosts.slice(1) : pagePosts;

  // Featured card
  let featuredHtml = '';
  if (featured) {
    const tagHtml = featured.tags?.map(t => `<span class="tag">${t.name}</span>`).join('') || '';
    featuredHtml = `
          <article class="card card-featured">
            <div class="ph-placeholder">[ 题图 · 16:10 ]</div>
            <div>
              <span class="pill">精选</span>
              <h2 style="margin:8px 0;">
                <a href="/post/${featured.slug}">${featured.title}</a>
              </h2>
              <p class="meta" style="margin-bottom:8px;">${featured.created_at?.slice(0,10) || ''} · 阅读约 ${calcReadingTime(featured.content || '')} 分钟</p>
              <p style="margin:0 0 12px;color:var(--muted);font-size:var(--fs-sm);line-height:1.5;">${featured.excerpt || ''}</p>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">${tagHtml}</div>
            </div>
          </article>`;
  }

  // Article list
  const listHtml = listPosts.map(p => {
    const tagHtml = p.tags?.map(t => `<span class="tag">${t.name}</span>`).join('') || '';
    return `
          <article class="log-row">
            <span class="date">${p.created_at?.slice(0,10) || ''}</span>
            <div>
              <h3><a href="/post/${p.slug}">${p.title}</a></h3>
              <p class="log-desc">${p.excerpt || ''}</p>
              <div class="log-meta-row"><span style="font-size:12px;color:var(--meta);margin-right:8px;">阅读约 ${calcReadingTime(p.content || '')} 分钟</span>${tagHtml}</div>
            </div>
          </article>`;
  }).join('\n');

  // Tag cloud in sidebar
  const tagCloudHtml = tags.slice(0, 9).map(t =>
    `<a class="tag" href="/archive?tag=${t.slug}">${t.name}</a>`
  ).join('\n              ');

  // Category links in sidebar
  const catLinksHtml = categories.map(c =>
    `<a href="/archive?cat=${c.slug}" class="cat-link"><span>${c.name}</span><span class="meta">${c.post_count || 0}</span></a>`
  ).join('\n              ');

  const bodyHtml = `
    <!-- Hero -->
    <section class="section" style="padding-bottom:32px;">
      <div class="container">
        <p class="eyebrow">写作 · 思考 · 记录</p>
        <h1 style="max-width:24ch;">${blogTagline}</h1>
        <p class="lead" style="margin-top:var(--gap-md);">关于技术、设计与日常思考的个人笔记。不追热点，只写值得留下的东西。</p>
      </div>
    </section>

    <!-- Posts content -->
    <section class="section" style="padding-top:0;">
      <div class="container content-sidebar">
        <div>
          ${featuredHtml}
          ${listHtml}
          ${pagerHtml('/', page, posts.filter(p => p.status === 'published').length, perPage)}
        </div>

        <aside class="sidebar">
          <div class="sidebar-widget">
            <form class="search-box" action="/search" method="get">
              <label for="sideSearch" class="sr-only">搜索文章</label>
              <input id="sideSearch" type="search" name="q" placeholder="搜索文章…" />
              <button type="submit" aria-label="搜索">⌕</button>
            </form>
          </div>

          <div class="sidebar-widget">
            <h4>关于博主</h4>
            <p>全栈工程师，目前关注 Rust、分布式系统和知识管理。这个博客记录我的学习过程和思考。</p>
          </div>

          <div class="sidebar-widget">
            <h4>分类</h4>
            <div style="display:flex;flex-direction:column;">
              ${catLinksHtml}
            </div>
          </div>

          <div class="sidebar-widget">
            <h4>常用标签</h4>
            <div class="tag-cloud">
              ${tagCloudHtml}
            </div>
          </div>
        </aside>
      </div>
    </section>`;

  return layoutHtml({
    title: `${blogTitle} · ${blogTagline}`,
    blogTitle,
    currentPath: '/',
    extraCss: EXTRA_CSS,
    bodyHtml,
    navLinks: DEFAULT_NAV,
  });
}
