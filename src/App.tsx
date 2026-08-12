import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import MediaListContainer from '@/pages/MediaListContainer';
import MediaDetailPage from '@/pages/MediaDetailPage';
import MediaSearchPage from '@/pages/MediaSearchPage';
import MediaAddPage from '@/pages/MediaAddPage';
import SettingsPage from '@/pages/SettingsPage';
import RegisterPage from '@/pages/RegisterPage';
import RecoveryPage from '@/pages/RecoveryPage';

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-bg text-app-text">
        <div className="w-10 h-10 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-dvh bg-app-bg text-app-text transition-colors duration-300">
          <Routes>          
            {/* Rota pública (se logado, manda pra Home) */}
            <Route 
              path="/login" 
              element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} 
            />

            {/* Rotas Privadas protegidas pelo componente wrapper */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/list/:mediaType/:year" element={<ProtectedRoute><MediaListContainer /></ProtectedRoute>} />
            <Route path="/detail/:mediaType/:id" element={<ProtectedRoute><MediaDetailPage /></ProtectedRoute>} />
            <Route path="/search/:mediaType/:year" element={<ProtectedRoute><MediaSearchPage /></ProtectedRoute>} />
            <Route path="/add/:mediaType/:year/:id" element={<ProtectedRoute><MediaAddPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/recovery" element={currentUser ? <Navigate to="/" replace /> : <RecoveryPage />} />

            {/* Fallback para rotas inexistentes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}