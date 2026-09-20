import API_URL from '../api';
import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

const BookingContext = createContext();
const BOOKINGS_KEY = 'udaan_bookings_v2';

const initialSampleBookings = [
  {
    id: "bk-1001",
    bookingRef: "UD-94821",
    sisterId: "sister-1",
    sisterName: "Anjali Sharma",
    specialty: "Boutique Tailoring",
    serviceName: "Designer Blouse Stitching",
    amount: 450,
    visitFee: 50,
    totalAmount: 500,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: "Morning (9 AM - 12 PM)",
    customerName: "Radha Verma",
    customerPhone: "+91 98765 11223",
    customerAddress: "Flat 302, Palm Heights, Sector 14",
    status: "Confirmed",
    createdAt: new Date().toISOString()
  }
];

export function BookingProvider({ children }) {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);

  // Sync bookings from database when current user changes
  useEffect(() => {
    const fetchBookings = async () => {
      if (!currentUser) {
        setBookings([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/bookings`, {
  credentials: 'include'
});
        if (res.ok) {
          const data = await res.json();
          // Normalize Mongoose _id to id if frontend uses .id
          const normalized = data.map(b => ({
            ...b,
            id: b._id || b.id
          }));
          setBookings(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch bookings from backend, falling back to local storage", err);
        const saved = localStorage.getItem(BOOKINGS_KEY);
        if (saved) setBookings(JSON.parse(saved));
      }
    };

    fetchBookings();
  }, [currentUser]);

  // Keep localStorage updated as fallback
  useEffect(() => {
    try {
      if (bookings.length > 0) {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
      }
    } catch (e) {
      console.error("Failed to save bookings to localStorage", e);
    }
  }, [bookings]);

  const createBooking = async (bookingData) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(bookingData)
});
      if (res.ok) {
        const newBooking = await res.json();
        const normalized = { ...newBooking, id: newBooking._id || newBooking.id };
        setBookings(prev => [normalized, ...prev]);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        return normalized;
      }
    } catch (err) {
      console.error("Database connection failed, falling back to offline booking mock creation", err);
    }

    // Offline fallback
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const fallbackBooking = {
      id: `bk-${Date.now()}`,
      bookingRef: `UD-${randomCode}`,
      status: "Pending",
      createdAt: new Date().toISOString(),
      ...bookingData
    };
    setBookings(prev => [fallbackBooking, ...prev]);
    return fallbackBooking;
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ status })
});
      if (res.ok) {
        const updated = await res.json();
        const normalized = { ...updated, id: updated._id || updated.id };
        setBookings(prev =>
          prev.map(b => (b.id === bookingId || b._id === bookingId ? normalized : b))
        );
        return;
      }
    } catch (err) {
      console.error("Failed to update status on backend", err);
    }

    // Offline fallback
    setBookings(prev =>
      prev.map(b => (b.id === bookingId || b._id === bookingId ? { ...b, status } : b))
    );
  };

  const cancelBooking = (bookingId) => {
    updateBookingStatus(bookingId, 'Cancelled');
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      createBooking,
      cancelBooking,
      updateBookingStatus,
      isMyBookingsOpen,
      setIsMyBookingsOpen
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}
