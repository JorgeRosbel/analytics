import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, Activity, Eye, X } from 'lucide-react';
import { useStats, useRealtime, type StatsFilters } from './useStats';
import { flagEmoji } from './flag';
import { WorldMap } from './WorldMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DAY = 86_400_000;
const PRESETS = [
  { label: '24h', ms: DAY },
  { label: '7d', ms: 7 * DAY },
  { label: '30d', ms: 30 * DAY },
  { label: '90d', ms: 90 * DAY },
];

const toDateInput = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const fromDateInput = (s: string) => new Date(`${s}T00:00:00Z`).getTime();

// Date.now() vive aquí (módulo) y no en el render: el React Compiler marca las
// llamadas impuras dentro del cuerpo del componente.
const presetRange = (ms: number) => {
  const to = Date.now();
  return { from: to - ms, to };
};

function formatBucket(b: string, granularity: 'hour' | 'day') {
  return granularity === 'hour' ? b.slice(11, 16) : b.slice(5); // HH:MM o MM-DD
}

// Fila con barra de proporción; clic = aplica filtro de drill-down.
function BarRow({
  label,
  views,
  max,
  onClick,
}: {
  label: React.ReactNode;
  views: number;
  max: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex w-full items-center justify-between overflow-hidden rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-md bg-primary/10"
        style={{ width: `${Math.max(4, (views / max) * 100)}%` }}
      />
      <span className="relative z-10 truncate pr-2">{label}</span>
      <span className="relative z-10 tabular-nums text-muted-foreground">{views}</span>
    </button>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5">{children}</CardContent>
    </Card>
  );
}

export function SiteDashboard() {
  const { id } = useParams();
  const siteId = Number(id);

  const [range, setRange] = useState(() => {
    const to = Date.now();
    return { from: to - 7 * DAY, to };
  });
  const [filters, setFilters] = useState<StatsFilters>({});

  const { data, isLoading } = useStats(siteId, range.from, range.to, filters);
  const realtime = useRealtime(siteId);

  const activePreset = PRESETS.find(p => Math.abs(range.to - range.from - p.ms) < 1000)?.label;
  const setPreset = (ms: number) => setRange(presetRange(ms));

  const filterChips = (Object.entries(filters) as [keyof StatsFilters, string][])
    .filter(([, v]) => v)
    .map(([k, v]) => ({ k, v }));

  const maxPath = Math.max(1, ...(data?.topPaths.map(p => p.views) ?? [1]));
  const maxRef = Math.max(1, ...(data?.topReferrers.map(p => p.views) ?? [1]));
  const maxCountry = Math.max(1, ...(data?.topCountries.map(p => p.views) ?? [1]));

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/sites"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Sitios
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{data?.domain ?? '…'}</h1>
        </div>

        {/* Rango de fechas: presets + personalizado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setPreset(p.ms)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:text-foreground',
                  activePreset === p.label && 'bg-muted text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Input
            type="date"
            className="w-auto"
            value={toDateInput(range.from)}
            onChange={e => setRange(r => ({ ...r, from: fromDateInput(e.target.value) }))}
          />
          <Input
            type="date"
            className="w-auto"
            value={toDateInput(range.to)}
            onChange={e => setRange(r => ({ ...r, to: fromDateInput(e.target.value) + DAY - 1 }))}
          />
        </div>
      </div>

      {/* Chips de filtros activos */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          {filterChips.map(({ k, v }) => (
            <Badge key={k} variant="secondary" className="gap-1">
              {k}: {v}
              <button onClick={() => setFilters(f => ({ ...f, [k]: undefined }))}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tarjetas superiores: en vivo + total */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                En vivo (últimos 5 min)
              </div>
              <div className="mt-1 text-3xl font-bold tabular-nums">
                {realtime.data?.active ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">pageviews recientes</p>
            </div>
            <div className="h-14 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtime.data?.perMinute ?? []}>
                  <Area
                    dataKey="views"
                    stroke="#16a34a"
                    fill="#16a34a"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="size-4" />
              Pageviews (rango)
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-24" /> : (data?.totalViews ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(range.from).toLocaleDateString()} –{' '}
              {new Date(range.to).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica temporal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <Activity className="mr-1 inline size-4" />
            Visitas en el tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data?.timeseries ?? []}>
                <defs>
                  <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={b => formatBucket(b, data?.granularity ?? 'day')}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  labelFormatter={b => formatBucket(String(b), data?.granularity ?? 'day')}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area dataKey="views" stroke="#2563eb" strokeWidth={2} fill="url(#views)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top rutas / referrers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Páginas más visitadas">
          {data?.topPaths.length ? (
            data.topPaths.map(p => (
              <BarRow
                key={p.path}
                label={<span className="font-mono">{p.path}</span>}
                views={p.views}
                max={maxPath}
                onClick={() => setFilters(f => ({ ...f, path: p.path }))}
              />
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-muted-foreground">Sin datos.</p>
          )}
        </Panel>

        <Panel title="Referrers">
          {data?.topReferrers.length ? (
            data.topReferrers.map(r => (
              <BarRow
                key={r.referrer}
                label={r.referrer}
                views={r.views}
                max={maxRef}
                onClick={() => setFilters(f => ({ ...f, referrer: r.referrer }))}
              />
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-muted-foreground">Sin datos (tráfico directo).</p>
          )}
        </Panel>
      </div>

      {/* Países: mapa + lista con banderas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Países</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-lg border bg-muted/20 p-2">
            <WorldMap
              data={data?.topCountries ?? []}
              onSelect={a2 => setFilters(f => ({ ...f, country: a2 }))}
            />
          </div>
          <div className="space-y-0.5">
            {data?.topCountries.length ? (
              data.topCountries.map(c => (
                <BarRow
                  key={c.country}
                  label={
                    <span className="flex items-center gap-2">
                      <span>{flagEmoji(c.country)}</span>
                      {c.country}
                    </span>
                  }
                  views={c.views}
                  max={maxCountry}
                  onClick={() => setFilters(f => ({ ...f, country: c.country }))}
                />
              ))
            ) : (
              <p className="px-2 py-4 text-sm text-muted-foreground">Sin datos.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
