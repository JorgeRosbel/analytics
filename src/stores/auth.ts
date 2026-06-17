import { create } from 'zustand';

export interface AuthUser {
  id: number;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  // ready = ya intentamos el "login silencioso" inicial (refresh). Hasta entonces
  // no sabemos si hay sesión, así que el router muestra un loader.
  ready: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clear: () => void;
  setReady: (ready: boolean) => void;
}

// El token vive solo en memoria (no localStorage) → menos superficie a XSS.
// La sesión se restaura al recargar vía la cookie httpOnly del refresh token.
export const useAuth = create<AuthState>(set => ({
  accessToken: null,
  user: null,
  ready: false,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
  setReady: ready => set({ ready }),
}));
