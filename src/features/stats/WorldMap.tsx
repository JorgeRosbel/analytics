import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import isoCountries from 'i18n-iso-countries';
import geoData from 'world-atlas/countries-110m.json';

interface Geo {
  rsmKey: string;
  id: string;
}

interface Props {
  data: { country: string; views: number }[];
  onSelect: (alpha2: string) => void;
}

// Mapa coroplético: colorea cada país por su número de pageviews.
// world-atlas usa códigos ISO numéricos como `id`; convertimos nuestro ISO-2
// (de Cloudflare) a numérico con i18n-iso-countries para casarlos.
export function WorldMap({ data, onSelect }: Props) {
  const max = Math.max(1, ...data.map(d => d.views));
  const byNumeric: Record<number, number> = {};
  for (const d of data) {
    const num = Number(isoCountries.alpha2ToNumeric(d.country));
    if (num) byNumeric[num] = d.views;
  }

  return (
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
            const opacity = v > 0 ? 0.25 + 0.7 * (v / max) : 1;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => {
                  const a2 = isoCountries.numericToAlpha2(String(geo.id));
                  if (a2) onSelect(a2);
                }}
                style={{
                  default: {
                    fill: v > 0 ? `rgb(37 99 235 / ${opacity})` : 'var(--muted)',
                    stroke: 'var(--background)',
                    strokeWidth: 0.5,
                    outline: 'none',
                  },
                  hover: { fill: 'rgb(37 99 235 / 0.85)', outline: 'none', cursor: 'pointer' },
                  pressed: { fill: 'rgb(29 78 216)', outline: 'none' },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
