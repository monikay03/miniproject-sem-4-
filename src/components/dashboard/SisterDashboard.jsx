import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SisterDashboardProvider, useSisterDashboard } from '../../context/SisterDashboardContext';
import SisterOverviewHeader from './SisterOverviewHeader';
import SisterOrdersManager from './SisterOrdersManager';
import SisterCatalogManager from './SisterCatalogManager';
import SisterProfileSettings from './SisterProfileSettings';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Store, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  LogOut,
  Lock
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

function SisterDashboardContent() {
  const { 
    currentUser, 
    isSisterOrArtisan, 
    dashboardTab, 
    setDashboardTab, 
    switchPlan, 
    navigateTo
  } = useAuth();

  const { 
    metrics, 
    orders, 
    catalogItems, 
    toast 
  } = useSisterDashboard();

  // Single source of truth for the active tab synced directly with dashboardTab
  const activeTab = (dashboardTab === 'bookings' || dashboardTab === 'requests' || dashboardTab === 'orders') 
    ? 'orders' 
    : (dashboardTab || 'overview');

  const handleTabChange = (tab) => {
    setDashboardTab(tab);
  };

  const isPro = currentUser?.subscription === 'pro' || metrics?.subscription === 'pro';

  // AI Pricing Assistant State
  const [aiServiceName, setAiServiceName] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Role Gate Guard: Restrict access to /dashboard/sister
  if (!currentUser || (!isSisterOrArtisan && currentUser.role !== 'sister' && currentUser.role !== 'artisan')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-gray-900">
          Restricted Seller Access
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          The Sister / Seller Dashboard is exclusively available for users registered as a <strong>Skilled Sister</strong>.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => navigateTo('home')}
            className="px-5 py-2.5 bg-[#d81b60] hover:bg-[#c2185b] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            Return to Marketplace Home
          </button>
        </div>
      </div>
    );
  }

  const handleGetAiSuggestion = (e) => {
    e.preventDefault();
    if (!aiServiceName.trim()) return;

    let range = "₹350 - ₹600";
    let text = "Based on local market trends for similar services in your zone, clients are 3x more likely to book services in this range. Pricing at ₹450 is recommended for maximum booking conversions.";

    const query = aiServiceName.toLowerCase();
    if (query.includes('bridal') || query.includes('lehenga') || query.includes('wedding')) {
      range = "₹1,500 - ₹3,500";
      text = "Premium bridal fitting and bridal packages are in high demand in your neighborhood. We recommend setting a premium rate with complimentary trial adjustments.";
    } else if (query.includes('blouse') || query.includes('kurti') || query.includes('stitch')) {
      range = "₹400 - ₹750";
      text = "Stitching services face regular weekly demand. Customers prefer doorstep pickup and delivery fitting. Adding a minor visit charge is recommended.";
    } else if (query.includes('pottery') || query.includes('vase') || query.includes('terracotta') || query.includes('kulhad')) {
      range = "₹350 - ₹950";
      text = "Artisanal clay pottery is popular for eco-friendly home decor. Bundling sets of 4 or 6 increases basket size by 45%.";
    } else if (query.includes('henna') || query.includes('mehendi')) {
      range = "₹350 - ₹1,500";
      text = "Mehendi pricing scales with intricate bridal vs Arabic designs. Setting standard packages at ₹350 and bridal packages at ₹2,100 drives high conversions.";
    }

    setAiSuggestion({ range, text });
  };

  const handleUpgradePlan = (tier) => {
    switchPlan(tier);
  };

  const activeOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'In Progress').length;
  const totalCatalogCount = catalogItems.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">


      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
          toast.type === 'error'
            ? 'bg-red-900 text-white border-red-700'
            : toast.type === 'info'
              ? 'bg-blue-900 text-white border-blue-700'
              : 'bg-gray-950 text-white border-warm-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* SaaS Upgrade Promo Banner for Starter tier */}
      {!isPro && (
        <div className="bg-gradient-to-r from-amber-500 via-[#d81b60] to-pink-900 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Zap className="w-8 h-8 text-yellow-300 shrink-0 fill-yellow-300 hidden md:block" />
            <div>
              <h4 className="font-bold text-sm sm:text-base">Upgrade to Udaan Pro Partner</h4>
              <p className="text-xs text-pink-100">Get unlimited listings, 0% platform commission on doorstep visits, and priority search placement.</p>
            </div>
          </div>
          <button
            onClick={() => handleTabChange('earnings')}
            className="bg-white hover:bg-pink-50 text-pink-900 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow transition-all active:scale-95 whitespace-nowrap"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Main Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-warm-200 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-pink-50 text-[#d81b60] border-b-2 sm:border-b-0 sm:border-l-4 border-[#d81b60] shadow-sm'
              : 'text-gray-600 hover:bg-warm-50 hover:text-gray-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#d81b60]" />
          <span>Overview & Metrics</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-pink-50 text-[#d81b60] border-b-2 sm:border-b-0 sm:border-l-4 border-[#d81b60] shadow-sm'
              : 'text-gray-600 hover:bg-warm-50 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4 text-[#d81b60]" />
          <span>Received Orders</span>
          {activeOrdersCount > 0 && (
            <span className="w-5 h-5 bg-[#d81b60] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('catalog')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-pink-50 text-[#d81b60] border-b-2 sm:border-b-0 sm:border-l-4 border-[#d81b60] shadow-sm'
              : 'text-gray-600 hover:bg-warm-50 hover:text-gray-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#d81b60]" />
          <span>Products & Services</span>
          <span className="text-[10px] text-gray-500 font-semibold bg-warm-100 px-2 py-0.5 rounded-full">
            {totalCatalogCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('shop')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-pink-50 text-[#d81b60] border-b-2 sm:border-b-0 sm:border-l-4 border-[#d81b60] shadow-sm'
              : 'text-gray-600 hover:bg-warm-50 hover:text-gray-900'
          }`}
        >
          <Store className="w-4 h-4 text-[#d81b60]" />
          <span>Studio Settings</span>
        </button>

        <button
          onClick={() => handleTabChange('earnings')}
          className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'bg-pink-50 text-[#d81b60] border-b-2 sm:border-b-0 sm:border-l-4 border-[#d81b60] shadow-sm'
              : 'text-gray-600 hover:bg-warm-50 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#d81b60]" />
          <span>Earnings & Plans</span>
          {isPro && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
        </button>
      </div>

      {/* --- TAB CONTENT AREA --- */}

      {/* TAB 1: Overview & Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <SisterOverviewHeader onNavigateTab={handleTabChange} />
          
          {/* Quick Recent Orders Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#d81b60]" />
                Latest Received Orders
              </h3>
              <button
                onClick={() => handleTabChange('orders')}
                className="text-xs text-[#d81b60] font-bold hover:underline"
              >
                View all orders →
              </button>
            </div>
            <SisterOrdersManager />
          </div>
        </div>
      )}

      {/* TAB 2: Orders Management */}
      {activeTab === 'orders' && (
        <SisterOrdersManager />
      )}

      {/* TAB 3: Catalog Management */}
      {activeTab === 'catalog' && (
        <SisterCatalogManager onOpenUpgrade={() => handleTabChange('earnings')} />
      )}

      {/* TAB 4: Shop Settings & Profile */}
      {activeTab === 'shop' && (
        <SisterProfileSettings />
      )}

      {/* TAB 5: Earnings & SaaS Plan Tiers */}
      {activeTab === 'earnings' && (
        <div className="space-y-8">
          {/* Earnings Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-warm-200">
            <h3 className="text-lg font-bold font-serif text-gray-900 mb-6 flex items-center gap-2 pb-3 border-b border-warm-150">
              <TrendingUp className="w-5 h-5 text-[#d81b60]" />
              Business Revenue & Payout Balance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-warm-50 p-4 rounded-2xl border border-warm-200 text-center">
                <span className="text-xs text-gray-500">Completed Orders</span>
                <strong className="block text-2xl font-serif text-gray-900 mt-1">
                  {metrics.completedOrders || 0}
                </strong>
              </div>
              <div className="bg-warm-50 p-4 rounded-2xl border border-warm-200 text-center">
                <span className="text-xs text-gray-500">Gross Sales</span>
                <strong className="block text-2xl font-serif text-pink-700 mt-1">
                  {formatCurrency(metrics.totalRevenue || 0)}
                </strong>
              </div>
              <div className="bg-warm-50 p-4 rounded-2xl border border-warm-200 text-center">
                <span className="text-xs text-gray-500">Platform Commission ({isPro ? '0%' : '5%'})</span>
                <strong className="block text-2xl font-serif text-red-600 mt-1">
                  -{formatCurrency((metrics.totalRevenue || 0) * (isPro ? 0 : 0.05))}
                </strong>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-800 font-semibold">Net Payout</span>
                <strong className="block text-2xl font-serif text-emerald-900 mt-1 font-extrabold">
                  {formatCurrency((metrics.totalRevenue || 0) * (isPro ? 1 : 0.95))}
                </strong>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              *Real-time earnings updated immediately whenever an order is marked as Completed.
            </p>
          </div>

          {/* Plan Tiers */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-warm-200">
            <h3 className="text-lg font-bold font-serif text-gray-900 mb-6 flex items-center gap-2 pb-3 border-b border-warm-150">
              <Zap className="w-5 h-5 text-[#d81b60]" />
              Partner Membership Tiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Starter Tier */}
              <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between ${
                !isPro ? 'border-[#d81b60] bg-pink-50/20 shadow-sm' : 'border-warm-200 bg-white'
              }`}>
                <div>
                  <h4 className="text-base font-bold text-gray-900 font-serif">Starter Tier</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">For newly enrolled rural sisters</p>
                  
                  <div className="flex items-baseline gap-1 mt-4 mb-5">
                    <span className="text-3xl font-serif font-extrabold text-gray-950">₹0</span>
                    <span className="text-xs text-gray-400">/free forever</span>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-600 mb-6">
                    <li className="flex items-center gap-2">✓ Standard interactive neighborhood map listing</li>
                    <li className="flex items-center gap-2">✓ Up to 3 product/service listings</li>
                    <li className="flex items-center gap-2">✓ 5% platform commission</li>
                  </ul>
                </div>

                {!isPro ? (
                  <span className="w-full text-center py-2.5 bg-warm-200 text-gray-700 font-bold rounded-xl text-xs block cursor-default">
                    Current Active Tier
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgradePlan('free')}
                    className="w-full py-2.5 border border-warm-300 hover:bg-warm-50 text-gray-700 font-bold rounded-xl text-xs transition-all active:scale-95"
                  >
                    Downgrade to Starter
                  </button>
                )}
              </div>

              {/* Pro Tier */}
              <div className={`p-6 rounded-3xl border-2 flex flex-col justify-between relative overflow-hidden ${
                isPro ? 'border-[#d81b60] bg-pink-50/20 shadow-lg' : 'border-warm-200 bg-white hover:border-pink-300'
              }`}>
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  POPULAR
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base font-bold text-gray-950 font-serif">Udaan Pro Partner</h4>
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Maximize sales and local booking conversions</p>
                  
                  <div className="flex items-baseline gap-1 mt-4 mb-5">
                    <span className="text-3xl font-serif font-extrabold text-pink-700">₹299</span>
                    <span className="text-xs text-gray-400">/monthly</span>
                  </div>

                  <ul className="space-y-2 text-xs text-gray-600 mb-6">
                    <li className="flex items-center gap-2 font-semibold">🚀 <strong>Priority Map & Search Ranking</strong></li>
                    <li className="flex items-center gap-2 font-semibold">✓ <strong>Unlimited</strong> craft & service listings</li>
                    <li className="flex items-center gap-2 font-semibold">✓ <strong>0% Commission</strong> (Keep 100% of revenue)</li>
                    <li className="flex items-center gap-2 font-semibold">✓ Direct <strong>WhatsApp Chat Badge</strong></li>
                    <li className="flex items-center gap-2 font-semibold">✓ <strong>AI Pricing Assistant</strong> access</li>
                  </ul>
                </div>

                {isPro ? (
                  <span className="w-full text-center py-2.5 bg-gradient-to-r from-pink-700 to-[#d81b60] text-white font-extrabold rounded-xl text-xs block cursor-default shadow-sm shadow-pink-600/20">
                    Current Active Tier
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpgradePlan('pro')}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-700 to-[#d81b60] hover:from-pink-800 hover:to-pink-900 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-pink-600/25"
                  >
                    Upgrade to Udaan Pro (₹299/mo)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI Pricing Assistant */}
          {isPro ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-200">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-pink-100">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
                <h3 className="text-base font-bold font-serif text-gray-950">AI Pricing Assistant (Pro Partner Feature)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Research real-time fair rates for craft items and services in your zone to maximize conversion.
              </p>

              <form onSubmit={handleGetAiSuggestion} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter craft or service name (e.g. Terracotta Kulhad, Bridal Blouse, Mehendi)..."
                  value={aiServiceName}
                  onChange={(e) => setAiServiceName(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-warm-300"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#d81b60] to-pink-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all"
                >
                  Get AI Advice
                </button>
              </form>

              {aiSuggestion && (
                <div className="mt-4 p-4 bg-pink-50/60 border border-pink-200 rounded-2xl space-y-1 text-xs text-pink-950 animate-fade-in">
                  <p>💡 Recommended Fair Price: <strong className="text-pink-800 text-sm font-extrabold">{aiSuggestion.range}</strong></p>
                  <p className="text-pink-900/90 leading-relaxed font-light">{aiSuggestion.text}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-warm-100 rounded-3xl p-6 border border-warm-200 text-center opacity-75">
              <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="font-bold text-gray-800 font-serif text-sm">Unlock AI Pricing Assistant</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Upgrade to Udaan Pro to access pricing advice powered by regional transaction histories.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function SisterDashboard() {
  return (
    <SisterDashboardProvider>
      <SisterDashboardContent />
    </SisterDashboardProvider>
  );
}
