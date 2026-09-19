import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSisters } from '../context/SistersContext';
import { useCart } from '../context/CartContext';
import { useBookings } from '../context/BookingContext';
import { useOrders } from '../context/OrdersContext';
import { 
  ShoppingBag, 
  Package, 
  Search, 
  Zap, 
  LogOut, 
  User, 
  Menu, 
  X,
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  ArrowRight,
  MapPin,
  Star
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function Navbar() {
  const { 
    currentUser, 
    isAuthenticated, 
    logout, 
    currentView, 
    dashboardTab,
    navigateTo, 
    toggleDemoRole 
  } = useAuth();

  const { 
    searchQuery, 
    setSearchQuery,
    sisters,
    products,
    setSelectedSisterForBooking
  } = useSisters();

  const { totalItemsCount, setIsCartOpen, addToCart } = useCart();
  const { bookings } = useBookings();
  const { orders, setIsMyOrdersOpen } = useOrders();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const isSister = currentUser.role === 'sister' || currentUser.role === 'artisan';
  const isPro = currentUser.subscription === 'pro';

  // Count requests/bookings
  const activeBookingsCount = bookings.filter(b => b.status === 'Confirmed' || b.status === 'In Progress').length;
  const activeOrdersCount = orders.length;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      setIsSearchFocused(true);
    }
    if (currentView !== 'home') {
      navigateTo('home');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      if (currentView !== 'home') {
        navigateTo('home');
      }
      setTimeout(() => {
        const el = document.getElementById('sisters');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setSearchQuery('');
    setIsSearchFocused(false);
    navigateTo('home');
  };

  // Live matching sisters & products for dropdown
  const q = searchQuery.toLowerCase().trim();
  const matchedSistersDropdown = q ? sisters.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.specialty.toLowerCase().includes(q) ||
    s.category?.toLowerCase().includes(q) ||
    s.location?.toLowerCase().includes(q) ||
    s.services?.some(svc => svc.name.toLowerCase().includes(q))
  ).slice(0, 4) : [];

  const matchedProductsDropdown = q ? products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q) ||
    p.artisan?.toLowerCase().includes(q) ||
    p.state?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const hasLiveResults = q.length > 0 && (matchedSistersDropdown.length > 0 || matchedProductsDropdown.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-warm-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* LEFT: Branding & Logo */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleLogoClick}>
              <svg className="w-8 h-8 text-pink-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-2xl font-bold text-pink-700 font-serif tracking-wide">udaan</span>
            </div>
          </div>

          {/* CENTER: Prominent Dynamic Search Bar with Live Suggestions Dropdown */}
          <div ref={searchContainerRef} className="flex-1 max-w-lg mx-2 sm:mx-6 relative">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search by artisan, skill, craft, or location..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => { if (searchQuery.trim()) setIsSearchFocused(true); }}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-warm-50 border border-warm-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-brand-pink group-hover:border-pink-400 transition-all font-medium shadow-inner"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-hover:text-brand-pink transition-colors" />
              
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Instant Search Dropdown Overlay */}
            {isSearchFocused && q.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-warm-200 overflow-hidden z-50 animate-fade-in max-h-[75vh] overflow-y-auto">
                
                {/* Matched Sisters Preview */}
                {matchedSistersDropdown.length > 0 && (
                  <div className="p-3 border-b border-warm-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-900 px-2 block mb-2">
                      Matching Sister Shops ({matchedSistersDropdown.length})
                    </span>
                    <div className="space-y-1.5">
                      {matchedSistersDropdown.map(sister => (
                        <div
                          key={sister.id}
                          className="p-2.5 rounded-xl hover:bg-pink-50/60 transition-colors flex items-center justify-between gap-3 group/item cursor-pointer"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigateTo('shop-detail', sister.id);
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={sister.avatar} alt={sister.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-pink-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-xs text-gray-900 truncate">{sister.name}</h5>
                                <span className="text-[10px] bg-pink-100 text-pink-800 font-bold px-1.5 py-0.2 rounded-full">
                                  ★ {Number(sister.rating).toFixed(1)}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">{sister.specialty} • {sister.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(sister.rate)}</span>
                            <span className="text-xs font-bold text-[#d81b60] group-hover/item:translate-x-0.5 transition-transform flex items-center gap-0.5">
                              <span>Visit Shop</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Crafts Preview */}
                {matchedProductsDropdown.length > 0 && (
                  <div className="p-3 border-b border-warm-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-900 px-2 block mb-2">
                      Handmade Crafts ({matchedProductsDropdown.length})
                    </span>
                    <div className="space-y-1.5">
                      {matchedProductsDropdown.map(prod => (
                        <div
                          key={prod.id}
                          className="p-2 rounded-xl hover:bg-warm-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-gray-900 truncate">{prod.name}</h5>
                              <p className="text-[10px] text-gray-500 truncate">{prod.artisan} • {prod.state}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(prod.price)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(prod);
                                setIsCartOpen(true);
                                setIsSearchFocused(false);
                              }}
                              className="px-2.5 py-1 bg-pink-50 hover:bg-[#d81b60] hover:text-white text-[#d81b60] border border-pink-200 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              + Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Footer: Scroll to Full Results */}
                {hasLiveResults ? (
                  <button
                    onClick={() => {
                      setIsSearchFocused(false);
                      if (currentView !== 'home') navigateTo('home');
                      setTimeout(() => {
                        const el = document.getElementById('sisters');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full py-2.5 bg-warm-50 hover:bg-pink-50 text-[#d81b60] text-xs font-bold text-center border-t border-warm-100 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View all matching results on page & map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500">
                    <p>No results found for "{searchQuery}".</p>
                    <p className="text-[11px] text-gray-400 mt-1">Try searching for skills like <strong>Tailoring, Mehendi, Cooking, Pottery, Yoga, Cleaning</strong> or artisan names.</p>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* RIGHT: Dynamic Actions based on Role */}
          <div className="hidden lg:flex items-center gap-4">
                    {/* 1. Normal User (Buyer) Actions */}
            {!isSister && (
              <>
                <button
                  onClick={() => setIsMyOrdersOpen(true)}
                  className="p-2 text-gray-700 hover:text-brand-pink hover:bg-pink-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                >
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>Orders</span>
                  {activeOrdersCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-black rounded-full">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="p-2 text-gray-700 hover:text-brand-pink hover:bg-pink-50 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                >
                  <ShoppingBag className="w-5 h-5 text-gray-500" />
                  <span>Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#d81b60] text-white text-[10px] font-black rounded-full animate-bounce">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* 2. Enrolled Sister Actions */}
            {isSister && (
              <>
                {/* My Dashboard Button */}
                <button
                  onClick={() => navigateTo('dashboard', null, 'overview')}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    currentView === 'dashboard' && (dashboardTab === 'overview' || !dashboardTab)
                      ? 'text-brand-pink bg-pink-50 ring-1 ring-pink-200'
                      : 'text-gray-700 hover:text-brand-pink hover:bg-pink-50'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-gray-500" />
                  <span>Dashboard</span>
                </button>

                {/* Requests Button (Clickable -> Opens Received Orders & Requests tab) */}
                <button
                  onClick={() => navigateTo('dashboard', null, 'orders')}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    currentView === 'dashboard' && (dashboardTab === 'orders' || dashboardTab === 'bookings' || dashboardTab === 'requests')
                      ? 'text-brand-pink bg-pink-50 ring-1 ring-pink-200'
                      : 'text-gray-700 hover:text-brand-pink hover:bg-pink-50'
                  }`}
                >
                  <CalendarDays className="w-5 h-5 text-gray-500" />
                  <span>Requests</span>
                  {activeBookingsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#d81b60] text-white text-[10px] font-black rounded-full animate-pulse">
                      {activeBookingsCount}
                    </span>
                  )}
                </button>

                <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full flex items-center gap-0.5 shadow-sm shrink-0 select-none ${
                  isPro ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white' : 'bg-warm-100 text-gray-600'
                }`}>
                  {isPro ? <Zap className="w-3 h-3 fill-white text-white" /> : null}
                  {isPro ? 'Udaan Pro' : 'Starter Tier'}
                </span>
              </>
            )}

            {/* 3. Global Profile Menu / Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border border-warm-300 ring-2 ring-transparent hover:ring-pink-400 transition-all flex items-center justify-center bg-pink-100 text-pink-700 font-extrabold shadow-sm cursor-pointer"
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-warm-200 p-2 text-xs font-bold text-gray-700 animate-fade-in z-50 space-y-1">
                  <div className="px-3.5 py-2 border-b border-warm-100 text-gray-900 mb-1">
                    <p className="font-extrabold">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{currentUser.email}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                      {isSister ? '👩‍🔧 Sister Studio' : '🛍️ Buyer Account'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Menu Action Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-brand-pink rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile menu drop-down list */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-warm-200 animate-fade-in space-y-3 font-bold text-xs">
            <div className="flex flex-col gap-1 px-2">
              {!isSister ? (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsMyOrdersOpen(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-pink-50 rounded-xl flex items-center justify-between"
                  >
                    <span>Orders</span>
                    {activeOrdersCount > 0 && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">{activeOrdersCount}</span>}
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsCartOpen(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-pink-50 rounded-xl flex items-center justify-between"
                  >
                    <span>Cart</span>
                    {totalItemsCount > 0 && <span className="bg-pink-100 text-brand-pink px-2 py-0.5 rounded-full font-black">{totalItemsCount}</span>}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigateTo('dashboard', null, 'overview'); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-pink-50 rounded-xl"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigateTo('dashboard', null, 'orders'); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-pink-50 rounded-xl flex items-center justify-between"
                  >
                    <span>Requests</span>
                    {activeBookingsCount > 0 && <span className="bg-pink-100 text-brand-pink px-2 py-0.5 rounded-full font-black">{activeBookingsCount}</span>}
                  </button>
                </>
              )}
              
              <div className="border-t border-warm-150 my-2 pt-2" />

              <button
                onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out ({currentUser.name})</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}

