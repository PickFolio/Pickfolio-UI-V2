import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { isLoggedIn } = useAuth();

  // If the user is not logged in, redirect them to the /auth page
  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  // If they are logged in, render the child route's component (e.g., HomePage)
  return <Outlet />;
}

export default Layout;