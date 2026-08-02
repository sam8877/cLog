// ─── Admin Dashboard SPA Template ─────────────────────────

export function adminTemplate(): string {
  return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>管理后台 · cLog</title>
  <style>
:root{--bg:#ffffff;--surface:#ffffff;--surface-warm:var(--surface);--fg:#171717;--fg-2:#4d4d4d;--muted:#666666;--meta:#707070;--border:rgba(0,0,0,0.08);--border-soft:rgba(0,0,0,0.04);--accent:#0070f3;--accent-on:#ffffff;--accent-soft:color-mix(in oklch,var(--accent) 14%,transparent);--accent-hover:color-mix(in oklch,var(--accent) 88%,black);--fg-soft:color-mix(in oklch,var(--fg) 6%,transparent);--success:#16a34a;--warn:#eab308;--danger:#dc2626;--font-display:"Geist","Geist Sans",-apple-system,"Segoe UI",Arial,sans-serif;--font-body:"Geist","Geist Sans",-apple-system,"Segoe UI",Arial,sans-serif;--font-mono:"Geist Mono",ui-monospace,"SF Mono","Roboto Mono",Menlo,Monaco,monospace;--fs-body:15px;--fs-sm:13px;--fs-meta:12px;--gap-xs:6px;--gap-sm:12px;--gap-md:20px;--gap-lg:28px;--radius:8px;--radius-lg:12px;--elev-raised:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),0 8px 8px -8px rgba(0,0,0,0.04);--motion-fast:150ms;--ease-standard:cubic-bezier(0.2,0,0,1);--sidebar-w:220px}
[data-theme="dark"]{--bg:#0a0a0a;--surface:#171717;--surface-warm:#171717;--fg:#fafafa;--fg-2:#a1a1a1;--muted:#a1a1a1;--meta:#808080;--border:rgba(255,255,255,0.08);--border-soft:rgba(255,255,255,0.04);--accent:#3399ff;--accent-on:#0a0a0a;--accent-soft:color-mix(in oklch,var(--accent) 18%,transparent);--accent-hover:color-mix(in oklch,var(--accent) 88%,black);--fg-soft:color-mix(in oklch,var(--fg) 8%,transparent);--elev-raised:0 0 0 1px rgba(255,255,255,0.08),0 2px 2px rgba(0,0,0,0.2),0 8px 8px -8px rgba(0,0,0,0.2),0 0 0 1px #1a1a1a}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:var(--fs-body);line-height:1.55;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;display:flex;min-height:100vh}
a{color:inherit;text-decoration:none}
button{font:inherit;cursor:pointer;border:0;background:none}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
h1,h2,h3{margin:0}h2{font-family:var(--font-display);font-size:22px;font-weight:500;line-height:1.2;letter-spacing:-0.01em}h3{font-family:var(--font-display);font-size:18px;font-weight:500}
.meta{font-family:var(--font-mono);font-size:var(--fs-meta);color:var(--meta);letter-spacing:0.01em}

.sidebar{width:var(--sidebar-w);background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:20;overflow-y:auto;transition:transform var(--motion-fast) var(--ease-standard)}
.sidebar-brand{display:flex;align-items:center;gap:8px;padding:18px var(--gap-md);font-family:var(--font-display);font-size:18px;font-weight:600;letter-spacing:-0.01em;border-bottom:1px solid var(--border)}
.sidebar-brand span{font-size:12px;color:var(--meta);font-weight:400;font-family:var(--font-mono);margin-left:auto}
.sidebar-nav{flex:1;padding:var(--gap-sm) 0;display:flex;flex-direction:column;gap:2px}
.sidebar-nav a,.sidebar-nav button{display:flex;align-items:center;gap:10px;padding:9px var(--gap-md);font-size:14px;color:var(--muted);transition:all var(--motion-fast);text-align:left;width:100%}
.sidebar-nav a:hover,.sidebar-nav button:hover{color:var(--fg);background:var(--fg-soft)}
.sidebar-nav a.active,.sidebar-nav button.active{color:var(--accent);background:var(--accent-soft);font-weight:500}
.nav-icon{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.nav-icon svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:15;backdrop-filter:blur(2px)}
.sidebar-footer{padding:var(--gap-md);border-top:1px solid var(--border);display:flex;flex-direction:column;gap:var(--gap-xs)}
.sidebar-footer a,.sidebar-footer button{font-size:var(--fs-sm);color:var(--meta);padding:6px 0;text-align:left;width:100%}
.sidebar-footer a:hover,.sidebar-footer button:hover{color:var(--fg)}
.sidebar-back{color:var(--accent)!important}

.main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-height:100vh}
.main-header{padding:14px var(--gap-lg);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface);position:sticky;top:0;z-index:5}
.main-header h2{margin:0}
.header-actions{display:flex;gap:var(--gap-sm);align-items:center}
.main-body{flex:1;padding:var(--gap-lg)}
.mobile-sidebar-toggle{display:none}

@media(max-width:860px){.sidebar{transform:translateX(-100%)}.sidebar.open{transform:translateX(0)}.sidebar-backdrop.show{display:block}.main{margin-left:0}.mobile-sidebar-toggle{display:inline-flex}.main-body{padding:var(--gap-sm)}}

.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius);border:1px solid var(--border);font-size:13px;font-weight:500;letter-spacing:0.02em;transition:all var(--motion-fast) var(--ease-standard)}
.btn:active{transform:translateY(1px)}
.btn-primary{background:var(--fg);color:var(--accent-on);border-color:var(--fg)}.btn-primary:hover{background:color-mix(in oklch,var(--fg) 86%,black);border-color:color-mix(in oklch,var(--fg) 86%,black)}
.btn-secondary{background:transparent;color:var(--fg);border-color:var(--border)}.btn-secondary:hover{border-color:var(--fg)}
.btn-danger{background:transparent;color:var(--danger);border-color:var(--danger)}.btn-danger:hover{background:var(--danger);color:var(--accent-on)}
.btn-sm{padding:5px 10px;font-size:12px;letter-spacing:0.02em}.btn-ghost{padding:4px 8px;border-color:transparent;color:var(--muted)}.btn-ghost:hover{color:var(--fg)}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px}
.stat-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--gap-md);margin-bottom:var(--gap-lg)}
@media(max-width:900px){.stat-grid{grid-template-columns:1fr 1fr}}
@media(max-width:500px){.stat-grid{grid-template-columns:1fr}}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;transition:box-shadow var(--motion-fast) var(--ease-standard)}
.stat-card:hover{box-shadow:var(--elev-raised)}
.stat-card .stat-num{font-family:var(--font-display);font-size:36px;font-weight:500;color:var(--accent);line-height:1}
.stat-card .stat-label{font-size:var(--fs-sm);color:var(--meta);margin-top:4px}
.stat-hero .stat-num{font-size:48px}
.stat-hero .stat-label{font-size:14px}
.stat-hero{grid-row:span 2;display:flex;flex-direction:column;justify-content:center}
.stat-link{font-size:12px;color:var(--accent);font-weight:500;margin-top:2px;display:inline-flex;align-items:center;gap:4px}
.stat-link:hover{text-decoration:underline}
.stat-warn{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--warn);margin-right:4px;vertical-align:middle}
.activity-cta{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--accent);font-weight:500;margin-left:auto;white-space:nowrap}
.activity-cta:hover{text-decoration:underline}

.ds-table{width:100%;border-collapse:collapse;font-size:13px}
@media(max-width:700px){.card{overflow-x:auto}}
.ds-table th,.ds-table td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--border)}
.ds-table th{color:var(--meta);font-weight:500;font-family:var(--font-mono);font-size:11px;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap}
.ds-table tbody tr:hover{background:var(--fg-soft)}
.ds-table .actions-cell{text-align:right;white-space:nowrap}

.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500;font-family:var(--font-mono);letter-spacing:0.02em}
.badge-published{background:color-mix(in oklch,var(--success) 15%,transparent);color:var(--success)}
.badge-draft{background:color-mix(in oklch,var(--warn) 15%,transparent);color:color-mix(in oklch,var(--warn) 60%,var(--fg))}
.badge-pending{background:color-mix(in oklch,var(--warn) 15%,transparent);color:color-mix(in oklch,var(--warn) 55%,var(--fg))}
.badge-approved{background:color-mix(in oklch,var(--success) 15%,transparent);color:var(--success)}
.badge-spam{background:color-mix(in oklch,var(--danger) 12%,transparent);color:var(--danger)}

.field{display:flex;flex-direction:column;gap:5px;margin-bottom:var(--gap-md)}
.field label{font-size:12px;color:var(--meta);font-weight:500;text-transform:uppercase;letter-spacing:0.06em}
.field input,.field textarea,.field select{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit;font-size:14px}
.field textarea{min-height:100px;resize:vertical;line-height:1.6}
.field input:focus,.field textarea:focus,.field select:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-md)}
@media(max-width:600px){.form-row{grid-template-columns:1fr}}
.editor-layout{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-md);min-height:400px}
.editor-layout.pure-mode{grid-template-columns:1fr}
@media(max-width:900px){.editor-layout,.editor-layout.pure-mode{grid-template-columns:1fr}}

