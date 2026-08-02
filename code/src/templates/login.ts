// ─── Login Page Template ──────────────────────────────────

export function loginTemplate(error?: string, blogTitle = 'cLog'): string {
  const errorHtml = error ? `<p style="color:var(--danger);text-align:center;margin-top:var(--gap-sm);font-size:var(--fs-sm);" role="alert">${error}</p>` : '';

  return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>登录 · ${blogTitle}</title>
  <style>
    :root {
      --bg: #ffffff; --surface: #ffffff; --surface-warm: var(--surface);
      --fg: #171717; --fg-2: #4d4d4d; --muted: #666666; --meta: #808080;
      --border: rgba(0, 0, 0, 0.08); --border-soft: rgba(0, 0, 0, 0.04);
      --accent: #0070f3; --accent-on: #ffffff;
      --accent-soft: color-mix(in oklch, var(--accent) 14%, transparent);
      --accent-hover: color-mix(in oklch, var(--accent) 88%, black);
      --fg-soft: color-mix(in oklch, var(--fg) 6%, transparent);
      --success: #16a34a; --danger: #dc2626;
      --font-display: "Geist", "Geist Sans", -apple-system, "Segoe UI", Arial, sans-serif;
      --font-body: "Geist", "Geist Sans", -apple-system, "Segoe UI", Arial, sans-serif;
      --font-mono: "Geist Mono", ui-monospace, "SF Mono", "Roboto Mono", Menlo, Monaco, monospace;
      --fs-body: 16px; --fs-sm: 14px; --fs-meta: 13px;
      --gap-xs: 8px; --gap-sm: 12px; --gap-md: 20px; --gap-lg: 32px; --gap-xl: 56px;
      --radius: 8px; --radius-lg: 12px;
      --elev-raised: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), 0 0 0 1px #fafafa;
      --motion-fast: 150ms; --ease-standard: cubic-bezier(0.2, 0, 0, 1);
    }
    [data-theme="dark"] {
      --bg: #0a0a0a; --surface: #171717; --surface-warm: #171717;
      --fg: #fafafa; --fg-2: #a1a1a1; --muted: #a1a1a1; --meta: #808080;
      --border: rgba(255, 255, 255, 0.08); --border-soft: rgba(255, 255, 255, 0.04);
      --accent: #3399ff; --accent-on: #0a0a0a;
      --accent-soft: color-mix(in oklch, var(--accent) 18%, transparent);
      --fg-soft: color-mix(in oklch, var(--fg) 8%, transparent);
      --elev-raised: 0 0 0 1px rgba(255,255,255,0.08), 0 2px 2px rgba(0,0,0,0.2), 0 8px 8px -8px rgba(0,0,0,0.2), 0 0 0 1px #1a1a1a;
    }
    *,*::before,*::after{box-sizing:border-box}
    html{-webkit-text-size-adjust:100%}
    body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);font-size:var(--fs-body);line-height:1.5;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
    a{color:inherit;text-decoration:none}
    button{font:inherit;cursor:pointer;border:0;background:none}
    :focus-visible{outline:2px solid var(--accent);outline-offset:2px}

    .login-wrapper{flex:1;display:grid;place-items:center;padding:var(--gap-lg)}
    .login-card{width:100%;max-width:400px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--gap-xl) var(--gap-lg);transition:box-shadow var(--motion-fast) var(--ease-standard)}
    .login-card:hover{box-shadow:var(--elev-raised)}
    .login-header{text-align:center;margin-bottom:var(--gap-lg)}
    .login-header .logo{font-family:var(--font-display);font-size:24px;font-weight:600;letter-spacing:-0.02em;display:inline-flex;align-items:center;gap:8px;margin-bottom:var(--gap-xs)}
    .login-header .logo-dot{width:10px;height:10px;border-radius:50%;background:var(--accent)}
    .login-header p{margin:0;color:var(--muted);font-size:var(--fs-sm)}
    .theme-corner{position:fixed;top:16px;right:16px;z-index:10}
    .theme-corner button{width:36px;height:36px;display:grid;place-items:center;border-radius:var(--radius);border:1px solid var(--border);color:var(--muted);font-size:16px;transition:all var(--motion-fast);background:var(--surface)}
    .theme-corner button:hover{color:var(--fg);border-color:var(--fg)}

    .field{display:flex;flex-direction:column;gap:6px;margin-bottom:var(--gap-md)}
    .field label{font-size:12px;color:var(--meta);font-weight:500;text-transform:uppercase;letter-spacing:0.06em}
    .field input{width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--fg);font:inherit;font-size:15px;transition:border-color var(--motion-fast)}
    .field input:focus{border-color:var(--accent);outline:2px solid var(--accent-soft)}
    .field input.error{border-color:var(--danger)}
    .field-error{display:none;font-size:12px;color:var(--danger);margin-top:2px}
    .field-error.show{display:block}
    .pw-wrapper{position:relative;display:flex}
    .pw-wrapper input{flex:1;padding-right:40px}
    .pw-toggle{position:absolute;right:2px;top:2px;bottom:2px;width:36px;display:grid;place-items:center;color:var(--meta);font-size:14px;border-radius:0 var(--radius) var(--radius) 0;transition:color var(--motion-fast)}
    .pw-toggle:hover{color:var(--fg)}

    .row-check{display:flex;align-items:center;gap:8px;margin-bottom:var(--gap-md);font-size:13px;color:var(--muted)}
    .row-check input[type="checkbox"]{accent-color:var(--accent)}

    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 20px;border-radius:var(--radius);font-size:15px;font-weight:500;transition:all var(--motion-fast) var(--ease-standard)}
    .btn:active{transform:translateY(1px)}
    .btn-primary{background:var(--fg);color:#ffffff;border:1px solid var(--fg)}
    .btn-primary:hover{background:#333333}
    .btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}

    .login-footer-note{text-align:center;margin-top:var(--gap-lg);font-size:var(--fs-sm);color:var(--muted)}
    .login-footer-note a{color:var(--accent);transition:opacity var(--motion-fast)}
    .login-footer-note a:hover{opacity:0.8}

    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}}
    @media(max-width:460px){.login-card{padding:var(--gap-lg) var(--gap-md)}.login-header .logo{font-size:20px}}
  </style>
