import { Navigate, Outlet, useLocation } from 'react-router-dom';
import FullPageLoader from '../components/feedback/FullPageLoader/FullPageLoader.jsx';
import { useAuth } from '../auth/useAuth.js';
import { getRoleHomePath } from '../auth/roles.js';

function ProtectedRoute({ allowedRoles }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader label="Checking your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
