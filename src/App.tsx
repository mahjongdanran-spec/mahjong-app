import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Store, ClipboardList, Settings, Trophy, History, Users, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import Ranking from './pages/Ranking';
import MatchHistory from './pages/MatchHistory';
import AdminMembers from './pages/AdminMembers';
import AdminMatches from './pages/AdminMatches';
import AdminPoints from './pages/AdminPoints';
import LoginPage from './pages/LoginPage';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

const AppRoutes = () => {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#8E8E93', fontWeight: 600 }}>読み込み中...</p>
      </div>
    );
  }

  const isStaff = profile?.role === 'admin' || profile?.role === 'staff';

  return (
    <>
      {user && (
        <div className="app-header">
          <h1>
            <img src="/DANRAN_2048.png" alt="麻雀DANRAN" className="header-logo-img" />
            麻雀DANRAN
          </h1>
          <div className="flex gap-2">
            {isStaff && (
              <Link
                to="/admin"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
              >
                店舗管理
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              title="ログアウト"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}

      <div className={user ? 'main-container' : ''}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UserLayout><UserDashboard /></UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute>
                <UserLayout><Ranking /></UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <UserLayout><MatchHistory /></UserLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireStaff>
                <AdminLayout><AdminMembers /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <ProtectedRoute requireStaff>
                <AdminLayout><AdminMatches /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/points"
            element={
              <ProtectedRoute requireStaff>
                <AdminLayout><AdminPoints /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div>
      {children}
      <div className="bottom-nav">
        <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
          <Home size={22} strokeWidth={path === '/' ? 2.5 : 2} />
          <span>成績</span>
        </Link>
        <Link to="/ranking" className={`nav-item ${path === '/ranking' ? 'active' : ''}`}>
          <Trophy size={22} strokeWidth={path === '/ranking' ? 2.5 : 2} />
          <span>順位</span>
        </Link>
        <Link to="/history" className={`nav-item ${path === '/history' ? 'active' : ''}`}>
          <History size={22} strokeWidth={path === '/history' ? 2.5 : 2} />
          <span>履歴</span>
        </Link>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div>
      <div className="admin-nav">
        <Link to="/admin" className={`admin-tab ${path === '/admin' ? 'active' : ''}`}>
          <Users size={16} /> 会員管理
        </Link>
        <Link to="/admin/matches" className={`admin-tab ${path === '/admin/matches' ? 'active' : ''}`}>
          <ClipboardList size={16} /> 対戦入力
        </Link>
        <Link to="/admin/points" className={`admin-tab ${path === '/admin/points' ? 'active' : ''}`}>
          <Settings size={16} /> ポイント更新
        </Link>
      </div>
      {children}
      <div className="bottom-nav">
        <Link to="/" className="nav-item">
          <Home size={22} />
          <span>ホーム</span>
        </Link>
        <Link to="/admin" className="nav-item active">
          <Store size={22} strokeWidth={2.5} />
          <span>店舗管理</span>
        </Link>
      </div>
    </div>
  );
};

export default App;
