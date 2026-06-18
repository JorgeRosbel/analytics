import { Hono } from 'hono';
import type { AppEnv } from './types';
import auth from './routes/auth';
import sites from './routes/sites';
import collect from './routes/collect';
import stats from './routes/stats';

// Todas las rutas viven bajo /api porque wrangler.jsonc enruta /api/* al Worker.
// strict: false hace que /api y /api/ matcheen la misma ruta.
const app = new Hono<AppEnv>({ strict: false }).basePath('/api');

// Momento en que arrancó el Worker, para calcular el uptime.
const bootedAt = Date.now();

// Healthcheck.
app.get('/health', c =>
  c.json({
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - bootedAt) / 1000),
    timestamp: new Date().toISOString(),
  })
);

// Sub-routers.
app.route('/auth', auth); // /api/auth/login | /refresh | /logout | /me
app.route('/sites', sites); // /api/sites  (CRUD protegido)
app.route('/collect', collect); // /api/collect (ingesta pública)
app.route('/stats', stats); // /api/stats | /stats/realtime

// Script de tracking que los clientes incrustan en sus webs.
// Cookieless: solo envía un beacon con domain/path/referrer. Deriva la URL de la
// API de su propio <script src>, para que funcione cargado en dominios externos.
// Soporta SPAs: se engancha a la History API (pushState/replaceState/popstate)
// para registrar también las navegaciones de cliente, no solo el reload completo.
// Un único beacon por pageview (sin pings de duración) para no multiplicar requests.
const TRACKER = `(function(){try{
  var s=document.currentScript;if(!s)return;
  var api=new URL(s.src).origin;
  var domain=(s.dataset&&s.dataset.site)||location.hostname;
  var last=null;
  function send(){
    var path=location.pathname;
    if(path===last)return; // evita duplicados consecutivos en la misma ruta
    last=path;
    var body=JSON.stringify({domain:domain,path:path,referrer:document.referrer});
    if(navigator.sendBeacon){navigator.sendBeacon(api+'/api/collect',body);}
    else{fetch(api+'/api/collect',{method:'POST',body:body,keepalive:true});}
  }
  var hp=history.pushState;
  history.pushState=function(){hp.apply(this,arguments);send();};
  var hr=history.replaceState;
  history.replaceState=function(){hr.apply(this,arguments);send();};
  addEventListener('popstate',send);
  send(); // pageview inicial
}catch(e){}})();`;

app.get('/script.js', c => {
  c.header('Content-Type', 'text/javascript; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(TRACKER);
});

export default app;
