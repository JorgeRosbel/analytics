import { Route, Navigate } from 'react-router-dom';
import { RouterProvider } from '@/providers/router-provider';
import { useInitAuth } from '@/hooks/useInitAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { SitesPage } from '@/features/sites/SitesPage';
import { SiteDashboard } from '@/features/stats/SiteDashboard';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';

const App: React.FC = () => {
  // Login silencioso al arrancar (usa la cookie httpOnly del refresh token).
  useInitAuth();

  return (
    <RouterProvider>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Privadas: requieren sesión + layout con nav/logout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/sites" replace />} />
          <Route path="/sites" element={<SitesPage />} />
          <Route path="/sites/:id" element={<SiteDashboard />} />
        </Route>
      </Route>
    </RouterProvider>
  );
};

export default App;
