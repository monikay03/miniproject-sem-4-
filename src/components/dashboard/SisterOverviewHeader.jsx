import React from 'react';
import { useSisterDashboard } from '../../context/SisterDashboardContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { 
  Package, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Phone,
  ArrowUpRight
} from 'lucide-react';

export default function SisterOverviewHeader({ onNavigateTab }) {
  const { metrics, metricsLoading, profile } = useSisterDashboard();
  const { currentUser, switchPlan } = useAuth();

  const isPro = currentUser?.subscription === 'pro' || metrics.subscription === 'pro';

  const grossEarnings = metrics.totalRevenue || 0;
  const platformFeeRate = isPro ? 0 : 0.05;
  const platformFee = grossEarnings * platformFeeRate;
  const netEarnings = grossEarnings - platformFee;

  return (
    <div className="space-y-6">
      
      {/* 1. Seller Profile Overview Banner */}
      <div className="bg-gradient-to-r from-pink-900 via-[#831843] to-pink-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <img
                src={profile?.avatar || currentUser?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"}
                alt={profile?.name || currentUser?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[10px]" title="Online & Accepting Orders">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold font-serif">
                  {profile?.name || currentUser?.name}'s Studio
                </h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider ${
                  isPro 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-pink-950 font-black' 
                    : 'bg-white/20 text-pink-100 border border-white/20'
                }`}>
                  {isPro ? <Zap className="w-3 h-3 fill-pink-950" /> : <ShieldCheck className="w-3 h-3" />}
                  {isPro ? 'Pro Partner' : 'Starter Tier'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-pink-200 mt-1 flex items-center gap-2 flex-wrap font-light">
                <span>{profile?.specialty || (currentUser?.role === 'artisan' ? 'Handicraft & Pottery' : 'Boutique Tailoring')}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-pink-300" />
                  {profile?.location || 'Local Neighborhood Hub'}
                </span>
              </p>

              <div className="flex items-center gap-4 text-[11px] text-pink-200/90 mt-2.5 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-pink-300" />
                  {profile?.operatingHours || '9:00 AM - 7:00 PM'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  ★ 4.9 Rating (100% On-Time)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onNavigateTab('shop')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm"
            >
              <span>Edit Shop Info</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('catalog')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-[#d81b60] hover:bg-[#c2185b] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Add Listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Orders Received */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-warm-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-gray-900">
              {metricsLoading ? '...' : metrics.totalOrders}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {metrics.completedOrders} Delivered
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>All-time requests</span>
            <span className="text-pink-700 font-bold group-hover:underline">View all →</span>
          </p>
        </div>

        {/* Card 2: Pending & Active Orders */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-warm-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active & Pending</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-amber-600">
              {metricsLoading ? '...' : metrics.activeOrders}
            </span>
            {metrics.pendingOrders > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                {metrics.pendingOrders} Needs Action
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Doorstep & craft orders</span>
            <span className="text-amber-600 font-bold group-hover:underline">Manage →</span>
          </p>
        </div>

        {/* Card 3: Total Revenue & Earnings */}
        <div 
          onClick={() => onNavigateTab('earnings')}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-warm-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700">
              {metricsLoading ? '...' : formatCurrency(grossEarnings)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPro ? 'bg-amber-100 text-amber-800' : 'bg-warm-100 text-gray-600'
            }`}>
              {isPro ? '0% Commission' : '5% Fee'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>Net payout: <strong className="text-gray-700 font-bold">{formatCurrency(netEarnings)}</strong></span>
            <span className="text-emerald-700 font-bold group-hover:underline">Payouts →</span>
          </p>
        </div>

        {/* Card 4: Total Products & Services Listed */}
        <div 
          onClick={() => onNavigateTab('catalog')}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-warm-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Listed Catalog</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-serif text-gray-900">
              {metricsLoading ? '...' : metrics.totalListings}
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {metrics.totalProducts} Crafts • {metrics.totalServices} Svcs
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
            <span>{!isPro ? `${metrics.totalListings}/3 Free limit` : 'Unlimited listings'}</span>
            <span className="text-purple-700 font-bold group-hover:underline">Manage →</span>
          </p>
        </div>

      </div>

    </div>
  );
}
