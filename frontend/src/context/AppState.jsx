import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const AppStateContext = createContext(null);

const LS_KEYS = {
  favorites: "resrv_favorites",
  reviews: "resrv_reviews",
  bookings: "resrv_bookings",
};

function loadFromLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function AppStateProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(loadFromLocalStorage(LS_KEYS.favorites, [])));
  const [reviewsMap, setReviewsMap] = useState(() => {
    const loaded = loadFromLocalStorage(LS_KEYS.reviews, {});
    // 為舊評論添加reviewId
    const migrated = {};
    for (const [id, reviews] of Object.entries(loaded)) {
      if (Array.isArray(reviews)) {
        migrated[id] = reviews.map((r, i) => ({
          ...r,
          reviewId: r.reviewId || `review_${id}_${i}_${r.createdAt || Date.now()}`
        }));
      }
    }
    return migrated;
  });
  const [bookings, setBookings] = useState(() => {
    const loaded = loadFromLocalStorage(LS_KEYS.bookings, []);
    // 為舊訂位添加bookingId
    return loaded.map((b, i) => ({
      ...b,
      bookingId: b.bookingId || `booking_${i}_${b.createdAt || Date.now()}`
    }));
  });

  useEffect(() => {
    localStorage.setItem(LS_KEYS.favorites, JSON.stringify(Array.from(favoriteIds)));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.reviews, JSON.stringify(reviewsMap));
  }, [reviewsMap]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.bookings, JSON.stringify(bookings));
  }, [bookings]);

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addReview = (id, review) => {
    const safe = {
      name: String(review.name || "匿名"),
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
      comment: String(review.comment || ""),
      createdAt: new Date().toISOString(),
      reviewId: Date.now().toString(),
    };
    setReviewsMap((prev) => {
      const list = Array.isArray(prev[id]) ? prev[id].slice() : [];
      list.unshift(safe);
      return { ...prev, [id]: list };
    });
  };

  const deleteReview = (restaurantId, reviewId) => {
    setReviewsMap((prev) => {
      const list = Array.isArray(prev[restaurantId]) ? prev[restaurantId].filter(r => r.reviewId !== reviewId) : [];
      return { ...prev, [restaurantId]: list };
    });
  };

  const updateReview = (restaurantId, reviewId, updates) => {
    setReviewsMap((prev) => {
      const list = Array.isArray(prev[restaurantId]) ? prev[restaurantId].map(r => {
        if (r.reviewId === reviewId) {
          return {
            ...r,
            rating: updates.rating !== undefined ? Math.max(1, Math.min(5, Number(updates.rating) || r.rating)) : r.rating,
            comment: updates.comment !== undefined ? String(updates.comment) : r.comment,
          };
        }
        return r;
      }) : [];
      return { ...prev, [restaurantId]: list };
    });
  };

  const deleteBooking = (bookingId) => {
    setBookings((prev) => prev.filter(b => b.bookingId !== bookingId));
  };

  const updateBooking = (bookingId, updates) => {
    setBookings((prev) => prev.map(b => {
      if (b.bookingId === bookingId) {
        return { ...b, ...updates };
      }
      return b;
    }));
  };

  const value = useMemo(() => ({
    favoriteIds,
    isFavorite: (id) => favoriteIds.has(id),
    toggleFavorite,
    reviewsMap,
    addReview,
    deleteReview,
    updateReview,
    bookings,
    addBooking: (b) => setBookings((prev) => [{...b, createdAt: new Date().toISOString(), bookingId: Date.now().toString()}, ...prev]),
    deleteBooking,
    updateBooking,
    getBookingsByRestaurant: (id) => bookings.filter(b => b.restaurantId === id),
  }), [favoriteIds, reviewsMap, bookings]);

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}