.md-preview{border:1px solid var(--border);border-radius:var(--radius);padding:var(--gap-md);background:var(--surface);overflow-y:auto;max-height:500px;line-height:1.65}
.md-preview h1,.md-preview h2,.md-preview h3{font-family:var(--font-display);margin:var(--gap-md) 0 var(--gap-sm)}
.md-preview h1{font-size:24px}.md-preview h2{font-size:20px}.md-preview h3{font-size:17px}
.md-preview p{margin:0 0 var(--gap-sm)}
.md-preview code{font-family:var(--font-mono);font-size:13px;background:var(--fg-soft);padding:2px 6px;border-radius:3px;color:var(--accent)}
.md-preview pre{background:var(--surface-warm);border:1px solid var(--border);border-radius:var(--radius);padding:var(--gap-sm);overflow-x:auto}
.md-preview pre code{background:none;padding:0;color:var(--fg)}
.md-preview blockquote{border-left:3px solid var(--accent);margin:var(--gap-sm) 0;padding:var(--gap-xs) var(--gap-md);color:var(--muted)}
.md-tb-btn{width:30px;height:28px;display:grid;place-items:center;border-radius:4px;font-size:13px;color:var(--muted);transition:all var(--motion-fast)}.md-tb-btn:hover{background:var(--fg-soft);color:var(--fg)}

.admin-view{display:none}.admin-view.active{display:block}
.row-between{display:flex;align-items:center;justify-content:space-between}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}

.settings-layout{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap-md);align-items:start}
@media(max-width:700px){.settings-layout{grid-template-columns:1fr}}

.filter-group{display:flex;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:var(--gap-md)}
.filter-btn{padding:6px 14px;font-size:12px;color:var(--muted);background:transparent;border:none;border-right:1px solid var(--border);cursor:pointer;transition:all var(--motion-fast);font-weight:500}
.filter-btn:last-child{border-right:none}
.filter-btn:hover{color:var(--fg);background:var(--fg-soft)}
.filter-btn.active{color:var(--fg);background:var(--fg-soft)}
.empty-state{padding:40px 20px;text-align:center;color:var(--meta);font-size:13px;line-height:1.6}
.empty-state-icon{margin-bottom:12px;font-size:32px;opacity:0.35}
.pref-msg{display:none;padding:10px 14px;border-radius:var(--radius);margin-bottom:var(--gap-md);font-size:13px}
.pref-msg.show{display:block}
.reply-form{margin-top:8px;padding:10px 12px;background:var(--fg-soft);border-radius:var(--radius)}
.reply-form textarea{width:100%;min-height:60px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit;font-size:13px;resize:vertical;line-height:1.5}
.reply-form textarea:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}
.reply-actions{display:flex;gap:6px;margin-top:6px}
.reply-entry{margin:6px 0 6px 20px;padding:8px 10px;background:var(--fg-soft);border-radius:var(--radius);font-size:13px;line-height:1.5;border-left:3px solid var(--accent-soft)}
.reply-entry .reply-meta{font-size:11px;color:var(--meta);margin-top:4px}

.toast-container{position:fixed;bottom:24px;right:24px;z-index:100;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--fg);color:var(--bg);padding:12px 20px;border-radius:var(--radius);font-size:14px;box-shadow:var(--elev-raised);animation:toastIn .3s var(--ease-standard);display:flex;align-items:center;gap:var(--gap-sm);max-width:360px}
.toast.error{border-left:3px solid var(--danger)}.toast.success{border-left:3px solid var(--success)}
@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastOut{from{opacity:1}to{opacity:0;transform:translateY(-8px)}}
.toast.out{animation:toastOut .25s ease forwards}

.comment-row{padding:var(--gap-sm) 0;border-bottom:1px solid var(--border)}.comment-row:last-child{border-bottom:0}
.comment-meta-row{display:flex;gap:var(--gap-sm);align-items:center;margin-bottom:4px;flex-wrap:wrap}
.comment-body-text{font-size:13px;color:var(--muted);line-height:1.55;margin-bottom:8px}

.force-pwd{position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:var(--gap-md)}
.force-pwd-card{width:100%;max-width:400px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--gap-lg)}
.force-pwd-card h2{margin-bottom:var(--gap-xs)}
.force-pwd-card p{color:var(--muted);font-size:var(--fs-sm);margin:0 0 var(--gap-md)}
#forcePwdMsg{margin-bottom:var(--gap-md);font-size:13px;display:none}
#forcePwdMsg.show{display:block}

