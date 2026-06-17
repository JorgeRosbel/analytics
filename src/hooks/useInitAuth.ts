import { useEffect } from 'react';
import axios from 'axios';
import { useAuth, type AuthUser } from '@/stores/auth';

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

// "Login silencioso" al cargar la app: intenta /auth/refresh usando la cookie
// httpOnly. Si hay sesión válida, restaura token+usuario; si no, deja deslogueado.
// En ambos casos marca ready=true para que el router pueda decidir a dónde ir.
export function useInitAuth() {
  const setAuth = useAuth(s => s.setAuth);
  const setReady = useAuth(s => s.setReady);

  useEffect(() => {
    axios
      .post<RefreshResponse>('/api/auth/refresh')
      .then(({ data }) => setAuth(data.accessToken, data.user))
      .catch(() => {
        /* sin sesión: normal */
      })
      .finally(() => setReady(true));
  }, [setAuth, setReady]);
}
