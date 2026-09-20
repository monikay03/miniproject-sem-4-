import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../api';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'udaan_auth_v5';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState('home'); // 'home' | 'shop-detail' | 'dashboard'
  const [activeSisterId, setActiveSisterId] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('bookings'); // 'bookings' | 'shop' | 'subscription'
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSisterOrArtisan = currentUser && (currentUser.role === 'sister' || currentUser.role === 'artisan');

  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      if (path === '/dashboard/sister' || path === '/dashboard') {
        if (currentUser) {
          if (currentUser.role === 'sister' || currentUser.role === 'artisan') {
            setCurrentView('dashboard');
          } else {
            // Unauthorized buyer trying to access sister dashboard -> redirect to home
            setCurrentView('home');
            window.history.replaceState({}, '', '/');
          }
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [currentUser]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/user`, {
  credentials: 'include'
});
        const data = await res.json();
        if (data.authenticated && data.user) {
          const isSellerRole = data.user.role === 'sister' || data.user.role === 'artisan';
          const fetchedUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            avatar: data.user.profileImage,
            subscription: data.user.sisters?.[0]?.subscription || 'free',
            sisterId: data.user.sisters?.[0]?._id || data.user.sisters?.[0]?.id || null,
            sisterProfile: data.user.sisters?.[0] || null
          };
          setCurrentUser(fetchedUser);

          const path = window.location.pathname;
          if (isSellerRole) {
            setCurrentView('dashboard');
            setDashboardTab('bookings');
            if (path !== '/dashboard/sister' && path !== '/dashboard') {
              window.history.replaceState({}, '', '/dashboard/sister');
            }
          } else {
            setCurrentView('home');
            if (path === '/dashboard/sister' || path === '/dashboard') {
              window.history.replaceState({}, '', '/');
            }
          }
        } else {
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            const isSellerRole = parsed.role === 'sister' || parsed.role === 'artisan';
            setCurrentUser(parsed);
            if (isSellerRole) {
              setCurrentView('dashboard');
              setDashboardTab('bookings');
            } else {
              setCurrentView('home');
            }
          }
        }
      } catch (e) {
        console.warn("Backend auth unavailable, using offline mock state", e);
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const isSellerRole = parsed.role === 'sister' || parsed.role === 'artisan';
          setCurrentUser(parsed);
          if (isSellerRole) {
            setCurrentView('dashboard');
            setDashboardTab('bookings');
          } else {
            setCurrentView('home');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save auth state", e);
    }
  }, [currentUser]);

  const login = (email, password, role = 'buyer') => {
    const name = email.split('@')[0];
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const isSellerRole = role === 'sister' || role === 'artisan';
    
    let sisterId = null;
    if (isSellerRole) {
      sisterId = 'sister-1'; // Default to first mock sister
    }

    const user = {
      id: `usr-${Date.now()}`,
      name: formattedName,
      email,
      role,
      subscription: 'free',
      sisterId
    };

    setCurrentUser(user);
    if (isSellerRole) {
      setCurrentView('dashboard');
      setDashboardTab('bookings');
      window.history.pushState({}, '', '/dashboard/sister');
    } else {
      setCurrentView('home');
      window.history.pushState({}, '', '/');
    }
    setIsOnboardingModalOpen(role === 'buyer');
    return user;
  };

  const register = (name, email, password, role = 'buyer') => {
    const isSellerRole = role === 'sister' || role === 'artisan';
    const user = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      subscription: 'free',
      sisterId: isSellerRole ? 'sister-1' : null
    };

    setCurrentUser(user);
    if (isSellerRole) {
      setCurrentView('dashboard');
      setDashboardTab('bookings');
      window.history.pushState({}, '', '/dashboard/sister');
    } else {
      setCurrentView('home');
      window.history.pushState({}, '', '/');
    }
    setIsOnboardingModalOpen(role === 'buyer');
    return user;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
  credentials: 'include'
});
    } catch (e) {
      console.error("Failed backend logout", e);
    }
    setCurrentUser(null);
    setCurrentView('home');
    setActiveSisterId(null);
    setDashboardTab('bookings');
    setIsOnboardingModalOpen(false);
    setSearchQuery('');
    window.history.replaceState({}, '', '/');
  };

  const enrollCurrentAsSister = (sisterId) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      role: 'sister',
      sisterId: sisterId || 'sister-1'
    };
    setCurrentUser(updated);
    setDashboardTab('shop');
    setCurrentView('dashboard');
    setIsOnboardingModalOpen(false);
    window.history.pushState({}, '', '/dashboard/sister');
  };

  const switchPlan = (tier) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      subscription: tier
    };
    setCurrentUser(updated);
  };

  const toggleDemoRole = () => {
    if (!currentUser) return;
    const isSeller = currentUser.role === 'sister' || currentUser.role === 'artisan';
    const nextRole = isSeller ? 'buyer' : 'sister';
    switchDemoRole(nextRole);
  };

  const switchDemoRole = (targetRole) => {
    if (targetRole === 'sister') {
      login('anjali.sister@udaan.org', 'password123', 'sister');
    } else {
      login('client.demo@udaan.org', 'password123', 'buyer');
    }
  };

  const exitDemoMode = () => {
    logout();
  };

  const navigateTo = (view, sisterId = null, tab = null) => {
    // Role guard: restrict dashboard to sister or artisan
    if (view === 'dashboard') {
      const isSeller = currentUser && (currentUser.role === 'sister' || currentUser.role === 'artisan');
      if (!isSeller) {
        alert("🔒 Access Restricted: Seller Dashboard is exclusively available for enrolled Skilled Sisters. Please switch to Sister role to view the dashboard.");
        setCurrentView('home');
        window.history.replaceState({}, '', '/');
        return;
      }
      window.history.pushState({}, '', '/dashboard/sister');
    } else if (view === 'home') {
      window.history.pushState({}, '', '/');
    }

    setCurrentView(view);
    if (sisterId) {
      setActiveSisterId(sisterId);
    } else if (view === 'home') {
      setActiveSisterId(null);
    }

    if (view === 'dashboard') {
      if (tab === 'bookings' || tab === 'orders' || tab === 'requests') {
        setDashboardTab('orders');
      } else if (tab) {
        setDashboardTab(tab);
      }
    }
  };

  const isAuthenticated = !!currentUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#d81b60]"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      isSisterOrArtisan,
      currentView,
      activeSisterId,
      dashboardTab,
      setDashboardTab,
      isOnboardingModalOpen,
      setIsOnboardingModalOpen,
      searchQuery,
      setSearchQuery,
      login,
      register,
      logout,
      enrollCurrentAsSister,
      switchPlan,
      toggleDemoRole,
      switchDemoRole,
      exitDemoMode,
      navigateTo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
