import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { sellerAuth, vendorAuth, superAdminAuth, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  switch (role) {
    case 'seller':
      if (!sellerAuth) return <Navigate to="/stall-owner/login" state={{ from: location }} replace />;
      break;
    case 'vendor':
      if (!vendorAuth) return <Navigate to="/vendor/login" state={{ from: location }} replace />;
      break;
    case 'superAdmin':
      if (!superAdminAuth) return <Navigate to="/superadmin/login" state={{ from: location }} replace />;
      break;
    default:
      if (!sellerAuth && !vendorAuth && !superAdminAuth) {
        return <Navigate to="/" replace />;
      }
  }

  return children;
};

export default ProtectedRoute;