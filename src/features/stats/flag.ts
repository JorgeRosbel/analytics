// Código ISO-3166-1 alpha-2 (p.ej. "ES") → emoji de bandera.
// Cada letra se mapea a su "regional indicator symbol" (A = U+1F1E6).
export function flagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '🌐';
  const A = 0x1f1e6;
  const cc = code.toUpperCase();
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}
