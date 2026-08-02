// ─── Shared CSS & Layout Templates ────────────────────────
// Vercel-inspired design system for 静思录 blog

export const CSS_TOKENS = `
:root {
  --bg: #ffffff; --surface: #ffffff; --surface-warm: var(--surface);
  --fg: #171717; --fg-2: #4d4d4d; --muted: #666666; --meta: #808080;
  --border: rgba(0,0,0,0.08); --border-soft: rgba(0,0,0,0.04);
  --accent: #0070f3; --accent-on: #ffffff;
  --accent-soft: color-mix(in oklch, var(--accent) 14%, transparent);
  --accent-hover: color-mix(in oklch, var(--accent) 88%, black);
  --fg-soft: color-mix(in oklch, var(--fg) 6%, transparent);
  --success: #16a34a; --warn: #eab308; --danger: #dc2626;
  --font-display: "Geist", "Geist Sans", -apple-system, "Segoe UI", Arial, sans-serif;
  --font-body: "Geist", "Geist Sans", -apple-system, "Segoe UI", Arial, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", "Roboto Mono", Menlo, Monaco, monospace;
  --fs-h1: clamp(32px, 4vw, 48px); --fs-h2: clamp(24px, 2.5vw, 32px);
  --fs-h3: 22px; --fs-lead: 19px; --fs-body: 16px; --fs-sm: 14px; --fs-meta: 13px;
  --gap-xs: 8px; --gap-sm: 12px; --gap-md: 20px; --gap-lg: 32px; --gap-xl: 56px; --gap-2xl: 96px;
  --container: 1160px; --gutter: 28px;
  --radius: 8px; --radius-lg: 12px;
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px #fafafa;
  --motion-fast: 150ms; --motion-base: 200ms;
  --ease-standard: cubic-bezier(0.2,0,0,1);
}
[data-theme="dark"] {
  --bg: #0a0a0a; --surface: #171717; --surface-warm: #171717;
  --fg: #fafafa; --fg-2: #a1a1a1; --muted: #a1a1a1; --meta: #808080;
  --border: rgba(255,255,255,0.08); --border-soft: rgba(255,255,255,0.04);
  --accent: #3399ff; --accent-on: #0a0a0a;
  --accent-soft: color-mix(in oklch, var(--accent) 18%, transparent);
  --fg-soft: color-mix(in oklch, var(--fg) 8%, transparent);
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 0 0 1px rgba(255,255,255,0.08), 0 2px 2px rgba(0,0,0,0.2), 0 8px 8px -8px rgba(0,0,0,0.2), 0 0 0 1px #1a1a1a;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:var(--fs-body);line-height:1.5;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
img,svg{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
button{font:inherit;cursor:pointer;border:0;background:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
p{text-wrap:pretty}
h1,h2,h3,h4{text-wrap:balance}
.container{max-width:var(--container);margin-inline:auto;padding-inline:var(--gutter)}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:var(--gap-md);flex-wrap:wrap}

.h1,h1{font-family:var(--font-display);font-size:var(--fs-h1);line-height:1.08;letter-spacing:-0.02em;margin:0}
.h2,h2{font-family:var(--font-display);font-size:var(--fs-h2);line-height:1.15;letter-spacing:-0.015em;margin:0}
.h3,h3{font-family:var(--font-display);font-size:var(--fs-h3);font-weight:500;line-height:1.3;margin:0}
.lead{font-size:var(--fs-lead);line-height:1.5;color:var(--muted);max-width:52ch;margin:0}
.eyebrow{font-family:var(--font-mono);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);margin:0 0 var(--gap-md)}
.meta{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta)}
.tag{display:inline-flex;padding:3px 10px;border:1px solid var(--border);border-radius:999px;font-size:12px;color:var(--muted);transition:all var(--motion-fast) var(--ease-standard)}
.tag:hover{border-color:var(--accent);color:var(--accent)}
.pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;background:var(--accent-soft);color:var(--accent);border-radius:999px;font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase}

.topnav{position:sticky;top:0;z-index:10;background:color-mix(in oklch,var(--bg) 92%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.topnav-inner{display:flex;align-items:center;justify-content:space-between;padding-block:14px}
.topnav .logo{font-family:var(--font-display);font-size:20px;font-weight:600;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px}
.topnav .logo-dot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.topnav nav{display:flex;gap:var(--gap-lg);align-items:center}
.topnav nav a{font-size:14px;color:var(--muted);transition:color var(--motion-fast)}
.topnav nav a:hover,.topnav nav a.active{color:var(--fg)}
.topnav nav a.admin-link{color:var(--accent)}
.topnav nav a.admin-link:hover{color:var(--fg)}
.theme-toggle{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--radius);border:1px solid var(--border);color:var(--muted);font-size:16px;transition:all var(--motion-fast)}
.theme-toggle:hover{color:var(--fg);border-color:var(--fg)}
.hamburger{display:none;width:36px;height:36px;place-items:center;border-radius:var(--radius);border:1px solid var(--border);color:var(--fg);font-size:18px}
@media(max-width:720px){.topnav nav{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;background:var(--surface);border-bottom:1px solid var(--border);padding:var(--gap-md);gap:var(--gap-sm)}.topnav nav.open{display:flex}.hamburger{display:grid}}

.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:var(--radius);border:1px solid transparent;font-size:15px;font-weight:500;letter-spacing:-0.005em;transition:all var(--motion-fast) var(--ease-standard)}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--fg);color:#ffffff;border-color:var(--fg)}
.btn-primary:hover{background:#333333}
.btn-secondary{background:transparent;color:var(--fg);border-color:var(--border)}
.btn-secondary:hover{border-color:var(--fg)}
.btn-ghost{background:transparent;color:var(--muted);border-color:transparent;padding-inline:6px}
.btn-ghost:hover{color:var(--accent)}

.pagefoot{padding-block:var(--gap-xl);color:var(--muted);font-size:13px;border-top:1px solid var(--border)}
.pager{display:flex;align-items:center;justify-content:center;gap:var(--gap-md);padding:var(--gap-lg) 0;border-top:1px solid var(--border)}
.pager-link{display:inline-flex;align-items:center;gap:4px;padding:8px 16px;border:1px solid var(--border);border-radius:var(--radius);font-size:14px;color:var(--fg);transition:all var(--motion-fast)}
.pager-link:hover{border-color:var(--accent);color:var(--accent)}
.pager-link.disabled{opacity:.35;pointer-events:none}
.pager-info{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta)}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}

@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
`;

