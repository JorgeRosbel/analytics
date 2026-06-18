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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft, Activity, Eye, X, CornerDownRight, HelpCircle } from 'lucide-react';
import { useStats, useRealtime, type StatsFilters } from './useStats';
import { Flag } from './Flag';
import { countryName } from './country';
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

// Paleta de gráficos (alineada con las CSS vars del tema).
const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
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

const pct = (views: number, total: number) => (total > 0 ? Math.round((views / total) * 100) : 0);

// Fila con barra de proporción; clic = aplica filtro de drill-down.
function BarRow({
  label,
  views,
  max,
  percent,
  onClick,
}: {
  label: React.ReactNode;
  views: number;
  max: number;
  percent?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-md bg-primary/10 transition-all group-hover:bg-primary/15"
        style={{ width: `${Math.max(4, (views / max) * 100)}%` }}
      />
      <span className="relative z-10 flex-1 truncate text-left">{label}</span>
      <span className="relative z-10 tabular-nums font-medium">{views}</span>
      {percent != null && (
        <span className="relative z-10 w-9 text-right text-xs tabular-nums text-muted-foreground">
          {percent}%
        </span>
      )}
    </button>
  );
}

// Favicon del dominio del referrer (servicio de Google). Si falla, muestra "?".
function Favicon({ host }: { host: string }) {
  const [err, setErr] = useState(false);
  if (err) return <HelpCircle className="size-4 shrink-0 text-muted-foreground" />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=64&domain=${host}`}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      onError={() => setErr(true)}
      className="size-4 shrink-0 rounded-sm"
    />
  );
}

// Etiqueta de un referrer: favicon + dominio, o "Directo" si vino sin referrer.
function ReferrerLabel({ host }: { host: string }) {
  if (!host) {
    return (
      <span className="flex items-center gap-2">
        <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
        Directo
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Favicon host={host} />
      <span className="truncate">{host}</span>
    </span>
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

  const total = data?.totalViews ?? 0;
  const maxPath = Math.max(1, ...(data?.topPaths.map(p => p.views) ?? [1]));
  const maxRef = Math.max(1, ...(data?.topReferrers.map(p => p.views) ?? [1]));

  // Distribución por país para el donut: top 5 + "Otros".
  const countries = data?.topCountries ?? [];
  const countryTotal = countries.reduce((a, c) => a + c.views, 0);
  const topCountries = countries.slice(0, 5);
  const restViews = countries.slice(5).reduce((a, c) => a + c.views, 0);
  const pieData = [
    ...topCountries.map(c => ({ name: countryName(c.country), code: c.country, views: c.views })),
    ...(restViews > 0 ? [{ name: 'Otros', code: null, views: restViews }] : []),
  ];

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
                  'rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
                  activePreset === p.label &&
                    'bg-primary text-primary-foreground hover:text-primary-foreground'
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
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
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="size-4" />
              Pageviews
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {isLoading ? <Skeleton className="h-8 w-20" /> : total}
            </div>
            <p className="text-xs text-muted-foreground">en el rango</p>
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
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
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
                <Area dataKey="views" stroke="var(--chart-1)" strokeWidth={2} fill="url(#views)" />
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
                percent={pct(p.views, total)}
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
                key={r.referrer || 'direct'}
                label={<ReferrerLabel host={r.referrer} />}
                views={r.views}
                max={maxRef}
                percent={pct(r.views, total)}
                onClick={
                  r.referrer ? () => setFilters(f => ({ ...f, referrer: r.referrer })) : undefined
                }
              />
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-muted-foreground">Sin datos.</p>
          )}
        </Panel>
      </div>

      {/* Países: mapa + donut de distribución con banderas y % */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Países</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-lg border bg-muted/20 p-2">
            <WorldMap data={countries} onSelect={a2 => setFilters(f => ({ ...f, country: a2 }))} />
          </div>

          <div className="flex flex-col gap-3">
            {pieData.length ? (
              <>
                {/* Donut de distribución porcentual */}
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="views"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, i) => (
                          <Cell
                            key={entry.code ?? 'otros'}
                            fill={
                              entry.code
                                ? PIE_COLORS[i % PIE_COLORS.length]
                                : 'var(--muted-foreground)'
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={value => {
                          const v = Number(value);
                          return [`${v} (${pct(v, countryTotal)}%)`, 'visitas'];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda = lista de países: bandera + nombre + % (clic filtra) */}
                <div className="space-y-0.5">
                  {topCountries.map((c, i) => (
                    <button
                      key={c.country}
                      onClick={() => setFilters(f => ({ ...f, country: c.country }))}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted/60"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <Flag code={c.country} />
                      <span className="flex-1 truncate text-left">{countryName(c.country)}</span>
                      <span className="tabular-nums font-medium">{c.views}</span>
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                        {pct(c.views, countryTotal)}%
                      </span>
                    </button>
                  ))}
                  {restViews > 0 && (
                    <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground">
                      <span className="size-2.5 shrink-0 rounded-full bg-muted-foreground" />
                      <span className="flex-1 text-left">Otros</span>
                      <span className="tabular-nums">{restViews}</span>
                      <span className="w-9 text-right text-xs tabular-nums">
                        {pct(restViews, countryTotal)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="px-2 py-4 text-sm text-muted-foreground">Sin datos.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
