import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/stores/auth';

// Gatea las rutas privadas: espera al "login silencioso" y, si no hay sesión,
// redirige a /login.
export function ProtectedRoute() {
  const ready = useAuth(s => s.ready);
  const token = useAuth(s => s.accessToken);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return <Outlet />;
}
