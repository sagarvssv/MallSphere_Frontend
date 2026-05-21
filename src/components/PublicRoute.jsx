import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DASHBOARD_MAP = {
  seller:     '/stall-owner/dashboard',
  vendor:     '/vendor/dashboard',
  superAdmin: '/superadmin/dashboard',
};

const PublicRoute = ({ children, role }) => {
  const { sellerAuth, vendorAuth, superAdminAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  const authMap = {
    seller:     sellerAuth,
    vendor:     vendorAuth,
    superAdmin: superAdminAuth,
  };

  const isAuthenticated = !!authMap[role];
  const dashboardPath   = DASHBOARD_MAP[role];

  // This fires when the user lands here via the back button.
  // By the time the effect runs the component has already mounted,
  // so we imperatively replace the entry so they can't go "back" again.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(dashboardPath, { replace: true });
    }
  }, [isLoading, isAuthenticated, dashboardPath, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Declarative redirect handles the normal (non-back-button) case
  if (isAuthenticated) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export default PublicRoute;