.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:90;display:flex;align-items:center;justify-content:center;padding:var(--gap-md);backdrop-filter:blur(2px)}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);max-width:640px;width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:var(--elev-raised)}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)}
.modal-header h3{margin:0}
.modal-close{width:32px;height:32px;display:grid;place-items:center;border-radius:var(--radius);color:var(--muted);font-size:16px;transition:all var(--motion-fast)}
.modal-close:hover{color:var(--fg);background:var(--fg-soft)}
.modal-body{overflow-y:auto;padding:var(--gap-md)}
.rev-item{padding:12px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:var(--gap-sm)}
.rev-item-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.rev-note{font-size:12px;color:var(--fg-2)}
.rev-title{font-size:14px;font-weight:500;margin-bottom:8px}
.rev-actions{display:flex;gap:6px}
.rev-preview{margin-top:var(--gap-sm);border-top:1px solid var(--border);padding-top:var(--gap-md)}
.rev-preview-head{display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
.rev-preview pre{background:var(--surface-warm);border:1px solid var(--border);border-radius:var(--radius);padding:var(--gap-sm);font-family:var(--font-mono);font-size:12px;line-height:1.6;overflow-x:auto;white-space:pre-wrap;max-height:300px;overflow-y:auto}
.rev-empty{padding:32px 16px;text-align:center;color:var(--meta);font-size:13px}

.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--gap-md)}
.media-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;transition:box-shadow var(--motion-fast)}
.media-card:hover{box-shadow:var(--elev-raised)}
.media-card img{width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--fg-soft)}
.media-card .media-meta{padding:10px 12px;display:flex;flex-direction:column;gap:4px}
.media-card .media-name{font-size:12px;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.media-card .media-sub{font-family:var(--font-mono);font-size:10px;color:var(--meta)}
.media-card .media-actions{display:flex;gap:4px;padding:0 12px 10px}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
  </style>
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand"><a href="/" style="display:flex;align-items:center;gap:8px;"><span id="brandName">cLog</span></a><span>管理</span></div>
    <nav class="sidebar-nav">
      <a href="#" class="active" aria-current="page" data-view="dashboard"><span class="nav-icon"><svg viewBox="0 0 20 20"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg></span>仪表盘</a>
      <a href="#" data-view="editor"><span class="nav-icon"><svg viewBox="0 0 20 20"><path d="M13 3l4 4L7 17H3v-4L13 3z"/><line x1="11" y1="5" x2="14" y2="8"/></svg></span>写文章</a>
      <a href="#" data-view="posts"><span class="nav-icon"><svg viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="2"/><line x1="7" y1="8" x2="13" y2="8"/><line x1="7" y1="11" x2="13" y2="11"/></svg></span>文章管理</a>
      <a href="#" data-view="pages"><span class="nav-icon"><svg viewBox="0 0 20 20"><rect x="3" y="2" width="14" height="16" rx="2"/><line x1="7" y1="6" x2="13" y2="6"/></svg></span>页面管理</a>
      <a href="#" data-view="comments"><span class="nav-icon"><svg viewBox="0 0 20 20"><path d="M3 5h14v9a2 2 0 01-2 2H7l-4 3V5z"/></svg></span>评论管理</a>
      <a href="#" data-view="tags"><span class="nav-icon"><svg viewBox="0 0 20 20"><path d="M8 3l-1 7H4l-.5 3h3l-1 4h2.5l1-4h4l1-4h-4l.5-3H8z"/></svg></span>标签管理</a>
      <a href="#" data-view="categories"><span class="nav-icon"><svg viewBox="0 0 20 20"><path d="M3 5a2 2 0 012-2h3l2 3h7a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/></svg></span>分类管理</a>
      <a href="#" data-view="media"><span class="nav-icon"><svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" rx="2"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M2 14l4.5-4 3 2.5L14 7l4 7"/></svg></span>媒体库</a>
      <a href="#" data-view="settings"><span class="nav-icon"><svg viewBox="0 0 20 20"><rect x="5" y="8" width="10" height="9" rx="2"/><path d="M7 8V6a3 3 0 016 0v2"/><circle cx="10" cy="12.5" r="1" fill="currentColor" stroke="none"/></svg></span>设置</a>
    </nav>
    <footer class="sidebar-footer">
      <button type="button" id="themeToggle2" aria-label="切换暗色模式" style="display:flex;align-items:center;gap:8px;">
        <svg id="themeIconLight2" width="16" height="16" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;flex-shrink:0;"><circle cx="10" cy="10" r="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="2" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="18" y2="10"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="14.4" y1="14.4" x2="15.8" y2="15.8"/><line x1="4.2" y1="15.8" x2="5.6" y2="14.4"/><line x1="14.4" y1="5.6" x2="15.8" y2="4.2"/></svg>
        <svg id="themeIconDark2" width="16" height="16" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;flex-shrink:0;display:none;"><path d="M10 3a7 7 0 100 14 5 5 0 110-14z"/></svg>
        切换暗色模式</button>
      <a href="/" class="sidebar-back">← 返回博客</a>
      <button type="button" id="logoutBtn" style="color:var(--danger);margin-top:4px;text-align:left;width:100%;">退出登录</button>
    </footer>
  </aside>



  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>

  <div class="main">
    <header class="main-header">
      <div style="display:flex;align-items:center;gap:var(--gap-sm);">
        <button class="btn btn-secondary btn-sm mobile-sidebar-toggle" id="sidebarToggle" aria-expanded="false" aria-controls="sidebar" style="padding:4px 8px;"><svg width="16" height="16" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg></button>
        <h1 id="viewTitle" tabindex="-1">仪表盘</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" onclick="switchView('editor')" id="newPostBtn">+ 新建文章</button>
        <button class="theme-toggle btn btn-secondary btn-sm" id="themeToggle" aria-label="切换暗色模式" style="padding:4px 8px;">
          <svg id="themeIconLight" width="16" height="16" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;"><circle cx="10" cy="10" r="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="2" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="18" y2="10"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="14.4" y1="14.4" x2="15.8" y2="15.8"/><line x1="4.2" y1="15.8" x2="5.6" y2="14.4"/><line x1="14.4" y1="5.6" x2="15.8" y2="4.2"/></svg>
          <svg id="themeIconDark" width="16" height="16" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;display:none;"><path d="M10 3a7 7 0 100 14 5 5 0 110-14z"/></svg>
        </button>
      </div>
    </header>

    <div class="main-body">
      <!-- Dashboard -->
      <div class="admin-view active" id="view-dashboard">
        <div class="stat-grid" id="statsGrid">
          <div class="stat-card stat-hero"><div class="stat-num">-</div><div class="stat-label">加载中…</div></div>
          <div class="stat-card"><div class="stat-num">-</div><div class="stat-label">加载中…</div></div>
          <div class="stat-card"><div class="stat-num">-</div><div class="stat-label">加载中…</div></div>
          <div class="stat-card"><div class="stat-num">-</div><div class="stat-label">加载中…</div></div>
        </div>
        <div class="card">
          <div class="row-between" style="margin-bottom:var(--gap-sm);">
            <h3>最近动态</h3>
            <a href="#" class="stat-link" onclick="switchView('posts');return false;">查看全部 →</a>
          </div>
          <div class="table-wrap"><table class="ds-table" id="recentTable">
            <thead><tr><th>时间</th><th>事件</th><th>详情</th><th></th></tr></thead>
            <tbody id="recentActivity"><tr><td colspan="4"><span class="meta">加载中…</span></td></tr></tbody>
          </table></div>
        </div>
      </div>

      <!-- Editor -->
      <div class="admin-view" id="view-editor">
        <input type="hidden" id="editSlug" value="" />
        <div class="card" style="margin-bottom:var(--gap-md);">
          <div class="form-row">
            <div class="field"><label>文章标题</label><input type="text" id="postTitle" placeholder="输入文章标题…" /></div>
            <div class="field"><label>Slug</label><input type="text" id="postSlug" placeholder="url-friendly-slug" /></div>
          </div>
        </div>
        <div class="editor-layout" id="editorLayout">
          <div class="field" id="editorInputCol" style="margin-bottom:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <label>Markdown 内容</label>
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--meta);" id="wordCount">字数: 0 · 字符: 0</span>
            </div>
            <div style="display:flex;gap:2px;padding:6px 0;flex-wrap:wrap;border-bottom:1px solid var(--border);margin-bottom:6px;">
              <button type="button" class="md-tb-btn" data-action="bold" title="加粗"><strong>B</strong></button>
              <button type="button" class="md-tb-btn" data-action="italic" title="斜体"><em>I</em></button>
              <button type="button" class="md-tb-btn" data-action="code" title="行内代码">&lt;/&gt;</button>
              <button type="button" class="md-tb-btn" data-action="link" title="链接"><svg width="14" height="14" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><path d="M9 11l5-5"/><path d="M14 4h-4l3.5 3.5"/><path d="M7 6H5a3 3 0 000 6h2"/><path d="M13 14h2a3 3 0 000-6h-2"/></svg></button>
              <button type="button" class="md-tb-btn" data-action="heading" title="标题">H</button>
              <button type="button" class="md-tb-btn" data-action="quote" title="引用">"</button>
              <button type="button" class="md-tb-btn" data-action="list" title="无序列表">•</button>
              <button type="button" class="md-tb-btn" data-action="image" title="图片"><svg width="14" height="14" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M2.5 14.5l4.5-4 3 2.5L14.5 8l3 3.5"/></svg></button>
            </div>
            <textarea id="mdEditor" style="min-height:400px;font-family:var(--font-mono);font-size:13px;line-height:1.65;" placeholder="用 Markdown 书写…"></textarea>
          </div>
          <div id="editorPreviewCol">
            <label id="previewLabel" style="font-size:12px;color:var(--meta);font-weight:500;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:5px;">实时预览</label>
            <div class="md-preview" id="mdPreview"></div>
          </div>
        </div>
        <div class="card" style="margin-top:var(--gap-md);">
          <div class="form-row">
            <div class="field"><label>分类</label><select id="postCategory"></select></div>
            <div class="field"><label>标签（逗号分隔）</label><input type="text" placeholder="Rust, 异步编程, 教程" id="postTags" /></div>
          </div>
          <div class="form-row" style="margin-top:var(--gap-sm);">
            <div class="field"><label>摘要</label><textarea id="postExcerpt" rows="2" placeholder="文章摘要…"></textarea></div>
          </div>
          <div style="display:flex;gap:var(--gap-sm);margin-top:var(--gap-sm);">
            <button class="btn btn-primary" onclick="savePost('published')"><span style="font-size:14px;">↑</span> 发布</button>
            <button class="btn btn-secondary" onclick="savePost('draft')">保存草稿</button>
            <button class="btn btn-ghost" onclick="resetEditor()">新建</button>
          </div>
        </div>
      </div>

      <!-- Posts Table -->
      <div class="admin-view" id="view-posts">
        <div class="card">
          <div class="table-wrap"><table class="ds-table"><thead><tr><th>标题</th><th>状态</th><th>分类</th><th>日期</th><th class="actions-cell">操作</th></tr></thead>
            <tbody id="postsTableBody"><tr><td colspan="5"><span class="meta">加载中…</span></td></tr></tbody>
          </table></div>
        </div>
      </div>

      <!-- Pages Table -->
      <div class="admin-view" id="view-pages">
        <div class="card">
          <div class="table-wrap"><table class="ds-table"><thead><tr><th>标题</th><th>Slug</th><th>状态</th><th>更新日期</th><th class="actions-cell">操作</th></tr></thead>
            <tbody id="pagesTableBody"><tr><td colspan="5"><span class="meta">加载中…</span></td></tr></tbody>
          </table></div>
        </div>
      </div>

      <!-- Comments -->
      <div class="admin-view" id="view-comments">
        <div class="card" style="margin-bottom:var(--gap-md);">
          <div class="filter-group" id="commentFilterGroup">
            <button type="button" class="filter-btn active" data-filter="all">全部 <span class="filter-count" style="font-family:var(--font-mono);font-size:10px;color:var(--meta);margin-left:4px;">0</span></button>
            <button type="button" class="filter-btn" data-filter="pending">待审核 <span class="filter-count" style="font-family:var(--font-mono);font-size:10px;color:var(--meta);margin-left:4px;">0</span></button>
            <button type="button" class="filter-btn" data-filter="approved">已批准 <span class="filter-count" style="font-family:var(--font-mono);font-size:10px;color:var(--meta);margin-left:4px;">0</span></button>
            <button type="button" class="filter-btn" data-filter="spam">垃圾 <span class="filter-count" style="font-family:var(--font-mono);font-size:10px;color:var(--meta);margin-left:4px;">0</span></button>
          </div>
          <div id="commentRows" style="margin-top:var(--gap-sm);"><span class="meta">加载中…</span></div>
          <div class="empty-state" id="commentsEmpty" style="display:none;">
            <div class="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 20 20" style="stroke:currentColor;fill:none;stroke-width:1;stroke-linecap:round;"><path d="M3 6h14v7a1.5 1.5 0 01-1.5 1.5H7l-3.5 2.5V6z"/></svg>
            </div>
            <div>暂无匹配的评论</div>
            <div style="font-size:11px;margin-top:4px;">尝试切换其他筛选条件</div>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="admin-view" id="view-tags">
        <div class="card">
          <div class="row-between" style="margin-bottom:var(--gap-md);">
            <h3>所有标签</h3>
            <div style="display:flex;gap:var(--gap-xs);align-items:center;">
              <input type="text" id="newTagInput" placeholder="新标签名称…" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;width:140px;" />
              <button class="btn btn-primary btn-sm" onclick="addTag()">添加</button>
            </div>
          </div>
          <div class="table-wrap"><table class="ds-table"><thead><tr><th>标签</th><th>Slug</th><th>文章数</th><th class="actions-cell">操作</th></tr></thead>
            <tbody id="tagsTableBody"><tr><td colspan="4"><span class="meta">加载中…</span></td></tr></tbody>
          </table></div>
        </div>
      </div>

      <!-- Categories -->
      <div class="admin-view" id="view-categories">
        <div class="card">
          <div class="row-between" style="margin-bottom:var(--gap-md);">
            <h3>所有分类</h3>
            <button class="btn btn-primary btn-sm" onclick="showAddCategory()">+ 新建分类</button>
          </div>
          <div class="table-wrap"><table class="ds-table"><thead><tr><th>分类</th><th>Slug</th><th>描述</th><th>文章数</th><th class="actions-cell">操作</th></tr></thead>
            <tbody id="categoriesTableBody"><tr><td colspan="5"><span class="meta">加载中…</span></td></tr></tbody>
          </table></div>
        </div>
      </div>

      <!-- Media -->
      <div class="admin-view" id="view-media">
        <div class="row-between" style="margin-bottom:var(--gap-md);">
          <h3>媒体库</h3>
          <div style="display:flex;gap:var(--gap-xs);align-items:center;">
            <input type="file" id="mediaInput" accept="image/*" multiple hidden />
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('mediaInput').click()">↑ 上传图片</button>
          </div>
        </div>
        <div class="media-grid" id="mediaGrid"></div>
        <div class="empty-state" id="mediaEmpty" style="display:none;">
          <div class="empty-state-icon">▦</div>
          <div>暂无图片</div>
          <div style="font-size:11px;margin-top:4px;">上传图片后可在文章 Markdown 中引用，如 <code style="font-family:var(--font-mono);font-size:12px;">![描述](/media/xxx)</code></div>
        </div>
      </div>

      <!-- Settings -->
      <div class="admin-view" id="view-settings">
        <div class="settings-layout">
          <!-- Account Security -->
          <div class="card">
            <h3 style="margin-bottom:var(--gap-xs);">账户安全</h3>
            <p style="font-size:var(--fs-sm);color:var(--meta);margin:0 0 var(--gap-lg);">修改登录密码。密码更新后立即生效。</p>
            <div id="pwdMsg" role="alert" style="display:none;padding:10px 14px;border-radius:var(--radius);margin-bottom:var(--gap-md);font-size:13px;"></div>
            <div class="field">
              <label>当前密码</label>
              <input type="password" id="pwdCurrent" placeholder="输入当前密码" autocomplete="current-password" />
            </div>
            <div class="field">
              <label>新密码</label>
              <input type="password" id="pwdNew" placeholder="至少 8 个字符，包含字母和数字" autocomplete="new-password" />
            </div>
            <div class="field">
              <label>确认新密码</label>
              <input type="password" id="pwdConfirm" placeholder="再次输入新密码" autocomplete="new-password" />
            </div>
            <div style="display:flex;gap:var(--gap-sm);margin-top:var(--gap-sm);">
              <button type="button" class="btn btn-primary" id="pwdSubmit">更新密码</button>
              <button type="button" class="btn btn-secondary" id="pwdCancel">取消</button>
            </div>
          </div>
          <!-- Preferences -->
          <div class="card">
            <h3 style="margin-bottom:var(--gap-xs);">偏好设置</h3>
            <p style="font-size:var(--fs-sm);color:var(--meta);margin:0 0 var(--gap-lg);">调整博客外观与写作体验。</p>
            <div id="prefMsg" role="status" class="pref-msg"></div>
            <div class="field">
              <label for="prefBlogTitle">博客标题</label>
              <input type="text" id="prefBlogTitle" value="cLog" placeholder="博客名称" />
            </div>
            <div class="field">
              <label for="prefTagline">副标题</label>
              <input type="text" id="prefTagline" value="文字自有重量" placeholder="一句话描述你的博客" />
            </div>
            <div class="field">
              <label for="prefSiteUrl">站点 URL（用于 RSS 绝对链接）</label>
              <input type="url" id="prefSiteUrl" value="" placeholder="https://example.com" />
            </div>
            <div class="field">
              <label for="prefSlogan">站点标语（首页 hero 眉题，留空不展示）</label>
              <input type="text" id="prefSlogan" value="" placeholder="写作 · 思考 · 记录" />
            </div>
            <div class="field">
              <label for="prefDescription">站点简介（首页 hero 描述 + meta description，留空不展示）</label>
              <textarea id="prefDescription" rows="2" placeholder="一句话描述你的博客"></textarea>
            </div>
            <div class="field">
              <label for="prefFooterNote">页脚署名（留空隐藏）</label>
              <input type="text" id="prefFooterNote" value="" placeholder="由 Cloudflare Workers + D1 驱动" />
            </div>
            <div class="field">
              <label for="prefAboutAuthor">关于博主（首页侧边栏展示）</label>
              <textarea id="prefAboutAuthor" rows="3" placeholder="一句话介绍自己，留空则首页不展示该板块"></textarea>
            </div>
            <div class="field">
              <label for="prefPerPage">每页显示文章数</label>
              <select id="prefPerPage">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </div>
            <div class="field">
              <label for="prefEditorMode">默认编辑器模式</label>
              <select id="prefEditorMode">
                <option value="split" selected>Markdown（分屏预览）</option>
                <option value="pure">Markdown（纯编辑）</option>
              </select>
            </div>
            <div style="display:flex;gap:var(--gap-sm);margin-top:var(--gap-sm);">
              <button type="button" class="btn btn-primary" id="prefSubmit">保存偏好</button>
              <button type="button" class="btn btn-secondary" id="prefCancel">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Force password change (初始密码未修改时全屏拦截) -->
  <div class="force-pwd" id="forcePwd" style="display:none;">
    <div class="force-pwd-card">
      <h2>请先修改初始密码</h2>
      <p>当前仍在使用初始密码，修改后才能使用管理后台。</p>
      <div class="field"><label for="forcePwdCurrent">当前密码</label><input type="password" id="forcePwdCurrent" autocomplete="current-password" /></div>
      <div class="field"><label for="forcePwdNew">新密码（至少 8 位，含字母和数字）</label><input type="password" id="forcePwdNew" autocomplete="new-password" /></div>
      <div class="field"><label for="forcePwdConfirm">确认新密码</label><input type="password" id="forcePwdConfirm" autocomplete="new-password" /></div>
      <div id="forcePwdMsg" role="alert"></div>
      <button type="button" class="btn btn-primary" id="forcePwdSubmit" style="width:100%;">更新密码</button>
    </div>
  </div>

  <!-- Revisions Modal -->
  <div class="modal-backdrop" id="revModalBackdrop" style="display:none;">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="revModalTitle">
      <div class="modal-header">
        <h3 id="revModalTitle">历史版本</h3>
        <button type="button" class="modal-close" id="revModalClose" aria-label="关闭">✕</button>
      </div>
      <div class="modal-body">
        <div id="revList"></div>
        <div class="rev-preview" id="revPreview" style="display:none;">
          <div class="rev-preview-head" id="revPreviewHead"></div>
          <pre id="revPreviewBody"></pre>
        </div>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toastContainer"></div>

  <script>
