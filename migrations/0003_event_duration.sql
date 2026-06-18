-- Tiempo en página (cookieless): cada pageview lleva un event_id efímero
-- generado en el navegador (no se guarda en el dispositivo, no identifica al
-- visitante entre páginas/sesiones). Al abandonar la página, el tracker envía
-- la duración y el servidor casa el registro por ese event_id.
ALTER TABLE events ADD COLUMN duration INTEGER;
ALTER TABLE events ADD COLUMN event_id TEXT;

-- Para casar rápido el ping de duración con su pageview.
CREATE INDEX idx_events_event_id ON events(event_id);
