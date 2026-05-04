import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--accent)', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
