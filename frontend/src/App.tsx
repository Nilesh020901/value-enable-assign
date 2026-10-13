import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api, User, IllustrationData } from './services/api';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PolicyCalculation } from './pages/PolicyCalculation';
import { IllustrationPage } from './pages/IllustrationPage';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIllustration, setActiveIllustration] = useState<IllustrationData | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveIllustration(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100 animate-pulse">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <p className="text-sm font-medium">Initializing ValuEnable Security Session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/policy" replace /> : <Login onLoginSuccess={setUser} />}
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/policy" replace /> : <Register onRegisterSuccess={setUser} />
          }
        />

        {/* Protected Routes wrapped in Sidebar Layout */}
        <Route
          path="/policy"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <PolicyCalculation user={user} onIllustrationGenerated={setActiveIllustration} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/illustration"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <IllustrationPage
                  illustration={activeIllustration}
                  onSetIllustration={setActiveIllustration}
                />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/policy' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
