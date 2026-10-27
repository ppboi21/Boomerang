import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { BoomerangMark } from './ui/Logo';

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <BoomerangMark className="size-14 animate-spin text-zap-fg [animation-duration:1.2s]" />
    </div>
  );
}

// Signed in (and email-verified, if the server requires verification).
export function RequireVerified({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.needsVerification) return <Navigate to="/verify-pending" replace />;
  return children ?? <Outlet />;
}

// Login / register: bounce away if already signed in.
export function GuestOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (user) return <Navigate to={user.needsVerification ? '/verify-pending' : location.state?.from || '/'} replace />;
  return <Outlet />;
}
