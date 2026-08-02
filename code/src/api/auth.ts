// ─── Auth middleware & routes ─────────────────────────────

import type { Context, Next } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

// Simple password verification using SHA-256
export async function verifyPassword(db: D1Database, password: string): Promise<boolean> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?')
    .bind('password_hash')
    .first<{ value: string }>();

  if (!row) return false;

  const hash = await sha256(password);
  return hash === row.value;
}

export async function getJwtSecret(db: D1Database): Promise<string> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?')
    .bind('jwt_secret')
    .first<{ value: string }>();

  return row?.value || 'fallback-secret-change-me';
}

// Web Crypto SHA-256 (seed.ts 共用, 单一实现防漂移)
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple JWT sign (HMAC-SHA256)
async function signJwt(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerB64 = b64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = b64url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  const sigB64 = b64url(new Uint8Array(signature));

  return `${signingInput}.${sigB64}`;
}

// Simple JWT verify
export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const signature = fromB64url(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(signingInput));

    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromB64url(payloadB64)));

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

// Hono middleware — checks JWT cookie
export function authMiddleware(db: D1Database) {
  return async (c: Context, next: Next) => {
    const cookie = c.req.header('Cookie') || '';
    const match = cookie.match(/blog_token=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      // Also check Authorization header
      const authHeader = c.req.header('Authorization') || '';
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      const bearerToken = bearerMatch ? bearerMatch[1] : null;

      if (!bearerToken) {
        return c.json({ error: '未登录' }, 401);
      }

      const secret = await getJwtSecret(db);
      const payload = await verifyJwt(bearerToken, secret);
      if (!payload) {
        return c.json({ error: '登录已过期' }, 401);
      }
      const r1 = restrictedCheck(c, payload);
      if (r1) return r1;
      return next();
    }

    const secret = await getJwtSecret(db);
    const payload = await verifyJwt(token, secret);
    if (!payload) {
      return c.json({ error: '登录已过期' }, 401);
    }
    const r2 = restrictedCheck(c, payload);
    if (r2) return r2;
    await next();
  };
}

// 强制改密: 初始密码 token (payload.initial) 仅允许调用改密接口, 其余后台 API 一律 403
function restrictedCheck(c: Context, payload: Record<string, unknown>): Response | void {
  if (payload.initial === true) {
    const url = new URL(c.req.url);
    const isPasswordChange = url.pathname === '/api/auth/password' && c.req.method === 'PUT';
    if (!isPasswordChange) {
      return c.json({ error: '请先修改初始密码后才能使用后台', code: 'must_change_password' }, 403);
    }
  }
}

// Login handler
export async function loginHandler(c: Context): Promise<Response> {
  const db = c.env.DB as D1Database;
  const { password, rememberMe } = await c.req.json<{ password: string; rememberMe?: boolean }>();

  // 登录失败限流: 10 分钟窗口内失败超过阈值 → 429 (阈值可经设置调整)
  // 注意: 429 响应不计数 (拒绝请求不加重惩罚, 避免自锁)
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const maxAttempts = await getSettingInt(db, 'login_max_attempts', 10);
  const allowed = await checkRateLimit(db, `login:${ip}`, 600, maxAttempts);
  if (!allowed) {
    return c.json({ error: '尝试次数过多，请 10 分钟后再试' }, 429);
  }

  if (!password) {
    return c.json({ error: '请输入密码' }, 400);
  }

  const valid = await verifyPassword(db, password);
  if (!valid) {
    return c.json({ error: '密码错误' }, 401);
  }

  // 登录成功 → 清除失败计数
  await resetRateLimit(db, `login:${ip}`);

  // 初始密码标记存在 → 签发受限 token (仅可改密), 前端进入强制改密流程
  const initial = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('password_initial').first();
  const mustChange = !!initial;

  const secret = await getJwtSecret(db);
  const now = Math.floor(Date.now() / 1000);
  const days = rememberMe ? 30 : 7;
  const token = await signJwt(
    { sub: 'admin', iat: now, exp: now + 86400 * days, ...(mustChange ? { initial: true } : {}) },
    secret
  );

  // Session cookie (no Max-Age) when "remember me" is unchecked — cleared on browser close
  const maxAge = rememberMe ? `; Max-Age=${86400 * days}` : '';
  return new Response(JSON.stringify({ success: true, must_change: mustChange }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `blog_token=${token}; HttpOnly; SameSite=Lax; Path=/${maxAge}`,
    },
  });
}

async function getSettingInt(db: D1Database, key: string, fallback: number): Promise<number> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  const n = row ? parseInt(row.value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// 滑动窗口限流: 窗口内未超阈值则计数 +1 并放行; 已超阈值返回 false 且不计数
async function checkRateLimit(db: D1Database, key: string, windowSec: number, max: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - windowSec).run();
  const row = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
  if (row && row.count >= max) return false;
  if (!row) {
    await db.prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)').bind(key, now).run();
  } else {
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  }
  return true;
}

async function resetRateLimit(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
}

// Logout handler
export function logoutHandler(c: Context): Response {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'blog_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}

// Change password handler (requires JWT auth)
export async function changePasswordHandler(c: Context): Promise<Response> {
  const db = c.env.DB as D1Database;
  const { currentPassword, newPassword } = await c.req.json<{ currentPassword: string; newPassword: string }>();

  if (!currentPassword || !newPassword) {
    return c.json({ error: '请输入当前密码和新密码' }, 400);
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return c.json({ error: '新密码至少需要 8 个字符' }, 400);
  }
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return c.json({ error: '新密码必须同时包含字母和数字' }, 400);
  }

  // Verify current password
  const valid = await verifyPassword(db, currentPassword);
  if (!valid) {
    return c.json({ error: '当前密码错误' }, 401);
  }

  // Hash and store new password
  const hash = await sha256(newPassword);
  await db.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(hash, 'password_hash').run();
  // 初始密码已修改 → 清除强制改密标记 (此后登录签发完整 token)
  await db.prepare('DELETE FROM settings WHERE key = ?').bind('password_initial').run();

  return c.json({ success: true, message: '密码已更新' });
}

// Check auth status
export async function checkAuthHandler(c: Context): Promise<Response> {
  const db = c.env.DB as D1Database;
  const secret = await getJwtSecret(db);
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/blog_token=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) return c.json({ authenticated: false, must_change: false });

  const payload = await verifyJwt(token, secret);
  if (!payload) return c.json({ authenticated: false, must_change: false });
  // 受限 token (初始密码未改) 或标记仍存在 → 前端强制改密
  const initial = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('password_initial').first();
  return c.json({ authenticated: true, must_change: payload.initial === true || !!initial });
}
