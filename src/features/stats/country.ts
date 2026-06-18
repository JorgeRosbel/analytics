import isoCountries from 'i18n-iso-countries';
import esLocale from 'i18n-iso-countries/langs/es.json';

// Registramos español una sola vez (singleton del paquete) para traducir
// los códigos ISO-2 que manda Cloudflare a nombres legibles.
isoCountries.registerLocale(esLocale);

// "ES" → "España". Si no se reconoce, devuelve el propio código.
export function countryName(code: string | null | undefined): string {
  if (!code) return 'Desconocido';
  return isoCountries.getName(code.toUpperCase(), 'es') ?? code.toUpperCase();
}