// ─── Globals ────────────────────────────────────────────
// FormData (媒体上传) 时不能手动设置 Content-Type, 否则丢失 multipart boundary
const api=(url,opts={})=>{
  const isForm=opts.body instanceof FormData;
  const headers={...(isForm?{}:{'Content-Type':'application/json'}),...opts.headers};
  return fetch(url,{...opts,headers}).then(r=>r.ok?r.json().catch(()=>null):Promise.reject(r));
};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ─── Toast ──────────────────────────────────────────────
function showToast(msg,type='success'){
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');
  t.className='toast '+type;
  t.innerHTML='<span style="font-size:16px;">'+(type==='error'?'✕':type==='info'?'ℹ':'✓')+'</span> '+msg;
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),250);},3000);
}

// ─── View switching ─────────────────────────────────────
const views=['dashboard','editor','posts','pages','comments','tags','categories','media','settings'];
const titles={dashboard:'仪表盘',editor:'写文章',posts:'文章管理',pages:'页面管理',comments:'评论管理',tags:'标签管理',categories:'分类管理',media:'媒体库',settings:'设置'};

window.switchView=function(name){
  document.querySelectorAll('.admin-view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.sidebar-nav a').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');});
  const activeLink=document.querySelector('.sidebar-nav a[data-view="'+name+'"]');
  activeLink.classList.add('active');activeLink.setAttribute('aria-current','page');
  document.getElementById('viewTitle').textContent=titles[name];
  document.getElementById('newPostBtn').style.display=(name==='editor'||name==='settings')?'none':'';
  // Close sidebar on mobile (with backdrop)
  document.getElementById('sidebar').classList.remove('open');
  const bd=document.getElementById('sidebarBackdrop');if(bd)bd.classList.remove('show');
  // Load data for the view
  if(name==='dashboard')loadDashboard();
  else if(name==='posts')loadPostsTable();
  else if(name==='pages')loadPagesTable();
  else if(name==='comments')loadComments();
  else if(name==='tags')loadTagsTable();
  else if(name==='categories')loadCategoriesTable();
  else if(name==='media')loadMedia();
  else if(name==='editor')loadEditorOptions();
};
document.querySelectorAll('.sidebar-nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();switchView(a.dataset.view);}));

// ─── Mobile Sidebar ─────────────────────────────────────
const sidebarEl=document.getElementById('sidebar');
const backdropEl=document.getElementById('sidebarBackdrop');
const sidebarToggle=document.getElementById('sidebarToggle');
function openSidebar(){sidebarEl.classList.add('open');backdropEl.classList.add('show');sidebarToggle.setAttribute('aria-expanded','true');}
function closeSidebar(){sidebarEl.classList.remove('open');backdropEl.classList.remove('show');sidebarToggle.setAttribute('aria-expanded','false');}
sidebarToggle.addEventListener('click',()=>{
  sidebarEl.classList.contains('open')?closeSidebar():openSidebar();
});
backdropEl.addEventListener('click',closeSidebar);

// ─── Theme ──────────────────────────────────────────────
const html=document.documentElement;
function setTheme(t){
  html.setAttribute('data-theme',t);
  const isDark=t==='dark';
  document.getElementById('themeIconLight').style.display=isDark?'none':'inline';
  document.getElementById('themeIconDark').style.display=isDark?'inline':'none';
  document.getElementById('themeIconLight2').style.display=isDark?'none':'inline';
  document.getElementById('themeIconDark2').style.display=isDark?'inline':'none';
  localStorage.setItem('blog-theme',t);
}
const stored=localStorage.getItem('blog-theme');
if(stored)setTheme(stored);
else if(window.matchMedia('(prefers-color-scheme:dark)').matches)setTheme('dark');
else setTheme('light');
document.getElementById('themeToggle').addEventListener('click',()=>setTheme(html.getAttribute('data-theme')==='dark'?'light':'dark'));
document.getElementById('themeToggle2').addEventListener('click',()=>setTheme(html.getAttribute('data-theme')==='dark'?'light':'dark'));

// ─── Logout ─────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click',async()=>{
  await fetch('/api/auth/logout',{method:'POST'});
  window.location.href='/';
});

