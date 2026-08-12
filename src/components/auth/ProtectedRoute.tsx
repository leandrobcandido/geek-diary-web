import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
}