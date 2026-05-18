import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children, role }) => {
  const { sellerAuth, vendorAuth, superAdminAuth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If conflict exists, AuthContext already cleared both — just show login page
  switch (role) {
    case 'seller':
      if (sellerAuth) return <Navigate to="/stall-owner/dashboard" replace />;
      break;
    case 'vendor':
      if (vendorAuth) return <Navigate to="/vendor/dashboard" replace />;
      break;
    case 'superAdmin':
      if (superAdminAuth) return <Navigate to="/superadmin/dashboard" replace />;
      break;
  }

  return children;
};

export default PublicRoute;