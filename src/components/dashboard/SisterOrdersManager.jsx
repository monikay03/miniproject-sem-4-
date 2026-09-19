import React, { useState } from 'react';
import { useSisterDashboard } from '../../context/SisterDashboardContext';
import { formatCurrency } from '../../lib/utils';
import { 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  CheckCircle, 
  Search, 
  Filter, 
  AlertCircle,
  FileText,
  User,
  Sparkles
} from 'lucide-react';

export default function SisterOrdersManager() {
  const { 
    orders, 
    ordersLoading, 
    ordersFilter, 
    setOrdersFilter, 
    updateOrderStatus 
  } = useSisterDashboard();

  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    await updateOrderStatus(orderId, newStatus);
    setUpdatingId(null);
  };

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    // 1. Status Filter
    if (ordersFilter === 'pending' && order.status !== 'Pending') return false;
    if (ordersFilter === 'active' && !['Accepted', 'Confirmed', 'In Progress'].includes(order.status)) return false;
    if (ordersFilter === 'completed' && order.status !== 'Completed') return false;
    if (ordersFilter === 'cancelled' && !['Cancelled', 'Rejected'].includes(order.status)) return false;

    // 2. Search Query
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchId = (order.bookingRef || order.orderId || order.id || '').toLowerCase().includes(q);
      const matchCust = (order.customerName || '').toLowerCase().includes(q);
      const matchSvc = (order.serviceName || order.name || '').toLowerCase().includes(q);
      const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
      return matchId || matchCust || matchSvc || matchPhone;
    }

    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Accepted':
      case 'Confirmed':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-warm-100 text-gray-700 border-warm-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-warm-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-150">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#d81b60]" />
              Received Orders & Doorstep Requests
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live dynamic orders assigned to your profile. Update status in real time to inform clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-pink-800 rounded-full border border-pink-200">
              {orders.length} Total Orders
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
              { key: 'active', label: 'Active', count: orders.filter(o => ['Accepted', 'Confirmed', 'In Progress'].includes(o.status)).length },
              { key: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'Completed').length },
              { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => ['Cancelled', 'Rejected'].includes(o.status)).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setOrdersFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  ordersFilter === tab.key
                    ? 'bg-[#d81b60] text-white shadow-sm'
                    : 'bg-warm-50 text-gray-600 hover:bg-warm-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  ordersFilter === tab.key ? 'bg-white/20 text-white' : 'bg-warm-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-warm-50 border border-warm-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      {ordersLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#d81b60] mx-auto mb-3" />
          <p className="text-xs text-gray-500">Fetching live orders from database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-warm-200 space-y-2">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-800 font-serif">No Orders Found</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {orderSearch 
              ? `No results matching "${orderSearch}". Try a different filter or search term.`
              : `No orders in the "${ordersFilter}" category right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isCompleted = order.status === 'Completed';
            const isCancelled = order.status === 'Cancelled' || order.status === 'Rejected';
            const isPending = order.status === 'Pending';
            const isAccepted = order.status === 'Accepted' || order.status === 'Confirmed';
            const isInProgress = order.status === 'In Progress';
            const isProcessing = updatingId === (order.id || order._id);

            const orderIdDisplay = order.bookingRef || order.orderId || `UD-${order.id?.slice(-5) || '1001'}`;
            const itemTitle = order.serviceName || order.name || order.items?.[0]?.name || "Custom Craft / Service";
            const amountDisplay = order.totalAmount || order.amount || 0;

            return (
              <div
                key={order.id || order._id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/10' 
                    : isCancelled 
                      ? 'border-gray-200 opacity-70 bg-gray-50/50' 
                      : isPending 
                        ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-sm' 
                        : 'border-warm-200 shadow-sm hover:border-pink-300'
                }`}
              >
                {/* Top Bar: Order ID, Status Badge, Price */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-warm-150">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-pink-900 bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200">
                      {orderIdDisplay}
                    </span>
                    <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {order.date ? `📅 ${order.date}` : new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-lg font-bold font-serif text-gray-900 block">
                      {formatCurrency(amountDisplay)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Payment: {order.paymentMethod || 'Cash on Delivery (Pay upon Visit)'}
                    </span>
                  </div>
                </div>

                {/* Middle Grid: Order Item Details & Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
                  {/* Left: Item & Schedule Info */}
                  <div className="space-y-2 bg-warm-50/60 p-3.5 rounded-2xl border border-warm-150">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#d81b60] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-gray-900 text-sm block font-serif">{itemTitle}</strong>
                        {order.specialty && <span className="text-[11px] text-gray-500">{order.specialty}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-600 pt-1">
                      {order.timeSlot && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          Slot: <strong className="text-gray-800">{order.timeSlot}</strong>
                        </span>
                      )}
                    </div>

                    {order.specialNotes && (
                      <div className="text-[11px] text-pink-900 bg-pink-50 p-2 rounded-xl border border-pink-100 italic">
                        💬 Note from customer: "{order.specialNotes}"
                      </div>
                    )}
                  </div>

                  {/* Right: Customer & Location Info */}
                  <div className="space-y-2 bg-warm-50/60 p-3.5 rounded-2xl border border-warm-150">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="text-gray-600">
                        Customer: <strong className="text-gray-900 text-xs font-bold">{order.customerName || order.customer?.name || "Verified Client"}</strong>
                      </span>
                    </div>

                    {(order.customerPhone || order.customer?.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-gray-600">
                          Phone: <a href={`tel:${order.customerPhone || order.customer?.phone}`} className="text-pink-700 font-bold hover:underline">{order.customerPhone || order.customer?.phone}</a>
                        </span>
                      </div>
                    )}

                    {(order.customerAddress || order.customer?.address) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600 leading-snug">
                          Address: <strong className="text-gray-800 font-medium">{order.customerAddress || order.customer?.address}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons (Real-time Status Mutation) */}
                <div className="pt-3 border-t border-warm-150 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-[11px] text-gray-400">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Order successfully completed & revenue added to balance.
                      </span>
                    ) : isCancelled ? (
                      <span className="flex items-center gap-1 text-gray-500">
                        <XCircle className="w-4 h-4" /> Order was rejected or cancelled.
                      </span>
                    ) : (
                      <span>Click to update order stage in real time</span>
                    )}
                  </div>

                  {/* Action Controls */}
                  {!isCompleted && !isCancelled && (
                    <div className="flex items-center gap-2">
                      {/* Reject / Decline Button */}
                      <button
                        disabled={isProcessing}
                        onClick={() => handleStatusChange(order.id || order._id, 'Rejected')}
                        className="px-3.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      {/* Accept Button (When Pending) */}
                      {isPending && (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(order.id || order._id, 'Accepted')}
                          className="px-5 py-2 text-xs font-bold bg-[#d81b60] hover:bg-[#c2185b] text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Updating...' : 'Accept Order'}</span>
                        </button>
                      )}

                      {/* Mark In Progress (When Accepted) */}
                      {isAccepted && (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(order.id || order._id, 'In Progress')}
                          className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Updating...' : 'Start / Mark In Progress'}</span>
                        </button>
                      )}

                      {/* Mark Completed (When In Progress or Accepted) */}
                      {isInProgress && (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(order.id || order._id, 'Completed')}
                          className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Updating...' : 'Mark as Completed'}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                        ✓ Payout Ready
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
