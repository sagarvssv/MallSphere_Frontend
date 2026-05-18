import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sellerAuth, setSellerAuth] = useState(false);
  const [vendorAuth, setVendorAuth] = useState(false);
  const [superAdminAuth, setSuperAdminAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const hasSellerAuth =
        localStorage.getItem('sellerAuthenticated') === 'true' &&
        !!localStorage.getItem('sellerId');

      const hasVendorAuth =
        localStorage.getItem('vendorAuthenticated') === 'true' &&
        !!localStorage.getItem('vendorId');

      // ✅ CONFLICT RESOLUTION: Both can't be active simultaneously
      // because they share the same cookie. Clear both and force re-login.
      if (hasSellerAuth && hasVendorAuth) {
        console.warn('[Auth] Conflict detected: both seller and vendor are marked as authenticated. Clearing both.');
        localStorage.removeItem('sellerAuthenticated');
        localStorage.removeItem('vendorAuthenticated');
        setSellerAuth(false);
        setVendorAuth(false);
        setIsLoading(false);
        return;
      }

      setSellerAuth(hasSellerAuth);
      setVendorAuth(hasVendorAuth);
      setSuperAdminAuth(
        localStorage.getItem('isAuthenticated') === 'true' &&
        !!localStorage.getItem('superAdminData')
      );
      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // ✅ Login functions clear the OTHER auth before setting their own
  const loginSeller = useCallback((data) => {
    // Clear vendor auth first to prevent conflict
    localStorage.removeItem('vendorAuthenticated');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('vendorData');
    setVendorAuth(false);

    localStorage.setItem('sellerAuthenticated', 'true');
    if (data.sellerId) localStorage.setItem('sellerId', data.sellerId);
    setSellerAuth(true);
  }, []);

  const loginVendor = useCallback((data) => {
    // Clear seller auth first to prevent conflict
    localStorage.removeItem('sellerAuthenticated');
    localStorage.removeItem('sellerId');
    localStorage.removeItem('sellerData');
    localStorage.removeItem('shopId');
    setSellerAuth(false);

    localStorage.setItem('vendorAuthenticated', 'true');
    if (data.vendorId) localStorage.setItem('vendorId', data.vendorId);
    setVendorAuth(true);
  }, []);

  const loginSuperAdmin = useCallback(() => {
    localStorage.setItem('isAuthenticated', 'true');
    setSuperAdminAuth(true);
  }, []);

  const logoutSeller = useCallback(() => {
    ['sellerId', 'sellerAuthenticated', 'sellerEmail', 'sellerData',
     'shopId', 'accessToken', 'refreshToken', 'vendorApprovalStatus']
      .forEach(key => localStorage.removeItem(key));
    setSellerAuth(false);
  }, []);

  const logoutVendor = useCallback(() => {
    ['vendorId', 'vendorAuthenticated', 'vendorData', 'vendorProfile']
      .forEach(key => localStorage.removeItem(key));
    setVendorAuth(false);
  }, []);

  const logoutSuperAdmin = useCallback(() => {
    localStorage.removeItem('superAdminData');
    localStorage.removeItem('isAuthenticated');
    setSuperAdminAuth(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoading,
      sellerAuth,
      vendorAuth,
      superAdminAuth,
      loginSeller,
      loginVendor,
      loginSuperAdmin,
      logoutSeller,
      logoutVendor,
      logoutSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};