// ─── Dashboard ──────────────────────────────────────────
async function loadDashboard(){
  try{
    const stats=await api('/api/stats');
    const posts=stats.total_posts||0,drafts=stats.drafts||0,pubCount=posts-drafts,com=stats.total_comments||0,pc=stats.pending_comments||0,t=stats.total_tags||0,c=stats.total_categories||0;
    document.getElementById('statsGrid').innerHTML=
      '<div class="stat-card stat-hero"><div class="stat-num">'+pubCount+'</div><div class="stat-label">已发布文章</div><div style="margin-top:8px;font-size:12px;color:var(--meta);line-height:1.5;">草稿 <strong style="color:var(--fg);">'+drafts+'</strong> 篇 · 标签 <strong style="color:var(--fg);">'+t+'</strong> 个</div></div>'+
      '<div class="stat-card"><div class="stat-num">'+drafts+'</div><div class="stat-label">草稿</div><a href="#" class="stat-link" onclick="switchView(\\'editor\\');return false;">继续写作 →</a></div>'+
      '<div class="stat-card"><div class="stat-num">'+com+'</div><div class="stat-label">总评论</div>'+ (pc>0?'<a href="#" class="stat-link" onclick="switchView(\\'comments\\');return false;"><span class="stat-warn"></span>'+pc+' 条待审核 →</a>':'') +'</div>'+
      '<div class="stat-card"><div class="stat-num" style="color:var(--fg-2);">'+c+'</div><div class="stat-label">分类 · '+t+' 标签</div><a href="#" class="stat-link" onclick="switchView(\\'categories\\');return false;">管理分类 →</a></div>';
    // Recent activity
    const allPosts=await api('/api/posts');
    const published=allPosts.filter(p=>p.status==='published').slice(0,5);
    document.getElementById('recentActivity').innerHTML=
      published.map(p=>'<tr><td><span class="meta">'+(p.created_at||'').slice(5,10)+'</span></td><td><span class="badge badge-published">已发布</span></td><td>《'+p.title+'》</td><td class="actions-cell"><a href="/post/'+p.slug+'" target="_blank" class="activity-cta">查看 →</a></td></tr>').join('');
  }catch(e){showToast('加载仪表盘失败','error');}
}

// ─── Editor ────────────────────────────────────────────
async function loadEditorOptions(){
  try{
    const cats=await api('/api/categories');
    document.getElementById('postCategory').innerHTML=cats.map(c=>'<option value="'+esc(c.slug)+'">'+esc(c.name)+'</option>').join('');
  }catch(e){}
}

function updatePreview(){
  const md=document.getElementById('mdEditor').value;
  let h=md;
  h=h.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
  // Headers
  h=h.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  h=h.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  h=h.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  // Bold / italic
  h=h.replace(/[*][*](.+?)[*][*]/g,'<strong>$1</strong>');
  h=h.replace(/[*](.+?)[*]/g,'<em>$1</em>');
  // Inline code
  h=h.replace(/\x60([^\x60]+)\x60/g,'<code>$1</code>');
  // Blockquote
  h=h.replace(/^> (.+)$/gm,'<blockquote><p>$1</p></blockquote>');
  // Unordered list
  h=h.replace(/^- (.+)$/gm,'<li>$1</li>');
  h=h.replace(/(<li>.*<[/]li>[\\n]?)+/g,'<ul>$&</ul>');
  // Paragraphs
  h=h.replace(/^(?!<[hupblco])(.+)$/gm,'<p>$1</p>');
  h=h.replace(/<p>[ ]*<[/]p>/g,'');
  document.getElementById('mdPreview').innerHTML=h;
}
document.getElementById('mdEditor').addEventListener('input',()=>{updatePreview();updateWordCount();});

function updateWordCount(){
  const v=document.getElementById('mdEditor').value;
  const chars=v.length,words=v.trim()?v.trim().split(/\\s+/).length:0;
  document.getElementById('wordCount').textContent='字数: '+words+' · 字符: '+chars;
}

// Editor toolbar
document.querySelectorAll('.md-tb-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const ta=document.getElementById('mdEditor'),s=ta.selectionStart,e=ta.selectionEnd,t=ta.value,sel=t.substring(s,e);
    let pre='',post='';
    switch(btn.dataset.action){
      case'bold':pre='**';post='**';break;
      case'italic':pre='*';post='*';break;
      case'code':pre=String.fromCharCode(96);post=String.fromCharCode(96);break;
      case'link':pre='[';post='](url)';break;
      case'heading':pre='\\n## ';post='';break;
      case'quote':pre='\\n> ';post='';break;
      case'list':pre='\\n- ';post='';break;
      case'image':pre='![alt](',post=')';break;
    }
    ta.value=t.substring(0,s)+pre+(sel||'文本')+post+t.substring(e);
    ta.focus();ta.selectionStart=s+pre.length;ta.selectionEnd=s+pre.length+(sel||2);
    updatePreview();updateWordCount();
  });
});

