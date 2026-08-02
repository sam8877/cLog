// ─── Blog Post Detail Template ────────────────────────────

import { layoutHtml, DEFAULT_NAV } from './shared';
import { renderMarkdown } from '../services/markdown';
import type { PostWithTags, Comment } from '../types';

interface PostData {
  post: PostWithTags;
  comments: Comment[];
}

const EXTRA_CSS = `
.container-narrow{max-width:820px;margin-inline:auto;padding-inline:var(--gutter)}
.post-header{padding:clamp(40px,6vw,80px) 0 var(--gap-lg);text-align:center}
.post-header h1{max-width:22ch;margin-inline:auto}
.post-meta{display:flex;gap:var(--gap-md);justify-content:center;flex-wrap:wrap;align-items:center;margin-top:var(--gap-md);color:var(--meta);font-size:var(--fs-sm)}
.post-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--meta);opacity:.5}

.post-body{max-width:680px;margin:0 auto;padding:0 var(--gutter) var(--gap-2xl)}
.post-body p{margin:0 0 var(--gap-md);line-height:1.75;font-size:17px}
.post-body h2{margin:var(--gap-xl) 0 var(--gap-md)}
.post-body h3{margin:var(--gap-lg) 0 var(--gap-sm);font-family:var(--font-display);font-size:var(--fs-h3);font-weight:500}
.post-body ul,.post-body ol{margin:0 0 var(--gap-md);padding-left:24px}
.post-body li{margin-bottom:6px;line-height:1.7}
.post-body blockquote{margin:var(--gap-lg) 0;padding:var(--gap-md) var(--gap-lg);border-left:3px solid var(--accent);background:var(--surface);border-radius:0 var(--radius) var(--radius) 0;color:var(--muted);font-style:italic}
.post-body blockquote p{margin:0}
.post-body a{color:var(--accent);border-bottom:1px solid var(--accent-soft);transition:border-color var(--motion-fast)}
.post-body a:hover{border-color:var(--accent)}
.post-body hr{border:0;border-top:1px solid var(--border);margin:var(--gap-xl) 0}
.post-body img{border-radius:var(--radius-lg);margin:var(--gap-lg) auto}
.post-body figure{margin:var(--gap-lg) 0;text-align:center}
.post-body figure img{border-radius:var(--radius-lg)}
.post-body figcaption{margin-top:var(--gap-xs);font-size:13px;color:var(--meta);line-height:1.5}
.post-body code{font-family:var(--font-mono);font-size:14px;background:var(--fg-soft);padding:2px 6px;border-radius:4px;color:var(--accent)}
.post-body pre{background:var(--surface-warm);border:1px solid var(--border);border-radius:var(--radius);padding:var(--gap-md);overflow-x:auto;margin:var(--gap-lg) 0;line-height:1.55}
.post-body pre code{background:none;padding:0;color:var(--fg);font-size:13px}
/* highlight.js syntax colors */
.post-body .hljs-keyword,.post-body .hljs-selector-tag{color:var(--accent)}
.post-body .hljs-string,.post-body .hljs-addition{color:var(--success)}
.post-body .hljs-comment,.post-body .hljs-quote{color:var(--meta);font-style:italic}
.post-body .hljs-number,.post-body .hljs-literal{color:color-mix(in oklch,var(--accent) 70%,var(--fg))}
.post-body .hljs-title,.post-body .hljs-function .hljs-title{color:var(--fg)}
.post-body .hljs-type,.post-body .hljs-built_in{color:color-mix(in oklch,var(--accent) 50%,var(--success))}
.post-body .hljs-attr,.post-body .hljs-params{color:var(--muted)}
.post-body .hljs-meta{color:var(--meta)}
.post-body .hljs-regexp{color:var(--danger)}
[data-theme="dark"] .post-body .hljs-keyword,[data-theme="dark"] .post-body .hljs-selector-tag{color:var(--accent)}
[data-theme="dark"] .post-body .hljs-string,[data-theme="dark"] .post-body .hljs-addition{color:color-mix(in oklch,var(--success) 85%,white)}
[data-theme="dark"] .post-body .hljs-number,[data-theme="dark"] .post-body .hljs-literal{color:color-mix(in oklch,var(--accent) 80%,white)}

.comments-section{max-width:680px;margin:0 auto;padding-bottom:var(--gap-2xl);border-top:1px solid var(--border);padding-top:var(--gap-xl)}
.comments-section h2{margin-bottom:var(--gap-lg)}
.comment{padding:var(--gap-md) 0;border-bottom:1px solid var(--border)}
.comment-header{display:flex;align-items:center;gap:var(--gap-sm);margin-bottom:6px}
.comment-avatar{width:36px;height:36px;border-radius:50%;background:var(--accent-soft);display:grid;place-items:center;font-size:14px;color:var(--accent);font-family:var(--font-display)}
.comment-author{font-weight:600;font-size:14px}
.comment-time{font-size:12px;color:var(--meta)}
.comment-body{margin:0 0 0 48px;font-size:14px;line-height:1.6;color:var(--muted)}
.comment-body p{margin:0}

.comment-form{margin-top:var(--gap-xl);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--gap-lg)}
.comment-form h3{font-family:var(--font-display);font-size:18px;font-weight:500;margin:0 0 var(--gap-md)}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:var(--gap-md)}
.field label{font-size:13px;color:var(--muted)}
.field input,.field textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit;font-size:14px}
.field textarea{min-height:100px;resize:vertical;line-height:1.55}
.field input:focus,.field textarea:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}

.related-posts{max-width:680px;margin:0 auto;padding-bottom:var(--gap-2xl)}
.related-posts h2{margin-bottom:var(--gap-md)}
.related-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--gap-md)}
@media(max-width:560px){.related-grid{grid-template-columns:1fr}}
.related-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;transition:box-shadow var(--motion-fast)}
.related-card:hover{box-shadow:var(--elev-raised)}
.related-card h4{font-family:var(--font-display);font-size:16px;font-weight:500;margin:0 0 6px;line-height:1.3}
.related-card p{margin:0;font-size:13px;color:var(--muted)}

.toast-container{position:fixed;bottom:24px;right:24px;z-index:100;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--fg);color:var(--bg);padding:12px 20px;border-radius:var(--radius);font-size:14px;box-shadow:var(--elev-raised);animation:toastIn .3s var(--ease-standard);display:flex;align-items:center;gap:var(--gap-sm);max-width:360px}
.toast.success{border-left:3px solid var(--success)}
@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastOut{from{opacity:1}to{opacity:0;transform:translateY(-8px)}}
.toast.out{animation:toastOut .25s ease forwards}
`;

