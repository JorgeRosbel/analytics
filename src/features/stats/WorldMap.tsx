import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import isoCountries from 'i18n-iso-countries';
import geoData from 'world-atlas/countries-110m.json';
import { countryName } from './country';

interface Geo {
  rsmKey: string;
  id: string;
}

interface Props {
  data: { country: string; views: number }[];
  onSelect: (alpha2: string) => void;
}

interface Hover {
  name: string;
  views: number;
  x: number;
  y: number;
}

// Mapa coroplético: colorea cada país por su número de pageviews.
// world-atlas usa códigos ISO numéricos como `id`; convertimos nuestro ISO-2
// (de Cloudflare) a numérico con i18n-iso-countries para casarlos.
export function WorldMap({ data, onSelect }: Props) {
  const [hover, setHover] = useState<Hover | null>(null);

  const max = Math.max(1, ...data.map(d => d.views));
  const byNumeric: Record<number, number> = {};
  for (const d of data) {
    const num = Number(isoCountries.alpha2ToNumeric(d.country));
    if (num) byNumeric[num] = d.views;
  }

  return (
    <div className="relative">
      <ComposableMap
        projectionConfig={{ scale: 145 }}
        width={800}
        height={380}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: Geo[] }) =>
            geographies.map(geo => {
              const v = byNumeric[Number(geo.id)] ?? 0;
              const opacity = v > 0 ? 0.3 + 0.7 * (v / max) : 1;
              const a2 = isoCountries.numericToAlpha2(String(geo.id)) ?? '';
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (a2) onSelect(a2);
                  }}
                  onMouseEnter={(e: React.MouseEvent) =>
                    setHover({
                      name: countryName(a2),
                      views: v,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseMove={(e: React.MouseEvent) =>
                    setHover(h => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
                  }
                  onMouseLeave={() => setHover(null)}
                  style={{
                    default: {
                      fill: v > 0 ? 'var(--primary)' : 'var(--muted)',
                      fillOpacity: opacity,
                      stroke: 'var(--background)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: 'var(--primary)',
                      fillOpacity: 0.9,
                      stroke: 'var(--background)',
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: 'pointer',
                    },
                    pressed: { fill: 'var(--primary)', fillOpacity: 1, outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip flotante con el nombre del país y sus visitas. */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <span className="font-medium text-popover-foreground">{hover.name}</span>
          <span className="ml-2 tabular-nums text-muted-foreground">
            {hover.views} {hover.views === 1 ? 'visita' : 'visitas'}
          </span>
        </div>
      )}
    </div>
  );
}
