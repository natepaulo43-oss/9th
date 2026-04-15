import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, delta: number, size?: string, color?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, size?: string, color?: string) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (size ? item.size === size : !item.size) &&
          (color ? item.color === color : !item.color)
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          (size ? item.size === size : !item.size) &&
          (color ? item.color === color : !item.color)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size, color }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size?: string, color?: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            (size ? item.size === size : !item.size) &&
            (color ? item.color === color : !item.color)
          )
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, delta: number, size?: string, color?: string) => {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === productId &&
          (size ? item.size === size : !item.size) &&
          (color ? item.color === color : !item.color)
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal,
    }),
    [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