const EXTRA_SCRIPT = `
// Reply is only for the logged-in admin — the reply is posted as 博主
// and instantly approved; for visitors it would be a misleading pending comment
fetch('/api/auth/check').then(r=>r.json()).then(d=>{
  if(d.authenticated)document.querySelectorAll('.comment-reply-link').forEach(b=>{b.style.display='inline-block';});
}).catch(()=>{});
function showToast(msg,type){
  const container=document.getElementById('toastContainer');
  const toast=document.createElement('div');
  toast.className='toast '+type;
  toast.innerHTML='<span style="font-size:16px;">'+(type==='success'?'✓':'ℹ')+'</span> '+msg;
  container.appendChild(toast);
  setTimeout(()=>{toast.classList.add('out');setTimeout(()=>toast.remove(),250);},3000);
}
document.getElementById('commentForm').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const name=document.getElementById('cname').value.trim();
  const email=document.getElementById('cemail').value.trim();
  const content=document.getElementById('ccontent').value.trim();
  if(!name||!content)return;
  const btn=document.getElementById('submitBtn');
  btn.disabled=true;btn.textContent='提交中…';
  try{
    const res=await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_slug:document.getElementById('commentForm').dataset.postSlug,author:name,email,body:content})});
    if(res.ok){
      showToast('评论已提交，审核后显示！','success');
      document.getElementById('commentForm').reset();
    }else{showToast('提交失败，请稍后重试','error');}
  }catch(e){showToast('网络错误','error');}
  btn.disabled=false;btn.textContent='提交评论';
});
// Comment reply toggle
document.querySelectorAll('.comment-reply-link').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const comment=btn.closest('.comment');
    const existing=comment.querySelector('.reply-form-inline');
    if(existing){existing.remove();return;}
    const form=document.createElement('div');
    form.className='reply-form-inline';
    form.style.cssText='margin:8px 0 0 48px;padding:12px;background:var(--fg-soft);border-radius:var(--radius);';
    const slug=document.getElementById('commentForm').dataset.postSlug;
    form.innerHTML='<textarea placeholder="写下回复…" rows="2" style="width:100%;min-height:60px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit;font-size:13px;resize:vertical;"></textarea><div style="display:flex;gap:6px;margin-top:6px;"><button type="button" class="reply-submit" style="padding:5px 12px;background:var(--fg);color:var(--accent-on);border:none;border-radius:var(--radius);font-size:12px;font-weight:500;cursor:pointer;">提交回复</button><button type="button" class="reply-cancel" style="padding:5px 12px;background:transparent;color:var(--fg);border:1px solid var(--border);border-radius:var(--radius);font-size:12px;cursor:pointer;">取消</button></div>';
    comment.appendChild(form);
    form.querySelector('textarea').focus();
    form.querySelector('.reply-cancel').addEventListener('click',()=>form.remove());
    form.querySelector('.reply-submit').addEventListener('click',async()=>{
      const ta=form.querySelector('textarea');
      const val=ta.value.trim();
      if(!val){ta.focus();return;}
      const btn=form.querySelector('.reply-submit');
      btn.disabled=true;btn.textContent='提交中…';
      try{
        const res=await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({post_slug:slug,author:'博主',body:val})});
        if(res.ok){
          const entry=document.createElement('div');
          entry.style.cssText='margin:8px 0 0 48px;padding:10px 12px;background:var(--fg-soft);border-radius:var(--radius);font-size:13px;line-height:1.5;border-left:3px solid var(--accent-soft);';
          const now=new Date();
          const ts=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
          entry.innerHTML='<div>'+val.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div><div style="font-size:11px;color:var(--meta);margin-top:4px;">博主回复 · '+ts+'</div>';
          form.parentNode.insertBefore(entry,form);
          form.remove();
          showToast('回复已提交','success');
        }else{showToast('回复失败','error');btn.disabled=false;btn.textContent='提交回复';}
      }catch(e){showToast('网络错误','error');btn.disabled=false;btn.textContent='提交回复';}
    });
  });
});
`;

