import { useState } from 'react';
import { RouterProvider } from '@/providers/router-provider';
import { Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ApiResult {
  path: string;
  status: number;
  ms: number;
  data: unknown;
}

// Único endpoint definido en server/index.ts (Hono).
const HEALTH_PATH = '/api/health';

// Definida fuera del componente: aquí las llamadas a fetch/performance son válidas.
async function callApi(path: string): Promise<ApiResult> {
  const start = performance.now();
  const res = await fetch(path);
  const ms = Math.round(performance.now() - start);
  const data = await res.json();
  return { path, status: res.status, ms, data };
}

function ProjectWelcome() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function request(path: string) {
    setPending(true);
    setError(null);
    try {
      setResult(await callApi(path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setResult(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(#e4e4e7 1px, transparent 1px), linear-gradient(90deg, #e4e4e7 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 w-full max-w-lg shadow-sm animate-fade-in">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
          API de Hono conectada
        </div>

        <h1 className="font-syne text-[28px] font-extrabold leading-[1.1] tracking-tight text-zinc-900 dark:text-white mb-2">
          API <span className="text-blue-600 dark:text-blue-400">Playground</span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          Lanza una petición al endpoint <code>/api/health</code> del Worker de Hono. Si ves datos,
          todo está funcionando.
        </p>

        {/* Botón GET /api/health */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => request(HEALTH_PATH)}
          >
            {pending ? 'Cargando…' : 'GET /api/health'}
          </Button>
        </div>

        {/* Panel de respuesta */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>respuesta</span>
            {result && (
              <span className="flex items-center gap-2">
                <span
                  className={
                    result.status >= 200 && result.status < 300
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  GET {result.status}
                </span>
                <span className="text-zinc-400">{result.ms}ms</span>
              </span>
            )}
          </div>
          <pre className="p-3 text-[12px] leading-relaxed font-mono text-zinc-700 dark:text-zinc-300 overflow-auto max-h-56 whitespace-pre-wrap">
            {error
              ? `⚠ ${error}`
              : result
                ? JSON.stringify(result.data, null, 2)
                : '// Lanza una petición para ver la respuesta aquí'}
          </pre>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="font-mono text-[11px] text-zinc-400">
            by <span className="text-blue-500 font-medium">@jorgedevreact</span>
          </span>
          <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <RouterProvider>
      <Route path="/" element={<ProjectWelcome />} />
    </RouterProvider>
  );
};
export default App;
