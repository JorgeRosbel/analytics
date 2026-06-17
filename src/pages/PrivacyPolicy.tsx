import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Cookie, MapPin, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const POINTS = [
  {
    icon: Cookie,
    title: 'Sin cookies',
    body: 'No usamos cookies ni almacenamos nada en el dispositivo del visitante. Por eso este servicio no necesita un banner de consentimiento.',
  },
  {
    icon: EyeOff,
    title: 'Sin datos personales',
    body: 'No guardamos direcciones IP, ni identificadores, ni huellas del navegador. No se puede rastrear a un visitante entre páginas ni entre visitas.',
  },
  {
    icon: MapPin,
    title: 'Solo datos agregados',
    body: 'Por cada visita registramos únicamente: la ruta visitada, el referrer (solo el dominio) y el país (agregado, vía Cloudflare). Nada de esto identifica a una persona.',
  },
];

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Privacidad y GDPR</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Analítica web respetuosa con la privacidad. Medimos webs sin espiar a sus visitantes.
        </p>

        <div className="mt-8 space-y-4">
          {POINTS.map(p => (
            <Card key={p.title}>
              <CardContent className="flex gap-4">
                <p.icon className="size-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-semibold">{p.title}</h2>
                  <p className="text-sm text-muted-foreground">{p.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Como no se tratan datos personales ni se accede al dispositivo del usuario, el uso de este
          script no requiere consentimiento previo bajo el RGPD ni la directiva ePrivacy.
        </p>
      </div>
    </div>
  );
}
