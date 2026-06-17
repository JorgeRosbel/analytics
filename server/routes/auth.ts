import { Hono } from 'hono';
import type { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { LoginSchema, type AppEnv } from '../types';
import { verifyPassword } from '../utils/password';
import { authMiddleware } from '../middleware/auth';

const ACCESS_TTL = 60 * 15; // 15 min
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 días

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  salt: string;
}

const auth = new Hono<AppEnv>();

// Firma el access token (corto, va en el body) — sub + email.
function signAccess(env: Env, user: { id: number; email: string }) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: user.id, email: user.email, exp: now + ACCESS_TTL }, env.JWT_SECRET);
}

// Firma el refresh token (largo, va en cookie httpOnly) — solo sub + marca de tipo.
function signRefresh(env: Env, userId: number) {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: userId, type: 'refresh', exp: now + REFRESH_TTL }, env.JWT_SECRET);
}

function setRefreshCookie(c: Context<AppEnv>, token: string) {
  setCookie(c, 'refresh_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: REFRESH_TTL,
  });
}

// POST /api/auth/login
auth.post('/login', async c => {
  const raw = await c.req.json().catch(() => ({}));
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.issues }, 400);
  }

  const { email, password } = parsed.data;
  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash, salt FROM users WHERE email = ?'
  )
    .bind(email)
    .first<UserRow>();

  // Mismo error genérico para "no existe" y "password mala" (no filtrar qué emails existen).
  if (!user) return c.json({ error: 'invalid_credentials' }, 401);
  const ok = await verifyPassword(password, user.salt, user.password_hash);
  if (!ok) return c.json({ error: 'invalid_credentials' }, 401);

  const accessToken = await signAccess(c.env, user);
  setRefreshCookie(c, await signRefresh(c.env, user.id));

  return c.json({ accessToken, user: { id: user.id, email: user.email } }, 200);
});

// POST /api/auth/refresh — usa la cookie httpOnly para emitir un access token nuevo.
auth.post('/refresh', async c => {
  const token = getCookie(c, 'refresh_token');
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  let payload;
  try {
    payload = await verify(token, c.env.JWT_SECRET, 'HS256');
  } catch {
    return c.json({ error: 'unauthorized' }, 401);
  }
  if (payload.type !== 'refresh') return c.json({ error: 'unauthorized' }, 401);

  const user = await c.env.DB.prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(Number(payload.sub))
    .first<{ id: number; email: string }>();
  if (!user) return c.json({ error: 'unauthorized' }, 401);

  const accessToken = await signAccess(c.env, user);
  return c.json({ accessToken, user }, 200);
});

// POST /api/auth/logout — borra la cookie de refresh.
auth.post('/logout', c => {
  deleteCookie(c, 'refresh_token', { path: '/' });
  return c.body(null, 204);
});

// GET /api/auth/me — protegido; devuelve el usuario actual.
auth.get('/me', authMiddleware, c => {
  const user = c.get('user');
  return c.json({ id: user.sub, email: user.email });
});

export default auth;