async function savePost(status){
  const slug=document.getElementById('editSlug').value||document.getElementById('postSlug').value.trim()||generateSlug();
  const title=document.getElementById('postTitle').value.trim()||'无标题文章';
  const content=document.getElementById('mdEditor').value;
  const excerpt=document.getElementById('postExcerpt').value.trim()||content.replace(/#/g,'').substring(0,160).trim();
  const category=document.getElementById('postCategory').value;
  const tagsInput=document.getElementById('postTags').value.trim();
  const tagNames=tagsInput?tagsInput.split(/[,，]/).map(s=>s.trim()).filter(Boolean):[];
  const body={slug,title,content,excerpt,category,status,tags:tagNames};
  const isNew=!document.getElementById('editSlug').value;

  try{
    const res=await api('/api/posts'+(isNew?'':'/'+slug),
      {method:isNew?'POST':'PUT',body:JSON.stringify(body)});
    showToast(status==='published'?'文章已发布！':'草稿已保存！');
    document.getElementById('editSlug').value=slug;
    if(isNew)resetEditor();
    document.getElementById('editSlug').value=slug; // restore after resetEditor clears it
  }catch(e){showToast('保存失败，请重试','error');}
}

function generateSlug(){return 'post-'+Date.now().toString(36);}
function resetEditor(){
  document.getElementById('editSlug').value='';
  document.getElementById('postTitle').value='';
  document.getElementById('postSlug').value='';
  document.getElementById('mdEditor').value='';
  document.getElementById('postExcerpt').value='';
  document.getElementById('postTags').value='';
  updatePreview();updateWordCount();
}

// Edit existing post
async function editPost(slug){
  switchView('editor');
  try{
    // Wait for both post data and category options before setting values,
    // otherwise setting select value on an empty select silently fails
    const [p]=await Promise.all([api('/api/posts/'+slug),loadEditorOptions()]);
    document.getElementById('editSlug').value=p.slug;
    document.getElementById('postTitle').value=p.title;
    document.getElementById('postSlug').value=p.slug;
    document.getElementById('mdEditor').value=p.content||'';
    document.getElementById('postExcerpt').value=p.excerpt||'';
    document.getElementById('postCategory').value=p.category||'';
    document.getElementById('postTags').value=(p.tags||[]).map(t=>t.name).join(', ');
    updatePreview();updateWordCount();
  }catch(e){showToast('加载文章失败','error');}
}

// ─── Posts Table ────────────────────────────────────────
async function loadPostsTable(){
  try{
    const posts=await api('/api/posts');
    document.getElementById('postsTableBody').innerHTML=posts.map(p=>
      '<tr><td>'+esc(p.title)+'</td>'+
      '<td><span class="badge badge-'+(p.status==='published'?'published':'draft')+'">'+(p.status==='published'?'已发布':'草稿')+'</span></td>'+
      '<td>'+esc(p.category)+'</td><td>'+(p.created_at||'').slice(0,10)+'</td>'+
      '<td class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="editPost(\\''+p.slug+'\\')">编辑</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="openRevisions(\\'post\\',\\''+p.slug+'\\')">版本</button>'+
      '<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deletePost(\\''+p.slug+'\\')">删除</button></td></tr>').join('');
  }catch(e){showToast('加载文章列表失败','error');}
}

async function deletePost(slug){
  if(!confirm('确定删除文章 "'+slug+'" 及其评论？'))return;
  try{await api('/api/posts/'+slug,{method:'DELETE'});showToast('已删除');loadPostsTable();}
  catch(e){showToast('删除失败','error');}
}

// ─── Pages ──────────────────────────────────────────────
async function loadPagesTable(){
  try{
    const pages=await api('/api/pages');
    document.getElementById('pagesTableBody').innerHTML=pages.map(p=>
      '<tr><td>'+esc(p.title)+'</td><td><span class="meta">'+esc(p.slug)+'</span></td>'+
      '<td><span class="badge badge-'+(p.status==='published'?'published':'draft')+'">'+(p.status==='published'?'已发布':'草稿')+'</span></td>'+
      '<td>'+(p.updated_at||p.created_at||'').slice(0,10)+'</td>'+
      '<td class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="showToast(\\'页面编辑功能开发中\\',\\'info\\')">编辑</button>'+
      '<button class="btn btn-ghost btn-sm" onclick="openRevisions(\\'page\\',\\''+p.slug+'\\')">版本</button></td></tr>').join('');
  }catch(e){showToast('加载页面列表失败','error');}
}

// ─── Comments ───────────────────────────────────────────
async function loadComments(){
  try{
    const comments=await api('/api/comments');
    const counts={all:comments.length,pending:0,approved:0,spam:0};
    comments.forEach(c=>{counts[c.status]=(counts[c.status]||0)+1;});
    document.getElementById('commentRows').innerHTML=
      comments.map(c=>'<div class="comment-row" data-status="'+c.status+'" data-id="'+c.id+'" data-post-slug="'+esc(c.post_slug)+'"><div class="comment-meta-row"><strong style="font-size:13px;">'+esc(c.author)+'</strong><span class="meta">'+esc(c.email)+'</span><span class="meta">'+c.created_at+'</span><span class="badge badge-'+(c.status==='approved'?'approved':c.status==='spam'?'spam':'pending')+'">'+(c.status==='approved'?'已批准':c.status==='spam'?'垃圾':'待审核')+'</span></div><div class="comment-body-text">'+esc(c.body)+'</div><div style="font-size:11px;color:var(--meta);margin-bottom:4px;">在文章：'+esc(c.post_slug)+'</div><div style="display:flex;gap:4px;">'+
      (c.status!=='approved'?'<button type="button" class="btn btn-primary btn-sm">批准</button>':'')+
      (c.status!=='spam'?'<button type="button" class="btn btn-danger btn-sm">垃圾</button>':'')+
      '<button type="button" class="btn btn-secondary btn-sm">回复</button>'+
      '<button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);">删除</button></div></div>').join('');
    updateFilterCounts();
    applyFilter();
  }catch(e){showToast('加载评论失败','error');}
}

// ─── Comment API helpers ────────────────────────────────
async function moderateComment(id,status){
  try{await api('/api/comments/'+id,{method:'PUT',body:JSON.stringify({status})});}
  catch(e){throw e;}
}
async function deleteComment(id){
  await api('/api/comments/'+id,{method:'DELETE'});
}
async function replyComment(postSlug,body){
  return await api('/api/comments',{method:'POST',body:JSON.stringify({post_slug:postSlug,author:'博主',body})});
}
// Note: replyComment hits POST /api/comments (admin route, auth required, auto-approved)

// ─── Tags ───────────────────────────────────────────────
async function loadTagsTable(){
  try{
    const tags=await api('/api/tags');
    document.getElementById('tagsTableBody').innerHTML=tags.map(t=>
      '<tr><td>'+esc(t.name)+'</td><td><span class="meta">'+esc(t.slug)+'</span></td><td><span class="meta">'+(t.post_count||0)+'</span></td>'+
      '<td class="actions-cell"><button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteTag(\\''+t.slug+'\\')">删除</button></td></tr>').join('');
  }catch(e){showToast('加载标签失败','error');}
}
async function addTag(){
  const inp=document.getElementById('newTagInput');
  const name=inp.value.trim();
  if(!name)return;
  const raw=name.toLowerCase().replace(/\\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const slug=raw||'tag-'+Date.now().toString(36);
  try{await api('/api/tags',{method:'POST',body:JSON.stringify({slug,name})});inp.value='';showToast('标签已添加');loadTagsTable();}
  catch(e){showToast('添加失败','error');}
}
async function deleteTag(slug){
  if(!confirm('确定删除标签？'))return;
  try{await api('/api/tags/'+slug,{method:'DELETE'});showToast('已删除');loadTagsTable();}
  catch(e){showToast('删除失败','error');}
}

// ─── Categories ─────────────────────────────────────────
async function loadCategoriesTable(){
  try{
    const cats=await api('/api/categories');
    document.getElementById('categoriesTableBody').innerHTML=cats.map(c=>
      '<tr><td>'+esc(c.name)+'</td><td><span class="meta">'+esc(c.slug)+'</span></td><td>'+esc(c.description)+'</td><td><span class="meta">'+(c.post_count||0)+'</span></td>'+
      '<td class="actions-cell"><button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteCategory(\\''+c.slug+'\\')">删除</button></td></tr>').join('');
  }catch(e){showToast('加载分类失败','error');}
}
function showAddCategory(){
  const name=prompt('输入新分类名称：');
  if(!name)return;
  const raw=name.toLowerCase().replace(/\\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const slug=raw||'cat-'+Date.now().toString(36);
  const desc=prompt('输入分类描述（可选）：')||'';
  api('/api/categories',{method:'POST',body:JSON.stringify({slug,name,description:desc,sort_order:99})})
    .then(()=>{showToast('分类已添加');loadCategoriesTable();})
    .catch(()=>showToast('添加失败','error'));
}
async function deleteCategory(slug){
  if(!confirm('确定删除分类？'))return;
  try{await api('/api/categories/'+slug,{method:'DELETE'});showToast('已删除');loadCategoriesTable();}
  catch(e){showToast('删除失败','error');}
}

// ─── Password Change ─────────────────────────────────────
const pwdMsg=document.getElementById('pwdMsg');
function showPwdMsg(type,text){
  pwdMsg.style.display='block';pwdMsg.textContent=text;
  pwdMsg.style.background=type==='success'?'color-mix(in oklch,var(--success) 12%,transparent)':'color-mix(in oklch,var(--danger) 10%,transparent)';
  pwdMsg.style.color=type==='success'?'var(--success)':'var(--danger)';
  pwdMsg.style.border='1px solid '+(type==='success'?'var(--success)':'var(--danger)');
}
function hidePwdMsg(){pwdMsg.style.display='none';}

async function changePassword(){
  hidePwdMsg();
  const cur=document.getElementById('pwdCurrent').value.trim();
  const nw=document.getElementById('pwdNew').value.trim();
  const cf=document.getElementById('pwdConfirm').value.trim();
  if(!cur){showPwdMsg('error','请输入当前密码');document.getElementById('pwdCurrent').focus();return;}
  if(!nw){showPwdMsg('error','请输入新密码');document.getElementById('pwdNew').focus();return;}
  if(nw.length<8){showPwdMsg('error','新密码至少需要 8 个字符');document.getElementById('pwdNew').focus();return;}
  if(!/[a-zA-Z]/.test(nw)||!/[0-9]/.test(nw)){showPwdMsg('error','新密码必须同时包含字母和数字');document.getElementById('pwdNew').focus();return;}
  if(nw!==cf){showPwdMsg('error','两次输入的新密码不一致');document.getElementById('pwdConfirm').focus();return;}
  if(nw===cur){showPwdMsg('error','新密码不能与当前密码相同');document.getElementById('pwdNew').focus();return;}
  try{
    const res=await api('/api/auth/password',{method:'PUT',body:JSON.stringify({currentPassword:cur,newPassword:nw})});
    showPwdMsg('success','✓ 密码已成功更新');
    document.getElementById('pwdCurrent').value='';
    document.getElementById('pwdNew').value='';
    document.getElementById('pwdConfirm').value='';
  }catch(e){
    const err=await e.json().catch(()=>({error:'请求失败'}));
    showPwdMsg('error',err.error||'密码修改失败');
  }
}

document.getElementById('pwdSubmit').addEventListener('click',changePassword);
document.getElementById('pwdCancel').addEventListener('click',()=>{
  hidePwdMsg();
  document.getElementById('pwdCurrent').value='';
  document.getElementById('pwdNew').value='';
  document.getElementById('pwdConfirm').value='';
});

// ─── Comment actions (approve / reply / spam / delete) ──
const commentsCard=document.getElementById('view-comments').querySelector('.card');
commentsCard.addEventListener('click',e=>{
  const btn=e.target.closest('button');
  if(!btn)return;
  const row=btn.closest('.comment-row');
  if(!row)return;
  const commentId=row.dataset.id;
  const badge=row.querySelector('.badge');
  const actions=row.querySelector('div:last-child');
  const text=btn.textContent.trim();

  if(text==='批准'){
    if(!commentId)return;
    moderateComment(commentId,'approved')
      .then(()=>{badge.textContent='已批准';badge.className='badge badge-approved';row.dataset.status='approved';btn.remove();updateFilterCounts();applyFilter();})
      .catch(()=>showToast('操作失败','error'));
  }else if(text==='垃圾'){
    if(!commentId)return;
    moderateComment(commentId,'spam')
      .then(()=>{
        badge.textContent='垃圾';badge.className='badge badge-spam';row.dataset.status='spam';
        // Remove approve and spam buttons (only keep reply and delete)
        row.querySelectorAll('button').forEach(b=>{const t=b.textContent.trim();if(t==='批准'||t==='垃圾')b.remove();});
        updateFilterCounts();applyFilter();
      })
      .catch(()=>showToast('操作失败','error'));
  }else if(text==='删除'){
    const actionsDiv=btn.closest('div');
    const originalHTML=actionsDiv.innerHTML;
    actionsDiv.innerHTML='<span style="font-size:12px;color:var(--danger);margin-right:6px;">确认删除？</span><button type="button" class="btn btn-danger btn-sm confirm-yes">确认</button><button type="button" class="btn btn-ghost btn-sm confirm-no">取消</button>';
    actionsDiv.querySelector('.confirm-yes').addEventListener('click',()=>{
      if(commentId){
        deleteComment(commentId).then(()=>{row.remove();updateFilterCounts();applyFilter();}).catch(()=>showToast('删除失败','error'));
      }else{row.remove();updateFilterCounts();applyFilter();}
    });
    actionsDiv.querySelector('.confirm-no').addEventListener('click',()=>{actionsDiv.innerHTML=originalHTML;});
  }else if(text==='回复'){
    const existing=row.querySelector('.reply-form');
    if(existing){existing.remove();return;}
    const form=document.createElement('div');
    form.className='reply-form';
    form.innerHTML='<textarea placeholder="写下回复…" rows="2"></textarea><div class="reply-actions"><button type="button" class="btn btn-primary btn-sm reply-submit">提交回复</button><button type="button" class="btn btn-secondary btn-sm reply-cancel">取消</button></div>';
    row.appendChild(form);
    form.querySelector('textarea').focus();
    form.querySelector('.reply-cancel').addEventListener('click',()=>form.remove());
    form.querySelector('.reply-submit').addEventListener('click',()=>{
      const ta=form.querySelector('textarea');
      const val=ta.value.trim();
      if(!val){ta.focus();return;}
      replyComment(row.dataset.postSlug||'',val)
        .then(()=>{
          const entry=document.createElement('div');
          entry.className='reply-entry';
          const now=new Date();
          const ts=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
          entry.innerHTML='<div>'+val.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div><div class="reply-meta">博主回复 · '+ts+'</div>';
          form.parentNode.insertBefore(entry,form);
          ta.value='';ta.focus();
        }).catch(()=>showToast('回复提交失败','error'));
    });
  }
});

// ─── Comment filter ─────────────────────────────────────
function applyFilter(){
  const active=document.querySelector('.filter-btn.active');
  if(!active)return;
  const filter=active.dataset.filter;
  let visible=0;
  document.querySelectorAll('.comment-row').forEach(r=>{
    const match=filter==='all'||r.dataset.status===filter;
    r.style.display=match?'':'none';
    if(match)visible++;
  });
  document.getElementById('commentsEmpty').style.display=visible===0?'block':'none';
}
function updateFilterCounts(){
  const counts={all:0,pending:0,approved:0,spam:0};
  document.querySelectorAll('.comment-row').forEach(r=>{
    counts.all++;
    const s=r.dataset.status;
    if(counts.hasOwnProperty(s))counts[s]++;
  });
  document.querySelectorAll('.filter-btn').forEach(btn=>{
    const f=btn.dataset.filter;
    const span=btn.querySelector('.filter-count');
    if(span&&counts.hasOwnProperty(f))span.textContent=counts[f];
  });
}
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter();
  });
});
applyFilter();updateFilterCounts(); // initial state on page load