export const COMMON_JS = `
const html=document.documentElement,toggle=document.getElementById('themeToggle');
const stored=localStorage.getItem('blog-theme');
if(stored)html.setAttribute('data-theme',stored);
else if(window.matchMedia('(prefers-color-scheme:dark)').matches)html.setAttribute('data-theme','dark');
toggle.textContent=html.getAttribute('data-theme')==='dark'?'◑':'◐';
toggle.addEventListener('click',()=>{
  const n=html.getAttribute('data-theme')==='dark'?'light':'dark';
  html.setAttribute('data-theme',n);toggle.textContent=n==='dark'?'◑':'◐';
  localStorage.setItem('blog-theme',n);
});
const h=document.getElementById('hamburger'),nav=document.getElementById('mainNav');
h.addEventListener('click',()=>{nav.classList.toggle('open');h.textContent=nav.classList.contains('open')?'✕':'☰'});
`;

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
  className?: string;
}

export function topnavHtml(navLinks: NavLink[], currentPath?: string, blogTitle = '静思录'): string {
  const links = navLinks.map(l => {
    const cls = l.active || l.href === currentPath ? ' active' : '';
    const extra = l.className ? ` style="color:var(--muted);"` : '';
    return `<a href="${l.href}" class="${l.className || ''}${cls}"${extra}>${l.label}</a>`;
  }).join('\n          ');

  return `<header class="topnav">
    <div class="container topnav-inner">
      <a href="/" class="logo"><span class="logo-dot"></span>${blogTitle}</a>
      <button class="hamburger" id="hamburger" aria-label="菜单">☰</button>
      <nav id="mainNav">
        ${links}
      </nav>
      <button class="theme-toggle" id="themeToggle" aria-label="切换暗色模式" title="切换暗色模式">◐</button>
    </div>
  </header>`;
}

export function footerHtml(blogTitle = '静思录'): string {
  return `<footer class="pagefoot">
    <div class="container row-between">
      <span>© ${blogTitle} · ${new Date().getFullYear()}</span>
      <span style="display:flex;gap:var(--gap-md);align-items:center;">
        <a href="/rss.xml" class="meta" style="display:inline-flex;align-items:center;gap:4px;" aria-label="RSS 订阅">RSS <svg width="13" height="13" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;"><circle cx="4.5" cy="15.5" r="1.8" fill="currentColor" stroke="none"/><path d="M4 9.5a6.5 6.5 0 016.5 6.5"/><path d="M4 4.5A11.5 11.5 0 0115.5 16"/></svg></a>
        <span class="meta">由 Cloudflare Workers + D1 驱动</span>
      </span>
    </div>
  </footer>`;
}

/** 分页器 HTML (basePath 如 '/' 或 '/archive') */
export function pagerHtml(basePath: string, page: number, total: number, perPage: number): string {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return '';
  const prevHref = page > 1 ? `${basePath}?page=${page - 1}` : '';
  const nextHref = page < pages ? `${basePath}?page=${page + 1}` : '';
  return `<nav class="pager" aria-label="分页">
    ${prevHref ? `<a class="pager-link" href="${prevHref}">← 上一页</a>` : `<span class="pager-link disabled">← 上一页</span>`}
    <span class="pager-info">${page} / ${pages}</span>
    ${nextHref ? `<a class="pager-link" href="${nextHref}">下一页 →</a>` : `<span class="pager-link disabled">下一页 →</span>`}
  </nav>`;
}

export function layoutHtml(opts: {
  title: string;
  lang?: string;
  navLinks: NavLink[];
  currentPath?: string;
  extraHead?: string;
  extraCss?: string;
  bodyHtml: string;
  footerHtml?: string;
  extraScript?: string;
  blogTitle?: string;
}): string {
  const blogTitle = opts.blogTitle || '静思录';
  const nav = topnavHtml(opts.navLinks, opts.currentPath, blogTitle);
  const footer = opts.footerHtml ?? footerHtml(blogTitle);

  return `<!doctype html>
<html lang="${opts.lang || 'zh-CN'}" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title}</title>
  <style>${CSS_TOKENS}${opts.extraCss || ''}</style>
  ${opts.extraHead || ''}
</head>
<body>
  ${nav}
  <main id="content">
    ${opts.bodyHtml}
  </main>
  ${footer}
  <script>${COMMON_JS}${opts.extraScript || ''}</script>
</body>
</html>`;
}

export const DEFAULT_NAV: NavLink[] = [
  { href: '/', label: '首页' },
  { href: '/archive', label: '归档' },
  { href: '/search', label: '搜索' },
  { href: '/page/about', label: '关于' },
  { href: '/login', label: '登录', className: 'admin-link' },
  { href: '/admin', label: '管理', className: 'admin-link' },
];
