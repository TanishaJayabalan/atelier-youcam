'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  image_url?: string;
  reason?: string;
  externalUrl: string;
  priceEstimate?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Partial<CartItem> & { name: string; category: string }) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Hydrate cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mirror_check_cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mirror_check_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cartItems]);

  const addToCart = (item: Partial<CartItem> & { name: string; category: string }) => {
    const id = item.id || `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const query = encodeURIComponent(`${item.brand || ''} ${item.name}`.trim());
    const externalUrl = item.externalUrl || `https://www.google.com/search?tbm=shop&q=${query}`;

    const newItem: CartItem = {
      id,
      name: item.name,
      brand: item.brand || 'Atelier Pick',
      category: item.category,
      image_url: item.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
      reason: item.reason,
      externalUrl,
      priceEstimate: item.priceEstimate || '$38.00',
    };

    setCartItems((prev) => {
      if (prev.some((i) => i.name === newItem.name)) return prev;
      return [...prev, newItem];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        itemCount: cartItems.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