export function postTemplate(data: PostData, relatedPosts: PostWithTags[] = [], blogTitle = 'cLog'): string {
  const { post, comments } = data;

  const tagHtml = post.tags?.map(t => `<span class="tag">${t.name}</span>`).join('') || '';
  const contentHtml = renderMarkdown(post.content || '');

  // Comments list
  const approvedComments = comments.filter(c => c.status === 'approved');
  const commentsHtml = approvedComments.map(c => `
      <article class="comment" data-comment-id="${c.id}">
        <div class="comment-header">
          <div class="comment-avatar">${c.author[0] || '?'}</div>
          <div>
            <span class="comment-author">${escapeHtml(c.author)}</span>
            <span class="comment-time"> · ${c.created_at || ''}</span>
          </div>
        </div>
        <div class="comment-body"><p>${escapeHtml(c.body)}</p></div>
        <button type="button" class="comment-reply-link" style="display:none;font-size:12px;color:var(--meta);padding:2px 0;cursor:pointer;background:none;border:0;margin-left:48px;">回复</button>
      </article>`).join('\n');

  // Related posts
  const relatedHtml = relatedPosts.length > 0 ? `
    <section class="related-posts container">
      <h2>相关文章</h2>
      <div class="related-grid">
        ${relatedPosts.slice(0, 4).map(r => `
        <a href="/post/${r.slug}" class="related-card">
          <h4>${r.title}</h4>
          <p>${r.excerpt || ''}</p>
        </a>`).join('\n')}
      </div>
    </section>` : '';

  const bodyHtml = `
    <div class="container-narrow">
      <header class="post-header">
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:var(--gap-md);">${tagHtml}</div>
        <h1>${post.title}</h1>
        <div class="post-meta">
          <span>${post.created_at?.slice(0,10) || ''}</span><span class="dot"></span>
          <span>阅读约 ${readingTime(post.content || '')} 分钟</span><span class="dot"></span>
          <span>分类：<a href="/archive?cat=${post.category}" style="color:var(--accent);">${post.category_name || post.category}</a></span>
        </div>
      </header>

      <article class="post-body">${contentHtml}</article>

      <section class="comments-section">
        <h2>评论 (${approvedComments.length})</h2>
        ${commentsHtml}

        <form class="comment-form" id="commentForm" data-post-slug="${post.slug}">
          <h3>发表评论</h3>
          <div class="field"><label for="cname">昵称</label><input id="cname" type="text" placeholder="你的昵称" required /></div>
          <div class="field"><label for="cemail">邮箱（不会公开）</label><input id="cemail" type="email" placeholder="your@email.com" /></div>
          <div class="field"><label for="ccontent">评论内容</label><textarea id="ccontent" placeholder="写下你的想法…" required></textarea></div>
          <button type="submit" class="btn btn-primary" id="submitBtn">提交评论</button>
        </form>
      </section>

      ${relatedHtml}
    </div>

    <div class="toast-container" id="toastContainer"></div>
    <footer class="pagefoot">
      <div class="container" style="text-align:center;">
        <span>© ${blogTitle} · ${new Date().getFullYear()}</span>
        <span class="meta" style="margin-left:12px;">← <a href="/" style="color:var(--accent);">返回首页</a></span>
      </div>
    </footer>`;

  return layoutHtml({
    title: `${post.title} — ${blogTitle}`,
    blogTitle,
    description: post.excerpt || post.content?.slice(0, 160),
    currentPath: `/post/${post.slug}`,
    extraCss: EXTRA_CSS,
    extraScript: EXTRA_SCRIPT,
    bodyHtml,
    footerHtml: '', // footer is inline in body above
    navLinks: [
      { href: '/', label: '首页' },
      { href: '/archive', label: '归档' },
      { href: '/search', label: '搜索' },
      { href: '/page/about', label: '关于' },
      { href: '/login', label: '登录', className: 'admin-link' },
      { href: '/admin', label: '管理', className: 'admin-link' },
    ],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function readingTime(content: string): number {
  // Strip markdown and code blocks, count characters
  const text = content.replace(/```[\s\S]*?```/g, '').replace(/[#*>`\[\]()~_|!-]/g, '').replace(/\s+/g, '');
  // Chinese reading speed ~400 chars/min
  return Math.max(1, Math.ceil(text.length / 400));
}
