import { Navigate, Outlet, useLocation } from 'react-router-dom';
import FullPageLoader from '../components/feedback/FullPageLoader/FullPageLoader.jsx';
import { useAuth } from '../auth/useAuth.js';
import { getRoleHomePath } from '../auth/roles.js';

/**
 * Gate for authenticated routes.
 *
 * @param {string[]} [allowedRoles] restricts the route to these roles;
 *   omit to allow any signed-in user.
 *
 * This is a convenience layer, not a security boundary — the API enforces
 * the same rules server-side.
 */
function ProtectedRoute({ allowedRoles }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader label="Checking your session" />;
  }

  if (!isAuthenticated) {
    // `from` lets the login page send the user back where they were headed.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
