// ─── Archive Template (Tags, Categories, All Posts) ──────

import { layoutHtml, DEFAULT_NAV, pagerHtml } from './shared';
import type { PostWithTags, Tag, Category } from '../types';

interface ArchiveData {
  posts: PostWithTags[];
  tags: Tag[];
  categories: Category[];
  page?: number;
  perPage?: number;
  blogTitle?: string;
}

const EXTRA_CSS = `
.container-narrow{max-width:900px;margin-inline:auto;padding-inline:var(--gutter)}
.page-header{padding:clamp(36px,5vw,64px) 0 var(--gap-lg);text-align:center}
.page-header h1{margin-bottom:var(--gap-sm)}

.tabs{display:flex;gap:0;margin-bottom:var(--gap-xl);border-bottom:2px solid var(--border)}
.tab-btn{padding:10px 24px;font-size:15px;font-weight:500;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all var(--motion-fast)}
.tab-btn:hover{color:var(--fg)}
.tab-btn.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-panel{display:none}
.tab-panel.active{display:block}

.tag-cloud{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:var(--gap-xl)}
.tag-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:var(--surface);border:1px solid var(--border);border-radius:999px;font-size:14px;color:var(--muted);transition:all var(--motion-fast)}
.tag-pill:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.tag-pill .count{font-family:var(--font-mono);font-size:11px;color:var(--meta);background:var(--fg-soft);padding:1px 6px;border-radius:999px}
.tag-pill.lg{font-size:17px;padding:8px 20px}
.tag-pill.md{font-size:15px}

.cat-list{display:flex;flex-direction:column;gap:var(--gap-sm)}
.cat-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);transition:box-shadow var(--motion-fast)}
.cat-row:hover{box-shadow:var(--elev-raised)}
.cat-row .cat-info h3{font-family:var(--font-display);font-size:18px;font-weight:500;margin:0}
.cat-row .cat-info p{margin:2px 0 0;font-size:13px;color:var(--muted)}
.cat-row .cat-count{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta);white-space:nowrap}

.filtered-posts{margin-top:var(--gap-xl);padding-top:var(--gap-lg);border-top:2px solid var(--border)}
.filtered-posts h3{font-family:var(--font-display);font-size:18px;font-weight:500;margin:0 0 var(--gap-md)}
.log-row{display:grid;grid-template-columns:100px 1fr;gap:var(--gap-md) var(--gap-lg);padding:16px 0;border-top:1px solid var(--border);align-items:baseline}
.log-row:first-child{border-top:0}
.log-row h4{font-family:var(--font-display);font-size:16px;font-weight:500;margin:0}
.log-row h4 a:hover{color:var(--accent)}
.log-row .date{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta);white-space:nowrap}
.empty-state{text-align:center;padding:var(--gap-xl);color:var(--meta)}
`;

