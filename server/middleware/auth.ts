import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { AppEnv } from '../types';

// Protege rutas: exige un access token válido en el header Authorization: Bearer <token>.
// Si es válido, deja el usuario en c.get('user'); si no, corta con 401.
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const token = header.slice('Bearer '.length);

  let payload;
  try {
    payload = await verify(token, c.env.JWT_SECRET, 'HS256');
  } catch {
    // Firma inválida o token expirado.
    return c.json({ error: 'unauthorized' }, 401);
  }

  c.set('user', { sub: Number(payload.sub), email: String(payload.email) });
  await next();
});