</head>
<body>
  <div class="theme-corner">
    <button id="themeToggle" aria-label="切换暗色模式">◐</button>
  </div>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <div class="logo"><span class="logo-dot"></span>${blogTitle}</div>
        <p>仅需密码即可登录 · 单用户系统</p>
      </div>

      <form id="loginForm" novalidate>
        <div class="field">
          <label for="password">密码</label>
          <div class="pw-wrapper">
            <input id="password" type="password" placeholder="输入登录密码" autocomplete="current-password" autofocus required />
            <button type="button" class="pw-toggle" id="pwToggle" aria-label="显示密码" tabindex="-1">👁</button>
          </div>
          <span class="field-error" id="passwordError" role="alert"></span>
        </div>
        <div class="row-check">
          <input type="checkbox" id="rememberMe" />
          <label for="rememberMe">记住我（保持登录 30 天）</label>
        </div>
        ${errorHtml}
        <button type="submit" class="btn btn-primary" id="loginBtn" style="margin-top:${error ? 'var(--gap-sm)' : '0'};">登 录</button>
      </form>

      <p class="login-footer-note">
        返回 <a href="/">博客首页</a>
      </p>
    </div>
  </div>

  <script>
    const html=document.documentElement;
    const stored=localStorage.getItem('blog-theme');
    if(stored)html.setAttribute('data-theme',stored);
    else if(window.matchMedia('(prefers-color-scheme:dark)').matches)html.setAttribute('data-theme','dark');
    const tt=document.getElementById('themeToggle');
    tt.textContent=html.getAttribute('data-theme')==='dark'?'◑':'◐';
    tt.addEventListener('click',()=>{
      const n=html.getAttribute('data-theme')==='dark'?'light':'dark';
      html.setAttribute('data-theme',n);tt.textContent=n==='dark'?'◑':'◐';
      localStorage.setItem('blog-theme',n);
    });

    const pw=document.getElementById('password'),pwToggle=document.getElementById('pwToggle');
    pwToggle.addEventListener('click',()=>{
      const isPw=pw.type==='password';
      pw.type=isPw?'text':'password';
      pwToggle.textContent=isPw?'👁‍🗨':'👁';
    });

    const form=document.getElementById('loginForm'),btn=document.getElementById('loginBtn');
    const errEl=document.getElementById('passwordError');
    function showError(msg){errEl.textContent=msg;errEl.classList.add('show');pw.classList.add('error');pw.style.borderColor='var(--danger)';}
    function clearError(){errEl.classList.remove('show');pw.classList.remove('error');pw.style.borderColor='';}
    pw.addEventListener('input',clearError);
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const p=pw.value.trim();
      if(!p){showError('请输入密码');pw.focus();return;}
      clearError();
      btn.disabled=true;btn.textContent='验证中…';
      try{
        const remember=document.getElementById('rememberMe').checked;
        const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p,rememberMe:remember})});
        if(res.ok){
          const data=await res.json();
          // 初始密码尚未修改 → 引导去设置页改密
          window.location.href = data.must_change ? '/admin?welcome=1' : '/admin';
        }
        else{const data=await res.json().catch(()=>({error:'登录失败'}));btn.disabled=false;btn.textContent='登 录';showError(data.error||'密码错误，请重试');}
      }catch(e){btn.disabled=false;btn.textContent='登 录';showError('网络错误，请检查连接');}
    });
  </script>
</body>
</html>`;
}
