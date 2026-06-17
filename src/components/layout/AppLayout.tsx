import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { BarChart3, LogOut, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const navigate = useNavigate();
  const { user, clear } = useAuth();

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clear();
      navigate('/login', { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link to="/sites" className="flex items-center gap-2 font-semibold">
              <BarChart3 className="size-5 text-primary" />
              app-analytics
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink
                to="/sites"
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted',
                    isActive && 'bg-muted text-foreground'
                  )
                }
              >
                Sitios
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1 font-normal">
              <ShieldCheck className="size-3" />
              Sin cookies · GDPR
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
        <Link to="/privacy" className="hover:underline">
          Política de privacidad
        </Link>
      </footer>
    </div>
  );
}
