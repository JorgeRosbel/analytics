import { Hono } from 'hono';

// Todas las rutas viven bajo /api porque wrangler.jsonc enruta /api/* al Worker.
// strict: false hace que /api y /api/ matcheen la misma ruta.
const app = new Hono({ strict: false }).basePath('/api');

// Momento en que arrancó el Worker, para calcular el uptime.
const bootedAt = Date.now();

// Único endpoint: comprobar que el Worker responde.
app.get('/health', c =>
  c.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
    timestamp: new Date().toISOString(),
  })
);

export default app;
