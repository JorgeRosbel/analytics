import { Hono } from 'hono';

// Todas las rutas viven bajo /api porque wrangler.jsonc enruta /api/* al Worker.
// strict: false hace que /api y /api/ matcheen la misma ruta.
const app = new Hono({ strict: false }).basePath('/api');

app.get('/', c => c.json({ name: 'app-analytics', ok: true }));

// Momento en que arrancó el Worker, para calcular el uptime.
const bootedAt = Date.now();

// --- Endpoints fake para verificar la conexión cliente <-> API ---

app.get('/health', c =>
  c.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
    timestamp: new Date().toISOString(),
  })
);

app.get('/stats', c =>
  c.json({
    users: 1284,
    activeSessions: 37,
    pageViews: 98213,
    bounceRate: 0.42,
  })
);

app.get('/users', c =>
  c.json({
    users: [
      { id: 1, name: 'Ada Lovelace', role: 'admin' },
      { id: 2, name: 'Alan Turing', role: 'editor' },
      { id: 3, name: 'Grace Hopper', role: 'viewer' },
    ],
  })
);

// Form: recibe un mensaje y lo "procesa" devolviéndolo.
app.post('/echo', async c => {
  const body = await c.req.json<{ message?: string }>().catch(() => ({}) as { message?: string });
  return c.json({
    received: body.message ?? '',
    length: (body.message ?? '').length,
    at: new Date().toISOString(),
  });
});

export default app;
