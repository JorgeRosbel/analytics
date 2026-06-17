import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from '../types';

const collect = new Hono<AppEnv>();

// Quita "www." y pasa a minúsculas para comparar dominios de forma uniforme.
function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

// CORS solo en /collect: refleja el Origin únicamente si su hostname está
// registrado como un sitio. (Para sendBeacon con text/plain no hay preflight,
// pero esto cubre el fallback con fetch.)
collect.use(
  '*',
  cors({
    origin: async (origin, c) => {
      if (!origin) return null;
      let host: string;
      try {
        host = normalizeHost(new URL(origin).hostname);
      } catch {
        return null;
      }
      const row = await c.env.DB.prepare('SELECT 1 FROM sites WHERE domain = ?').bind(host).first();
      return row ? origin : null;
    },
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

interface CollectBody {
  domain?: string;
  path?: string;
  referrer?: string;
}

// POST /api/collect — ingesta pública, sin cookies, sin identificadores.
collect.post('/', async c => {
  // Se lee como texto para soportar navigator.sendBeacon (text/plain) y fetch(JSON).
  const raw = await c.req.text();
  let body: CollectBody;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return c.body(null, 204);
  }

  const domain = body.domain ? normalizeHost(body.domain) : '';
  if (!domain) return c.body(null, 204);

  const site = await c.env.DB.prepare('SELECT id FROM sites WHERE domain = ?')
    .bind(domain)
    .first<{ id: number }>();
  if (!site) return c.body(null, 204); // dominio no registrado: ignorar en silencio

  // Anti-spam: si viene Origin, su hostname debe coincidir con el domain declarado.
  const origin = c.req.header('Origin');
  if (origin) {
    try {
      if (normalizeHost(new URL(origin).hostname) !== domain) return c.body(null, 204);
    } catch {
      return c.body(null, 204);
    }
  }

  const path = (typeof body.path === 'string' ? body.path : '/').slice(0, 512);

  // referrer reducido a hostname (no guardamos query strings ni nada con PII).
  let referrer = '';
  if (typeof body.referrer === 'string' && body.referrer) {
    try {
      referrer = new URL(body.referrer).hostname;
    } catch {
      referrer = '';
    }
  }

  // país agregado que añade Cloudflare a la request (no es PII identificable).
  const country = (c.req.raw as { cf?: { country?: string } }).cf?.country ?? null;

  await c.env.DB.prepare(
    'INSERT INTO events (site_id, path, referrer, country, ts) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(site.id, path, referrer, country, Date.now())
    .run();

  // 204 fire-and-forget: el visitante no necesita respuesta.
  return c.body(null, 204);
});

export default collect;
