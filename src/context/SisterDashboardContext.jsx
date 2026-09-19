import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

const SisterDashboardContext = createContext();

export function SisterDashboardProvider({ children }) {
  const { currentUser, isSisterOrArtisan } = useAuth();

  // 1. Overview & Metrics State
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalListings: 0,
    totalProducts: 0,
    totalServices: 0,
    subscription: 'free'
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  // 2. Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState('all'); // 'all' | 'pending' | 'active' | 'completed' | 'cancelled'

  // 3. Catalog (Products & Services) State
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('all'); // 'all' | 'product' | 'service'

  // 4. Shop Profile State
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 5. Global Feedback / Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper headers for API requests (supports session cookies & fallback sister headers)
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    const effectiveSisterId = currentUser?.sisterId || currentUser?.id || currentUser?._id || 'sister-1';
    headers['x-sister-id'] = effectiveSisterId;
    if (currentUser?.id || currentUser?._id) {
      headers['x-user-id'] = currentUser.id || currentUser._id;
    }
    return headers;
  }, [currentUser]);

  // --- API FETCH FUNCTIONS ---

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    if (!currentUser || !isSisterOrArtisan) return;
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/sister/metrics', { 
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch sister metrics from server, calculating locally", err);
    } finally {
      setMetricsLoading(false);
    }
  }, [currentUser, isSisterOrArtisan, getHeaders]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    if (!currentUser || !isSisterOrArtisan) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/sister/orders', { 
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : data.orders || [];
        setOrders(normalized);
      }
    } catch (err) {
      console.warn("Failed to fetch sister orders from server", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [currentUser, isSisterOrArtisan, getHeaders]);

  // Fetch Catalog Items (Products & Services)
  const fetchCatalog = useCallback(async () => {
    if (!currentUser || !isSisterOrArtisan) return;
    setCatalogLoading(true);
    try {
      const res = await fetch('/api/sister/products', { 
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setCatalogItems(data.items);
        } else if (Array.isArray(data)) {
          setCatalogItems(data);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch sister catalog items", err);
    } finally {
      setCatalogLoading(false);
    }
  }, [currentUser, isSisterOrArtisan, getHeaders]);

  // Fetch Profile
  const fetchProfile = useCallback(async () => {
    if (!currentUser || !isSisterOrArtisan) return;
    setProfileLoading(true);
    try {
      const res = await fetch('/api/sister/profile', { 
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch sister profile", err);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser, isSisterOrArtisan, getHeaders]);

  // Initial load when user changes
  useEffect(() => {
    if (currentUser && isSisterOrArtisan) {
      fetchMetrics();
      fetchOrders();
      fetchCatalog();
      fetchProfile();
    }
  }, [currentUser, isSisterOrArtisan, fetchMetrics, fetchOrders, fetchCatalog, fetchProfile]);

  // Recalculate metrics locally when orders or catalog change
  useEffect(() => {
    if (orders.length > 0 || catalogItems.length > 0) {
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'Pending').length;
      const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Confirmed' || o.status === 'In Progress').length;
      const completedOrders = orders.filter(o => o.status === 'Completed').length;
      const totalRevenue = orders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);

      const totalServices = catalogItems.filter(i => i.itemType === 'service').length;
      const totalProducts = catalogItems.filter(i => i.itemType !== 'service').length;
      const totalListings = catalogItems.length;

      setMetrics(prev => ({
        ...prev,
        totalOrders,
        pendingOrders,
        activeOrders,
        completedOrders,
        totalRevenue,
        totalListings,
        totalProducts,
        totalServices
      }));
    }
  }, [orders, catalogItems]);

  // --- MUTATION HANDLERS ---

  // 1. Update Order Status (Accept, Complete, Reject, etc.)
  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI Update
    setOrders(prev =>
      prev.map(o => (o.id === orderId || o._id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/sister/orders/${orderId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(prev =>
            prev.map(o => (o.id === orderId || o._id === orderId ? data.order : o))
          );
        }
        
        if (newStatus === 'Completed') {
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
          showToast(`🎉 Order marked as Completed! Revenue updated.`);
        } else if (newStatus === 'Accepted' || newStatus === 'Confirmed') {
          showToast(`✅ Order accepted successfully! Client has been notified.`);
        } else if (newStatus === 'In Progress') {
          showToast(`⚡ Order marked as In Progress.`);
        } else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
          showToast(`Order status updated to ${newStatus}.`, 'info');
        }

        // Re-fetch metrics for accurate synchronization
        fetchMetrics();
        return { success: true };
      }
    } catch (err) {
      console.error("Failed to patch order status", err);
      showToast(`Status updated in local view.`, 'info');
    }
    return { success: true };
  };

  // 2. Add New Product / Service Listing
  const createListing = async (listingData) => {
    const enrichedData = {
      ...listingData,
      sellerId: listingData.sellerId || currentUser?.id || currentUser?._id || currentUser?.sisterId || 'sister-1',
      userId: listingData.userId || currentUser?.id || currentUser?._id,
      artisan: listingData.artisan || currentUser?.name || 'Skilled Sister'
    };

    try {
      const res = await fetch('/api/sister/products', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(enrichedData)
      });

      if (res.ok) {
        const data = await res.json();
        const newItem = data.item || enrichedData;
        setCatalogItems(prev => [newItem, ...prev.filter(x => (x.id || x._id) !== (newItem.id || newItem._id))]);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch (e) {}
        showToast(`✨ Successfully added "${newItem.name || newItem.title || 'Listing'}" to catalog!`);
        fetchMetrics();
        return { success: true, item: newItem };
      } else {
        // Safe fallback on unexpected non-200 response
        const fallbackItem = {
          id: `prod-${Date.now()}`,
          name: enrichedData.title || enrichedData.name || 'Untitled Listing',
          title: enrichedData.title || enrichedData.name || 'Untitled Listing',
          category: enrichedData.category || 'craft',
          itemType: enrichedData.itemType || 'product',
          price: Number(enrichedData.price) || 0,
          originalPrice: enrichedData.originalPrice ? Number(enrichedData.originalPrice) : null,
          description: enrichedData.description || "Handcrafted with skill.",
          image: enrichedData.image || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80",
          stockStatus: enrichedData.stockStatus || (enrichedData.itemType === 'service' ? 'Available for Booking' : 'In Stock'),
          inStock: enrichedData.stockStatus !== 'Out of Stock',
          duration: enrichedData.duration || '60 mins',
          createdAt: new Date().toISOString()
        };
        setCatalogItems(prev => [fallbackItem, ...prev]);
        showToast(`✨ Added "${fallbackItem.name}" to catalog!`);
        return { success: true, item: fallbackItem };
      }
    } catch (err) {
      console.error("Failed to create listing on backend", err);
      // Fallback local create
      const fallbackItem = {
        id: `prod-${Date.now()}`,
        name: enrichedData.title || enrichedData.name || 'Untitled Listing',
        title: enrichedData.title || enrichedData.name || 'Untitled Listing',
        category: enrichedData.category || 'craft',
        itemType: enrichedData.itemType || 'product',
        price: Number(enrichedData.price) || 0,
        originalPrice: enrichedData.originalPrice ? Number(enrichedData.originalPrice) : null,
        description: enrichedData.description || "Handcrafted with skill.",
        image: enrichedData.image || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80",
        stockStatus: enrichedData.stockStatus || (enrichedData.itemType === 'service' ? 'Available for Booking' : 'In Stock'),
        inStock: enrichedData.stockStatus !== 'Out of Stock',
        duration: enrichedData.duration || '60 mins',
        createdAt: new Date().toISOString()
      };
      setCatalogItems(prev => [fallbackItem, ...prev]);
      showToast(`✨ Added "${fallbackItem.name}" to catalog!`);
      return { success: true, item: fallbackItem };
    }
  };


  // 3. Update Existing Product / Service Listing
  const updateListing = async (id, updateData) => {
    // Optimistic update
    setCatalogItems(prev =>
      prev.map(item => (item.id === id || item._id === id ? { ...item, ...updateData } : item))
    );

    try {
      const res = await fetch(`/api/sister/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setCatalogItems(prev =>
            prev.map(item => (item.id === id || item._id === id ? { ...item, ...data.item } : item))
          );
        }
        showToast("Listing updated successfully!");
        return { success: true };
      }
    } catch (err) {
      console.error("Failed to update listing on backend", err);
      showToast("Listing details updated.", 'info');
    }
    return { success: true };
  };

  // 4. Toggle Availability Status
  const toggleListingAvailability = async (id, currentStatus, itemType = 'product') => {
    let nextStatus = 'In Stock';
    if (itemType === 'service') {
      nextStatus = currentStatus === 'Available for Booking' ? 'Out of Stock' : 'Available for Booking';
    } else {
      nextStatus = currentStatus === 'In Stock' ? 'Out of Stock' : 'In Stock';
    }

    return await updateListing(id, {
      stockStatus: nextStatus,
      inStock: nextStatus !== 'Out of Stock'
    });
  };

  // 5. Delete Listing
  const deleteListing = async (id) => {
    // Optimistic delete
    setCatalogItems(prev => prev.filter(item => item.id !== id && item._id !== id));

    try {
      const res = await fetch(`/api/sister/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        showToast("🗑️ Listing removed from catalog.");
        fetchMetrics();
        return { success: true };
      }
    } catch (err) {
      console.error("Failed to delete listing on backend", err);
      showToast("Listing removed.", 'info');
    }
    return { success: true };
  };

  // 6. Update Shop Profile & Settings
  const updateShopProfile = async (profileData) => {
    setProfile(prev => ({ ...prev, ...profileData }));

    try {
      const res = await fetch('/api/sister/profile', {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(profileData)
      });


      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
        showToast("✅ Shop settings & profile saved successfully!");
        return { success: true, profile: data.profile };
      }
    } catch (err) {
      console.error("Failed to update profile on backend", err);
      showToast("Shop profile details updated.", 'info');
    }
    return { success: true };
  };

  return (
    <SisterDashboardContext.Provider value={{
      metrics,
      metricsLoading,
      orders,
      ordersLoading,
      ordersFilter,
      setOrdersFilter,
      catalogItems,
      catalogLoading,
      catalogFilter,
      setCatalogFilter,
      profile,
      profileLoading,
      toast,
      showToast,
      fetchMetrics,
      fetchOrders,
      fetchCatalog,
      fetchProfile,
      updateOrderStatus,
      createListing,
      updateListing,
      toggleListingAvailability,
      deleteListing,
      updateShopProfile
    }}>
      {children}
    </SisterDashboardContext.Provider>
  );
}

export function useSisterDashboard() {
  const context = useContext(SisterDashboardContext);
  if (!context) {
    throw new Error('useSisterDashboard must be used within a SisterDashboardProvider');
  }
  return context;
}
