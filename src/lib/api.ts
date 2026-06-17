import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuth, type AuthUser } from '@/stores/auth';

// Cliente principal: baseURL '/api' (mismo origen que la SPA en el Worker).
export const api = axios.create({ baseURL: '/api' });

// Cada petición lleva el access token (si lo hay) en Authorization: Bearer.
api.interceptors.request.use(config => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

// Se hace con axios "crudo" (sin interceptores) para no entrar en bucle de refresh.
let refreshing: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<RefreshResponse>('/api/auth/refresh');
    useAuth.getState().setAuth(data.accessToken, data.user);
    return data.accessToken;
  } catch {
    useAuth.getState().clear();
    return null;
  }
}

// En un 401, intenta refrescar el token UNA vez y reintenta la petición original.
api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.includes('/auth/'); // login/refresh no se reintentan

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
