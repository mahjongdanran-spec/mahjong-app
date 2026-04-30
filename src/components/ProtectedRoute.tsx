import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  requireStaff?: boolean;
}

const ProtectedRoute = ({ children, requireStaff }: Props) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireStaff && profile?.role !== 'admin' && profile?.role !== 'staff') {
    return (
      <div className="main-container">
        <div className="card text-center" style={{ padding: '2rem', marginTop: '2rem' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</p>
          <p style={{ fontWeight: 700 }}>アクセス権限がありません</p>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            管理者またはスタッフのみアクセスできます。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