// ─── Revisions (历史版本) ────────────────────────────────
const revModal = document.getElementById('revModalBackdrop');
let revCurrent = null; // { type, slug }

async function openRevisions(type, slug){
  revCurrent = { type, slug };
  document.getElementById('revModalTitle').textContent = type === 'post' ? '文章历史版本' : '页面历史版本';
  document.getElementById('revPreview').style.display = 'none';
  revModal.style.display = 'flex';
  const listEl = document.getElementById('revList');
  listEl.innerHTML = '<span class="meta">加载中…</span>';
  try{
    const list = await api('/api/' + type + 's/' + slug + '/revisions');
    if(!list || !list.length){
      listEl.innerHTML = '<div class="rev-empty">暂无历史版本 — 内容发布后每次编辑都会自动保存版本</div>';
      return;
    }
    listEl.innerHTML = list.map(r =>
      '<div class="rev-item" data-id="'+r.id+'">'+
        '<div class="rev-item-head">'+
          '<span class="badge badge-'+(r.status==='published'?'published':'draft')+'">'+(r.status==='published'?'已发布':'草稿')+'</span>'+
          '<strong style="font-size:13px;">#'+r.id+'</strong>'+
          '<span class="rev-note">'+esc(r.note)+'</span>'+
          '<span class="meta" style="margin-left:auto;">'+esc(r.created_at)+'</span>'+
        '</div>'+
        '<div class="rev-title">'+esc(r.title)+'</div>'+
        '<div class="rev-actions">'+
          '<button type="button" class="btn btn-secondary btn-sm" onclick="previewRevision('+r.id+')">预览</button>'+
          '<button type="button" class="btn btn-primary btn-sm" onclick="restoreRevision('+r.id+')">恢复</button>'+
        '</div>'+
      '</div>').join('');
  }catch(e){ listEl.innerHTML = '<div class="rev-empty">加载版本失败</div>'; }
}

async function previewRevision(id){
  try{
    const r = await api('/api/revisions/' + id);
    if(!r) return;
    document.getElementById('revPreviewHead').innerHTML =
      '<span class="badge badge-'+(r.status==='published'?'published':'draft')+'">'+(r.status==='published'?'已发布':'草稿')+'</span>'+
      '<strong>#'+r.id+'</strong><span class="rev-note">'+esc(r.note)+'</span>'+
      '<span class="meta">'+esc(r.created_at)+'</span>';
    document.getElementById('revPreviewBody').textContent = r.content || '（空内容）';
    document.getElementById('revPreview').style.display = 'block';
  }catch(e){ showToast('预览失败','error'); }
}

async function restoreRevision(id){
  if(!confirm('确定恢复到版本 #'+id+'？当前内容将被覆盖，恢复动作会生成一条新版本记录。'))return;
  try{
    await api('/api/revisions/' + id + '/restore', { method: 'POST' });
    showToast('已恢复到版本 #'+id);
    revModal.style.display = 'none';
    // 刷新当前视图数据
    if(revCurrent?.type === 'post') loadPostsTable();
    else loadPagesTable();
  }catch(e){ showToast('恢复失败','error'); }
}

document.getElementById('revModalClose').addEventListener('click',()=>{ revModal.style.display='none'; });
revModal.addEventListener('click',e=>{ if(e.target===revModal) revModal.style.display='none'; });

// ─── Media ───────────────────────────────────────────────
async function loadMedia(){
  try{
    const media=await api('/api/media');
    if(!media||!media.length){
      document.getElementById('mediaGrid').innerHTML='';
      document.getElementById('mediaEmpty').style.display='block';
      return;
    }
    document.getElementById('mediaEmpty').style.display='none';
    document.getElementById('mediaGrid').innerHTML=media.map(m=>{
      const size=(m.size/1024).toFixed(0)+' KB';
      const url=location.origin+'/media/'+m.id;
      return '<div class="media-card" data-id="'+m.id+'">'+
        '<img src="/media/'+m.id+'" alt="'+esc(m.filename)+'" loading="lazy" />'+
        '<div class="media-meta"><span class="media-name" title="'+esc(m.filename)+'">'+esc(m.filename)+'</span>'+
        '<span class="media-sub">'+size+' · '+esc(m.content_type)+'</span></div>'+
        '<div class="media-actions">'+
        '<button type="button" class="btn btn-ghost btn-sm media-copy" data-url="'+url+'" title="复制 Markdown 引用">复制链接</button>'+
        '<button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteMedia(\\''+m.id+'\\')">删除</button>'+
        '</div></div>';
    }).join('');
  }catch(e){showToast('加载媒体失败','error');}
}

document.getElementById('mediaInput').addEventListener('change',async(e)=>{
  const files=e.target.files;
  if(!files||!files.length)return;
  const fd=new FormData();
  fd.append('file',files[0]);
  const btn=document.querySelector('#view-media .btn-primary');
  btn.disabled=true;btn.textContent='上传中…';
  try{
    const res=await api('/api/media',{method:'POST',body:fd});
    showToast('上传成功');
    loadMedia();
  }catch(err){
    const msg=await err.json().catch(()=>({error:'上传失败'}));
    showToast(msg.error||'上传失败','error');
  }finally{
    btn.disabled=false;btn.textContent='↑ 上传图片';
    e.target.value='';
  }
});

document.getElementById('mediaGrid').addEventListener('click',async(e)=>{
  const btn=e.target.closest('.media-copy');
  if(!btn)return;
  try{
    await navigator.clipboard.writeText(btn.dataset.url||'');
    showToast('链接已复制，可在编辑器中粘贴');
  }catch(err){showToast('复制失败，请手动复制','error');}
});

