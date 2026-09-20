import API_URL from '../api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const OrdersContext = createContext();
const ORDERS_KEY = 'udaan_orders_v3';

const sampleInitialOrders = [
  {
    id: "ord-1001",
    orderId: "ORD-94820",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "In Transit",
    currentStep: 2, // 0: Placed, 1: Packed by Artisan, 2: In Transit, 3: Delivered
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    trackingNumber: "UD-EXP-7729410",
    courierPartner: "India Post Speed Post / BlueDart",
    customer: {
      name: "Aarya Sharma",
      phone: "+91 98765 43210",
      email: "aarya@example.com",
      address: "Flat 402, Green Glen Heights, Sector 14",
      city: "Jaipur",
      pincode: "302017",
      paymentMethod: "Cash on Delivery"
    },
    items: [
      {
        id: "prod-1",
        name: "Handcrafted Jaipur Blue Pottery Ceramic Vase",
        artisan: "Meera Bai & Self-Help Group",
        price: 890,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80"
      },
      {
        id: "prod-5",
        name: "Natural Terracotta Chai Kulhad Set (Pack of 6)",
        artisan: "Lata Devi Village SHG",
        price: 420,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
      }
    ],
    subtotal: 1310,
    shipping: 0,
    total: 1310
  }
];

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load orders", e);
    }
    return sampleInitialOrders;
  });

  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error("Failed to save orders", e);
    }
  }, [orders]);

  const placeOrder = (orderDetails) => {
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const trackingCode = `UD-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const deliveryDate = new Date(Date.now() + 86400000 * 4).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderId: `ORD-${randomCode}`,
      createdAt: new Date().toISOString(),
      status: "Order Confirmed",
      currentStep: 0, // 0: Placed, 1: Packed, 2: In Transit, 3: Delivered
      estimatedDelivery: deliveryDate,
      trackingNumber: trackingCode,
      courierPartner: "India Post Speed Post / BlueDart",
      ...orderDetails
    };

    setOrders(prev => [newOrder, ...prev]);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setSelectedOrderForTracking(newOrder);
    return newOrder;
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId && o.orderId !== orderId));
    if (selectedOrderForTracking && (selectedOrderForTracking.id === orderId || selectedOrderForTracking.orderId === orderId)) {
      setSelectedOrderForTracking(null);
    }
  };

  const cancelOrder = (orderId) => {
    setOrders(prev =>
      prev.map(o =>
        (o.id === orderId || o.orderId === orderId)
          ? { ...o, status: "Cancelled", currentStep: 0 }
          : o
      )
    );
    if (selectedOrderForTracking && (selectedOrderForTracking.id === orderId || selectedOrderForTracking.orderId === orderId)) {
      setSelectedOrderForTracking(prev => ({
        ...prev,
        status: "Cancelled",
        currentStep: 0
      }));
    }
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      placeOrder,
      deleteOrder,
      cancelOrder,
      isMyOrdersOpen,
      setIsMyOrdersOpen,
      selectedOrderForTracking,
      setSelectedOrderForTracking
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
