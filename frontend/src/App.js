import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './Toast';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppShell from './pages/AppShell';
import Browse from './pages/Browse';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

function CRT() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
    </>
  );
}

function Guard({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="landing-page"><CRT /><div className="font-mono" style={{ color: 'var(--amber)' }}>Booting CareerOS…</div></div>;
  if (!user) return <Navigate to="/auth" state={{ from: loc }} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app/browse" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CRT />
          <Routes>
            <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
            <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
            <Route path="/app" element={<Guard><AppShell /></Guard>}>
              <Route index element={<Navigate to="browse" replace />} />
              <Route path="browse" element={<Browse />} />
              <Route path="saved" element={<Saved />} />
              <Route path="profile" element={<Profile />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
