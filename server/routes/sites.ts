import { Hono } from 'hono';
import { SiteSchema, type AppEnv } from '../types';
import { authMiddleware } from '../middleware/auth';

const sites = new Hono<AppEnv>();

// Todo el router está protegido: solo el dueño gestiona sus dominios.
sites.use('*', authMiddleware);

interface SiteRow {
  id: number;
  domain: string;
  name: string | null;
  created_at: number;
}

// GET /api/sites — dominios del usuario.
sites.get('/', async c => {
  const userId = c.get('user').sub;
  const { results } = await c.env.DB.prepare(
    'SELECT id, domain, name, created_at FROM sites WHERE user_id = ? ORDER BY created_at DESC'
  )
    .bind(userId)
    .all<SiteRow>();
  return c.json({ sites: results });
});

// POST /api/sites — alta de dominio.
sites.post('/', async c => {
  const userId = c.get('user').sub;
  const raw = await c.req.json().catch(() => ({}));
  const parsed = SiteSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.issues }, 400);
  }

  const { domain, name } = parsed.data;
  try {
    const site = await c.env.DB.prepare(
      'INSERT INTO sites (user_id, domain, name) VALUES (?, ?, ?) RETURNING id, domain, name, created_at'
    )
      .bind(userId, domain, name ?? null)
      .first<SiteRow>();
    return c.json({ site }, 201);
  } catch {
    // El dominio es UNIQUE: si ya existe, D1 lanza y lo traducimos a 409.
    return c.json({ error: 'domain_taken' }, 409);
  }
});

// DELETE /api/sites/:id — baja (borra eventos + site), scoped al dueño.
sites.delete('/:id', async c => {
  const userId = c.get('user').sub;
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: 'invalid_id' }, 400);

  await c.env.DB.batch([
    // Solo borra eventos si el site es del usuario (subquery de guarda).
    c.env.DB.prepare(
      'DELETE FROM events WHERE site_id = ? AND site_id IN (SELECT id FROM sites WHERE user_id = ?)'
    ).bind(id, userId),
    c.env.DB.prepare('DELETE FROM sites WHERE id = ? AND user_id = ?').bind(id, userId),
  ]);

  return c.body(null, 204);
});

export default sites;
