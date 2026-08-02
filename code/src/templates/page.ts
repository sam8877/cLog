// ─── Static Page Template (About, Links) ──────────────────

import { layoutHtml, DEFAULT_NAV } from './shared';
import { renderMarkdown } from '../services/markdown';
import type { Page } from '../types';

const EXTRA_CSS = `
.container-narrow{max-width:780px;margin-inline:auto;padding-inline:var(--gutter)}
.page-header{padding:clamp(40px,6vw,80px) 0 var(--gap-lg);text-align:center}
.page-header h1{max-width:20ch;margin-inline:auto}
.page-body{max-width:640px;margin:0 auto;padding:0 var(--gutter) var(--gap-2xl)}
.page-body p{margin:0 0 var(--gap-md);line-height:1.75;font-size:17px}
.page-body h2{margin:var(--gap-xl) 0 var(--gap-md)}
.page-body h3{margin:var(--gap-lg) 0 var(--gap-sm);font-family:var(--font-display);font-size:var(--fs-h3);font-weight:500}
.page-body ul,.page-body ol{margin:0 0 var(--gap-md);padding-left:24px}
.page-body li{margin-bottom:8px;line-height:1.7}
.page-body a{color:var(--accent);border-bottom:1px solid var(--accent-soft);transition:border-color var(--motion-fast)}
.page-body a:hover{border-color:var(--accent)}
.page-body blockquote{margin:var(--gap-lg) 0;padding:var(--gap-md) var(--gap-lg);border-left:3px solid var(--accent);background:var(--surface);border-radius:0 var(--radius) var(--radius) 0;color:var(--muted);font-style:italic}
.page-body blockquote p{margin:0}
.page-body hr{border:0;border-top:1px solid var(--border);margin:var(--gap-xl) 0}
.page-body code{font-family:var(--font-mono);font-size:14px;background:var(--fg-soft);padding:2px 6px;border-radius:4px;color:var(--accent)}
`;

export function pageTemplate(page: Page | null, blogTitle = 'cLog'): string {
  if (!page) {
    const bodyHtml = `
    <header class="page-header container">
      <h1>页面不存在</h1>
      <p class="lead" style="margin:var(--gap-md) auto 0;">这个页面不存在或已被删除。</p>
    </header>`;
    return layoutHtml({
      title: `页面不存在 · ${blogTitle}`,
      blogTitle,
      currentPath: '/',
      extraCss: EXTRA_CSS,
      bodyHtml,
      navLinks: DEFAULT_NAV,
    });
  }

  const contentHtml = renderMarkdown(page.content || '');

  const bodyHtml = `
    <header class="page-header container">
      <h1>${page.title}</h1>
    </header>

    <article class="page-body">${contentHtml}</article>

    <footer class="pagefoot">
      <div class="container" style="text-align:center;">
        <span>© ${blogTitle} · ${new Date().getFullYear()}</span>
        <span class="meta" style="margin-left:12px;">← <a href="/" style="color:var(--accent);">返回首页</a></span>
      </div>
    </footer>`;

  return layoutHtml({
    title: `${page.title} · ${blogTitle}`,
    blogTitle,
    currentPath: `/page/${page.slug}`,
    extraCss: EXTRA_CSS,
    bodyHtml,
    footerHtml: '',
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
