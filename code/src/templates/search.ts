// ─── Search Page Template ─────────────────────────────────

import { layoutHtml, DEFAULT_NAV } from './shared';
import type { PostWithTags } from '../types';

interface SearchData {
  posts: PostWithTags[];
  query?: string;
  blogTitle?: string;
  footerNote?: string;
}

const EXTRA_CSS = `
.container-narrow{max-width:800px;margin-inline:auto;padding-inline:var(--gutter)}
.search-hero{padding:clamp(36px,5vw,64px) 0 var(--gap-md)}
.search-box{display:flex;border:2px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;transition:border-color var(--motion-fast);max-width:640px;margin:var(--gap-md) auto 0}
.search-box:focus-within{border-color:var(--accent)}
.search-box input{flex:1;border:0;padding:14px 20px;font:inherit;font-size:17px;background:var(--surface);color:var(--fg);outline:2px solid transparent}
.search-box input:focus-visible{outline-color:var(--accent)}
.search-box input::placeholder{color:var(--meta)}
.search-box button{padding:14px 20px;background:var(--accent);color:var(--accent-on);font-size:18px;transition:background var(--motion-fast)}
.search-box button:hover{background:var(--accent-hover)}

.results-count{text-align:center;color:var(--meta);font-size:var(--fs-sm);margin-bottom:var(--gap-lg)}

.result-row{display:block;padding:18px 20px;border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:var(--gap-sm);background:var(--surface);transition:box-shadow var(--motion-fast)}
.result-row:hover{box-shadow:var(--elev-raised)}
.result-row h3{font-size:18px;margin-bottom:4px}
.result-row .excerpt{margin:4px 0 8px;color:var(--muted);font-size:var(--fs-sm);line-height:1.55}
.result-row .result-meta{display:flex;gap:var(--gap-sm);align-items:center;flex-wrap:wrap}
.result-row .result-meta .date{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta)}
mark{background:var(--accent-soft);color:var(--accent);border-radius:3px;padding:0 2px}

.empty-state{text-align:center;padding:var(--gap-2xl) var(--gap-md);color:var(--meta)}
.empty-state .empty-icon{font-size:48px;margin-bottom:var(--gap-md);opacity:0.4}
`;

export function searchTemplate(data: SearchData): string {
  const { posts, query } = data;
  const q = query || '';

  const extraScript = `
function highlight(text,q){
  if(!q)return text;
  const re=new RegExp('('+q.replace(/[.*+?^${'$'}{}()|[\\]\\\\]/g,'\\\\$&')+')','gi');
  return text.replace(re,'<mark>$1</mark>');
}

function doSearch(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  const posts=${JSON.stringify(posts.filter(p=>p.status==='published').map(p=>({slug:p.slug,title:p.title,excerpt:p.excerpt||'',date:p.created_at?.slice(0,10)||'',tags:p.tags||[]})))};
  const results=q?posts.filter(a=>
    a.title.toLowerCase().includes(q)||a.excerpt.toLowerCase().includes(q)||a.tags.some(t=>t.name.toLowerCase().includes(q))
  ):posts;
  document.getElementById('resultsCount').textContent=q?'找到 '+results.length+' 篇相关文章':'全部文章';
  document.getElementById('emptyState').style.display=results.length?'none':'block';
  document.getElementById('resultsList').innerHTML=results.map(a=>'<a href="/post/'+a.slug+'" class="result-row"><h3>'+highlight(a.title,q)+'</h3><p class="excerpt">'+highlight(a.excerpt,q)+'</p><div class="result-meta"><span class="date">'+a.date+'</span>'+a.tags.map(t=>'<span class="tag">'+t.name+'</span>').join('')+'</div></a>').join('');
}

document.getElementById('searchInput').addEventListener('input',doSearch);
${q ? `document.getElementById('searchInput').value=${JSON.stringify(q).replace(/</g, '\\u003c')};` : ''}
doSearch();
`;

  const bodyHtml = `
    <section class="search-hero container" style="text-align:center;">
      <h1>搜索文章</h1>
      <form class="search-box" onsubmit="return false;">
        <input type="search" id="searchInput" placeholder="输入关键词搜索…" autofocus autocomplete="off" value="${escapeHtml(q)}" />
        <button type="submit" aria-label="搜索">⌕</button>
      </form>
    </section>

    <section class="container-narrow" style="padding-bottom:var(--gap-2xl);">
      <p class="results-count" id="resultsCount"></p>
      <div id="resultsList"></div>
      <div class="empty-state" id="emptyState" style="display:none;">
        <div class="empty-icon">⌕</div>
        <p>没有找到匹配的文章</p>
        <p style="font-size:var(--fs-sm);margin-top:4px;">试试其他关键词，或浏览 <a href="/archive" style="color:var(--accent);">标签归档</a></p>
      </div>
    </section>`;

  return layoutHtml({
    title: `搜索 · ${data.blogTitle || 'cLog'}`,
    blogTitle: data.blogTitle,
    footerNote: data.footerNote,
    currentPath: '/search',
    extraCss: EXTRA_CSS,
    extraScript,
    bodyHtml,
    navLinks: [
      ...DEFAULT_NAV.slice(0, 2),
      { href: '/search', label: '搜索', active: true },
      ...DEFAULT_NAV.slice(3),
    ],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
