'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cartApi } from '@/lib/api-endpoints';
import type { Cart, CartItem } from '@/types';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, variantId: string, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.addToCart({ productId, variantId, quantity });
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.updateCartItem({ itemId, quantity });
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.removeFromCart(itemId);
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart(null);
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = cart?.items.reduce(
    (sum, item) => sum + item.priceAtTimeOfAdd * item.quantity,
    0
  ) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCart,
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