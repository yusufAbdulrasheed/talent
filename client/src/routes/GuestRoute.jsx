import { Navigate, Outlet } from 'react-router-dom';
import FullPageLoader from '../components/feedback/FullPageLoader/FullPageLoader.jsx';
import { useAuth } from '../auth/useAuth.js';
import { getRoleHomePath } from '../auth/roles.js';

/**
 * Inverse of ProtectedRoute: keeps signed-in users off the login and
 * registration screens by bouncing them to their portal.
 */
function GuestRoute() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <FullPageLoader label="Checking your session" />;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
