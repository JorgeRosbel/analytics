import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Loader2, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth, type AuthUser } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, accessToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      return data;
    },
    onSuccess: data => {
      setAuth(data.accessToken, data.user);
      navigate('/sites', { replace: true });
    },
  });

  // Si ya hay sesión, no mostramos el login.
  if (accessToken) return <Navigate to="/sites" replace />;

  const errorMessage =
    mutation.error instanceof AxiosError && mutation.error.response?.status === 400
      ? 'Revisa el email y que la contraseña tenga 8+ caracteres alfanuméricos.'
      : mutation.isError
        ? 'Email o contraseña incorrectos.'
        : null;

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="size-5 text-primary" />
            <span className="font-semibold">app-analytics</span>
          </div>
          <CardTitle>Inicia sesión</CardTitle>
          <CardDescription>Analítica web sin cookies · GDPR-friendly</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