async function deleteMedia(id){
  if(!confirm('确定删除这张图片？文章中的引用将失效。'))return;
  try{
    await api('/api/media/'+id,{method:'DELETE'});
    showToast('已删除');
    loadMedia();
  }catch(e){showToast('删除失败','error');}
}

// ─── Preferences save/load (localStorage) ────────────────
const prefMsg=document.getElementById('prefMsg');
const brandName=document.getElementById('brandName');
const editorLayout=document.getElementById('editorLayout');
const editorPreviewCol=document.getElementById('editorPreviewCol');
const editorInputCol=document.getElementById('editorInputCol');
const previewLabel=document.getElementById('previewLabel');
const DEFAULTS={blogTitle:'cLog',tagline:'文字自有重量',perPage:'10',editorMode:'split',siteUrl:'',aboutAuthor:'',slogan:'',description:'',footerNote:''};

let prefMsgTimer;
function showPrefMsg(text,isError){
  clearTimeout(prefMsgTimer);
  prefMsg.textContent=text;prefMsg.classList.add('show');
  prefMsg.style.background=isError
    ?'color-mix(in oklch,var(--danger) 10%,transparent)'
    :'color-mix(in oklch,var(--success) 12%,transparent)';
  prefMsg.style.color=isError?'var(--danger)':'var(--success)';
  prefMsg.style.border='1px solid '+(isError?'var(--danger)':'var(--success)');
  prefMsgTimer=setTimeout(()=>{prefMsg.classList.remove('show');},3000);
}
function hidePrefMsg(){
  clearTimeout(prefMsgTimer);
  prefMsg.classList.remove('show');
}

function applyBlogTitle(title){
  brandName.textContent=title||DEFAULTS.blogTitle;
  document.title='管理后台 · '+(title||DEFAULTS.blogTitle);
}

function applyEditorMode(mode){
  editorLayout.classList.remove('pure-mode');
  editorPreviewCol.style.display='';
  editorInputCol.style.display='';
  previewLabel.textContent='实时预览';
  updatePreview();
  if(mode==='pure'){
    editorLayout.classList.add('pure-mode');
    editorPreviewCol.style.display='none';
  }
}

async function loadPrefs(){
  let saved;
  try{saved=JSON.parse(localStorage.getItem('blog-prefs')||'{}');}catch(e){saved={};}
  // 服务器设置为权威值 (跨浏览器一致), localStorage 仅作前端覆盖
  let server={};
  try{server=(await api('/api/settings'))||{};}catch(e){}
  const title=server.blog_title||saved.blogTitle||DEFAULTS.blogTitle;
  const tagline=server.blog_tagline||saved.tagline||DEFAULTS.tagline;
  const siteUrl=server.site_url||saved.siteUrl||DEFAULTS.siteUrl;
  const aboutAuthor=server.about_author||saved.aboutAuthor||DEFAULTS.aboutAuthor;
  const slogan=server.blog_slogan||saved.slogan||DEFAULTS.slogan;
  const description=server.blog_description||saved.description||DEFAULTS.description;
  const footerNote=server.footer_note||saved.footerNote||DEFAULTS.footerNote;
  document.getElementById('prefBlogTitle').value=title;
  document.getElementById('prefTagline').value=tagline;
  document.getElementById('prefSiteUrl').value=siteUrl;
  document.getElementById('prefAboutAuthor').value=aboutAuthor;
  document.getElementById('prefSlogan').value=slogan;
  document.getElementById('prefDescription').value=description;
  document.getElementById('prefFooterNote').value=footerNote;
  document.getElementById('prefPerPage').value=saved.perPage||server.per_page||DEFAULTS.perPage;
  document.getElementById('prefEditorMode').value=saved.editorMode||DEFAULTS.editorMode;
  applyBlogTitle(title);
  applyEditorMode(saved.editorMode||DEFAULTS.editorMode);
}
loadPrefs();

document.getElementById('prefSubmit').addEventListener('click',async()=>{
  hidePrefMsg();
  const prefs={
    blogTitle:document.getElementById('prefBlogTitle').value.trim()||DEFAULTS.blogTitle,
    tagline:document.getElementById('prefTagline').value.trim(),
    siteUrl:document.getElementById('prefSiteUrl').value.trim(),
    aboutAuthor:document.getElementById('prefAboutAuthor').value.trim(),
    slogan:document.getElementById('prefSlogan').value.trim(),
    description:document.getElementById('prefDescription').value.trim(),
    footerNote:document.getElementById('prefFooterNote').value.trim(),
    perPage:document.getElementById('prefPerPage').value,
    editorMode:document.getElementById('prefEditorMode').value
  };
  // Persist UI preferences locally (immediate feedback)
  localStorage.setItem('blog-prefs',JSON.stringify(prefs));
  applyBlogTitle(prefs.blogTitle);
  applyEditorMode(prefs.editorMode);
  showPrefMsg('✓ 偏好设置已保存',false);
  // Sync site-wide settings to server (每页文章数/站点 URL/关于博主/站点文案也同步)
  try {
    await api('/api/settings',{method:'PUT',body:JSON.stringify({
      blog_title:prefs.blogTitle,
      blog_tagline:prefs.tagline,
      site_url:prefs.siteUrl,
      about_author:prefs.aboutAuthor,
      blog_slogan:prefs.slogan,
      blog_description:prefs.description,
      footer_note:prefs.footerNote,
      per_page:prefs.perPage
    })});
  } catch(e) {
    showToast('服务器同步失败，偏好仅保存在本地','error');
  }
});

document.getElementById('prefCancel').addEventListener('click',()=>{
  hidePrefMsg();
  localStorage.removeItem('blog-prefs');
  document.getElementById('prefBlogTitle').value=DEFAULTS.blogTitle;
  document.getElementById('prefTagline').value=DEFAULTS.tagline;
  document.getElementById('prefSiteUrl').value=DEFAULTS.siteUrl;
  document.getElementById('prefAboutAuthor').value=DEFAULTS.aboutAuthor;
  document.getElementById('prefSlogan').value=DEFAULTS.slogan;
  document.getElementById('prefDescription').value=DEFAULTS.description;
  document.getElementById('prefFooterNote').value=DEFAULTS.footerNote;
  document.getElementById('prefPerPage').value=DEFAULTS.perPage;
  document.getElementById('prefEditorMode').value=DEFAULTS.editorMode;
  applyBlogTitle(DEFAULTS.blogTitle);
  applyEditorMode(DEFAULTS.editorMode);
  showPrefMsg('已恢复默认设置',false);
});

// ─── 强制改密 (初始密码未修改时全屏拦截, 修改前无法使用后台) ──
const forcePwd = document.getElementById('forcePwd');
const forcePwdMsg = document.getElementById('forcePwdMsg');
function showForcePwdMsg(type, text){
  forcePwdMsg.textContent = text;
  forcePwdMsg.style.background = type==='success' ? 'color-mix(in oklch,var(--success) 12%,transparent)' : 'color-mix(in oklch,var(--danger) 10%,transparent)';
  forcePwdMsg.style.color = type==='success' ? 'var(--success)' : 'var(--danger)';
  forcePwdMsg.style.border = '1px solid ' + (type==='success' ? 'var(--success)' : 'var(--danger)');
  forcePwdMsg.classList.add('show');
}
async function checkForceChange(){
  try{
    const r = await api('/api/auth/check');
    if(r && r.authenticated && r.must_change){
      forcePwd.style.display = 'flex';
      document.querySelector('.main').style.display = 'none';
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('forcePwdCurrent').focus();
    }
  }catch(e){ /* 未登录等, 正常渲染 */ }
}
document.getElementById('forcePwdSubmit').addEventListener('click', async () => {
  const cur = document.getElementById('forcePwdCurrent').value.trim();
  const nw = document.getElementById('forcePwdNew').value.trim();
  const cf = document.getElementById('forcePwdConfirm').value.trim();
  forcePwdMsg.classList.remove('show');
  if(!cur){ showForcePwdMsg('error','请输入当前密码'); return; }
  if(nw.length < 8 || !/[a-zA-Z]/.test(nw) || !/[0-9]/.test(nw)){ showForcePwdMsg('error','新密码至少 8 位且包含字母和数字'); return; }
  if(nw !== cf){ showForcePwdMsg('error','两次输入的新密码不一致'); return; }
  const btn = document.getElementById('forcePwdSubmit');
  btn.disabled = true; btn.textContent = '提交中…';
  try{
    await api('/api/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
    showForcePwdMsg('success','✓ 密码已更新，正在重新登录…');
    setTimeout(()=>{ location.href = '/login'; }, 1200);
  }catch(e){
    const err = await e.json().catch(() => ({ error: '修改失败' }));
    showForcePwdMsg('error', err.error || '修改失败');
    btn.disabled = false; btn.textContent = '更新密码';
  }
});
// Enter 键提交
document.getElementById('forcePwdConfirm').addEventListener('keydown', e => {
  if(e.key === 'Enter') document.getElementById('forcePwdSubmit').click();
});

// ─── Init ───────────────────────────────────────────────
loadDashboard();
checkForceChange();
// 首次登录 (初始密码) 引导改密 (强制改密界面未启用时的辅助提示)
if (new URLSearchParams(location.search).get('welcome')) {
  setTimeout(()=>showToast('当前使用初始密码，建议立即在「设置 → 账户安全」中修改','info'),800);
}
  </script>
</body>
</html>`;
}
