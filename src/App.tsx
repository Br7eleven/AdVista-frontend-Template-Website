import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Earn from './pages/Earn';
import Withdraw from './pages/Withdraw';
import Referrals from './pages/Referrals';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './lib/supabase';

const ProtectedRoute = ({ session, isLoading }: { session: Session | null; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ session, isLoading }: { session: Session | null; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return session ? <Navigate to="/" replace /> : <Outlet />;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const bootstrapSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isActive) return;
        setSession(data.session);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'dark:bg-dark-600 dark:text-light',
        }}
      />
      <Routes>
        <Route element={<ProtectedRoute session={session} isLoading={isLoading} />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="earn" element={<Earn />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="account" element={<Account />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>

        <Route element={<PublicRoute session={session} isLoading={isLoading} />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;