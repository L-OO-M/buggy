import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={26} className="text-brand-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={26} className="text-brand-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">This area is not available for your role</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          You are signed in as {user.role}. Switch to an authorized demo account to continue.
        </p>
        <a href="/dashboard" className="btn-primary mt-6">
          Go to dashboard
        </a>
      </div>
    );
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const destination = user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/dashboard';
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}
