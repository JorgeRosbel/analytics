import { cn } from '@/lib/utils';

// Bandera como imagen (flagcdn). A diferencia del emoji de "regional indicator",
// se renderiza igual en todos los sistemas (en Linux/desktop el emoji no sale).
export function Flag({ code, className }: { code?: string | null; className?: string }) {
  if (!code || code.length !== 2) {
    return <span className={cn('inline-block', className)}>🌐</span>;
  }
  const cc = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/${cc}.svg`}
      alt={code.toUpperCase()}
      width={20}
      height={15}
      loading="lazy"
      className={cn(
        'inline-block h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10',
        className
      )}
    />
  );
}
