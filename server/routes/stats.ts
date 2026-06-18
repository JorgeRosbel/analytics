import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { authMiddleware } from '../middleware/auth';

const stats = new Hono<AppEnv>();
stats.use('*', authMiddleware);

// Verifica que el site pertenezca al usuario logueado. Devuelve el site o null.
async function ownedSite(c: Context<AppEnv>, siteId: number) {
  return c.env.DB.prepare('SELECT id, domain FROM sites WHERE id = ? AND user_id = ?')
    .bind(siteId, c.get('user').sub)
    .first<{ id: number; domain: string }>();
}

const DAY = 86_400_000;

// GET /api/stats?siteId=&from=&to=&country=&path=&referrer=
stats.get('/', async c => {
  const siteId = Number(c.req.query('siteId'));
  if (!Number.isInteger(siteId)) return c.json({ error: 'invalid_site' }, 400);

  const site = await ownedSite(c, siteId);
  if (!site) return c.json({ error: 'forbidden' }, 403);

  const now = Date.now();
  const to = Number(c.req.query('to')) || now;
  const from = Number(c.req.query('from')) || to - 7 * DAY;

  // Filtros de drill-down opcionales (clic en país/ruta/referrer en el dashboard).
  const country = c.req.query('country');
  const path = c.req.query('path');
  const referrer = c.req.query('referrer');

  // WHERE dinámico con binds posicionales (seguro, sin concatenar valores).
  const conds = ['site_id = ?', 'ts >= ?', 'ts <= ?'];
  const binds: (string | number)[] = [siteId, from, to];
  if (country) {
    conds.push('country = ?');
    binds.push(country);
  }
  if (path) {
    conds.push('path = ?');
    binds.push(path);
  }
  if (referrer) {
    conds.push('referrer = ?');
    binds.push(referrer);
  }
  const where = conds.join(' AND ');

  // Bucket por hora si el rango es corto (<48h), por día si es largo.
  const hourly = to - from <= 2 * DAY;
  const bucket = hourly
    ? "strftime('%Y-%m-%dT%H:00:00Z', ts / 1000, 'unixepoch')"
    : "date(ts / 1000, 'unixepoch')";

  const totalRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM events WHERE ${where}`)
    .bind(...binds)
    .first<{ total: number }>();

  const timeseries = await c.env.DB.prepare(
    `SELECT ${bucket} AS bucket, COUNT(*) AS views FROM events WHERE ${where} GROUP BY bucket ORDER BY bucket`
  )
    .bind(...binds)
    .all<{ bucket: string; views: number }>();

  const topPaths = await c.env.DB.prepare(
    `SELECT path, COUNT(*) AS views FROM events WHERE ${where} GROUP BY path ORDER BY views DESC LIMIT 10`
  )
    .bind(...binds)
    .all<{ path: string; views: number }>();

  // Incluye el tráfico directo (referrer vacío/NULL): el front lo etiqueta "Directo".
  const topReferrers = await c.env.DB.prepare(
    `SELECT COALESCE(referrer, '') AS referrer, COUNT(*) AS views FROM events WHERE ${where} GROUP BY COALESCE(referrer, '') ORDER BY views DESC LIMIT 10`
  )
    .bind(...binds)
    .all<{ referrer: string; views: number }>();

  const topCountries = await c.env.DB.prepare(
    `SELECT country, COUNT(*) AS views FROM events WHERE ${where} AND country IS NOT NULL GROUP BY country ORDER BY views DESC LIMIT 100`
  )
    .bind(...binds)
    .all<{ country: string; views: number }>();

  return c.json({
    siteId,
    domain: site.domain,
    from,
    to,
    granularity: hourly ? 'hour' : 'day',
    totalViews: totalRow?.total ?? 0,
    timeseries: timeseries.results,
    topPaths: topPaths.results,
    topReferrers: topReferrers.results,
    topCountries: topCountries.results,
  });
});

// GET /api/stats/realtime?siteId= — "en vivo": pageviews de los últimos 5 min.
stats.get('/realtime', async c => {
  const siteId = Number(c.req.query('siteId'));
  if (!Number.isInteger(siteId)) return c.json({ error: 'invalid_site' }, 400);

  const site = await ownedSite(c, siteId);
  if (!site) return c.json({ error: 'forbidden' }, 403);

  const now = Date.now();
  const since5 = now - 5 * 60_000;
  const since30 = now - 30 * 60_000;

  const activeRow = await c.env.DB.prepare(
    'SELECT COUNT(*) AS active FROM events WHERE site_id = ? AND ts >= ?'
  )
    .bind(siteId, since5)
    .first<{ active: number }>();

  const perMinute = await c.env.DB.prepare(
    `SELECT strftime('%Y-%m-%dT%H:%M:00Z', ts / 1000, 'unixepoch') AS bucket, COUNT(*) AS views
     FROM events WHERE site_id = ? AND ts >= ? GROUP BY bucket ORDER BY bucket`
  )
    .bind(siteId, since30)
    .all<{ bucket: string; views: number }>();

  return c.json({ active: activeRow?.active ?? 0, perMinute: perMinute.results });
});

export default stats;