export function archiveTemplate(data: ArchiveData): string {
  const { posts, tags, categories } = data;
  const published = posts.filter(p => p.status === 'published');

  // All articles (chronological, paginated)
  const page = data.page || 1;
  const perPage = data.perPage || 10;
  const start = (page - 1) * perPage;
  const pagePosts = published.slice(start, start + perPage);
  const allHtml = pagePosts.map(p => `
        <article class="log-row">
          <span class="date">${p.created_at?.slice(0,10) || ''}</span>
          <div>
            <h4><a href="/post/${p.slug}">${p.title}</a></h4>
            <span class="tag" style="margin-top:4px;">${p.tags?.[0]?.name || ''}</span>
          </div>
        </article>`).join('\n');

  // Tag cloud - size based on post_count
  const maxCount = Math.max(...tags.map(t => t.post_count || 0), 1);
  const tagCloudHtml = tags.map(t => {
    const ratio = (t.post_count || 0) / maxCount;
    const sizeClass = ratio >= 0.7 ? 'lg' : ratio >= 0.4 ? 'md' : '';
    return `<a class="tag-pill ${sizeClass}" href="/archive?tag=${t.slug}">${t.name} <span class="count">${t.post_count || 0}</span></a>`;
  }).join('\n            ');

  // Category list
  const catListHtml = categories.map(c => `
          <a href="/archive?cat=${c.slug}" class="cat-row">
            <div class="cat-info"><h3>${c.name}</h3><p>${c.description || ''}</p></div>
            <span class="cat-count">${c.post_count || 0} 篇</span>
          </a>`).join('\n');

  const bodyHtml = `
    <header class="page-header container">
      <h1>归档</h1>
      <p class="lead" style="margin:var(--gap-sm) auto 0;">按时间、标签或分类浏览所有文章</p>
    </header>

    <section class="container-narrow" style="padding-bottom:var(--gap-2xl);">
      <div class="tabs">
        <button class="tab-btn active" data-tab="all">全部文章 <span class="meta">(${published.length})</span></button>
        <button class="tab-btn" data-tab="tags">标签 <span class="meta">(${tags.length})</span></button>
        <button class="tab-btn" data-tab="categories">分类 <span class="meta">(${categories.length})</span></button>
      </div>

      <div class="tab-panel active" id="panel-all">
        ${published.length ? allHtml : '<div class="empty-state">暂无文章</div>'}
        ${pagerHtml('/archive', page, published.length, perPage)}
      </div>

      <div class="tab-panel" id="panel-tags">
        <div class="tag-cloud">${tagCloudHtml}</div>
        <div id="tag-results"></div>
      </div>

      <div class="tab-panel" id="panel-categories">
        <div class="cat-list">${catListHtml}</div>
        <div id="cat-results"></div>
      </div>
    </section>`;

  const extraScript = `
// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
  });
});

// Client-side tag/category filtering via URL params
const params=new URLSearchParams(window.location.search);
const tagParam=params.get('tag');
const catParam=params.get('cat');

function renderFiltered(containerId,items){
  const el=document.getElementById(containerId);
  if(!items.length){el.innerHTML='<div class="empty-state">暂无匹配文章</div>';return;}
  el.innerHTML='<div class="filtered-posts"><h3>'+items.length+' 篇文章</h3>'+
    items.map(a=>'<article class="log-row"><span class="date">'+(a.created_at||'').slice(0,10)+'</span><div><h4><a href="/post/'+a.slug+'">'+a.title+'</a></h4></div></article>').join('')+'</div>';
}

const articlesData=${JSON.stringify(posts.map(p=>({slug:p.slug,title:p.title,created_at:p.created_at,category:p.category,tags:p.tags||[]})))};

if(tagParam){
  document.querySelector('.tab-btn[data-tab="tags"]').click();
  const filtered=articlesData.filter(a=>a.tags.some(t=>t.slug===tagParam));
  renderFiltered('tag-results',filtered);
}
if(catParam){
  document.querySelector('.tab-btn[data-tab="categories"]').click();
  const filtered=articlesData.filter(a=>a.category===catParam);
  renderFiltered('cat-results',filtered);
}

// Click handlers for tag pills and category rows
document.getElementById('panel-tags').addEventListener('click',e=>{
  const pill=e.target.closest('.tag-pill');
  if(!pill)return;e.preventDefault();
  const href=pill.getAttribute('href');
  const slug=new URLSearchParams(href.split('?')[1]).get('tag');
  const filtered=articlesData.filter(a=>a.tags.some(t=>t.slug===slug));
  renderFiltered('tag-results',filtered);
});
document.getElementById('panel-categories').addEventListener('click',e=>{
  const row=e.target.closest('.cat-row');
  if(!row)return;e.preventDefault();
  const href=row.getAttribute('href');
  const slug=new URLSearchParams(href.split('?')[1]).get('cat');
  const filtered=articlesData.filter(a=>a.category===slug);
  renderFiltered('cat-results',filtered);
});
`;

  return layoutHtml({
    title: `归档 · ${data.blogTitle || '静思录'}`,
    blogTitle: data.blogTitle,
    currentPath: '/archive',
    extraCss: EXTRA_CSS,
    extraScript,
    bodyHtml,
    navLinks: [
      ...DEFAULT_NAV.slice(0, 1),
      { href: '/archive', label: '归档', active: true },
      ...DEFAULT_NAV.slice(2),
    ],
  });
}
