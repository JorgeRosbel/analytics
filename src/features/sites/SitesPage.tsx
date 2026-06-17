import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Plus, Trash2, Copy, Check, Globe, ArrowRight, Loader2 } from 'lucide-react';
import { useSites, useCreateSite, useDeleteSite, type Site } from './useSites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

// El origen del propio dashboard = host de la API que sirve /api/script.js.
const ORIGIN = window.location.origin;

function Snippet({ domain }: { domain: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<script defer src="${ORIGIN}/api/script.js" data-site="${domain}"></script>`;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
      <code className="flex-1 truncate font-mono text-[11px] text-muted-foreground">{code}</code>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const create = useCreateSite();

  const error =
    create.error instanceof AxiosError
      ? create.error.response?.status === 409
        ? 'Ese dominio ya está registrado.'
        : create.error.response?.status === 400
          ? 'Dominio inválido (ej. midominio.com).'
          : 'No se pudo crear.'
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Añadir sitio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo sitio</DialogTitle>
          <DialogDescription>Añade el dominio que quieres medir.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            create.mutate(
              { domain, name: name || undefined },
              {
                onSuccess: () => {
                  setOpen(false);
                  setDomain('');
                  setName('');
                },
              }
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="domain">Dominio</Label>
            <Input
              id="domain"
              placeholder="midominio.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input
              id="name"
              placeholder="Mi web"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SiteCard({ site }: { site: Site }) {
  const del = useDeleteSite();
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <span className="font-medium truncate">{site.domain}</span>
            </div>
            {site.name && <p className="text-sm text-muted-foreground truncate">{site.name}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm(`¿Eliminar ${site.domain} y todos sus datos?`)) del.mutate(site.id);
            }}
            disabled={del.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <Snippet domain={site.domain} />

        <Link
          to={`/sites/${site.id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver analítica
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function SitesPage() {
  const { data: sites, isLoading } = useSites();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tus sitios</h1>
          <p className="text-sm text-muted-foreground">Gestiona los dominios que mides.</p>
        </div>
        <AddSiteDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : sites && sites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map(site => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="size-8 mx-auto mb-3 opacity-50" />
            <p>Aún no tienes sitios. Añade tu primer dominio para empezar a medir.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
