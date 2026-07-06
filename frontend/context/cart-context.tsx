"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './toast-context';

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  owner_id?: string;
  tenant_id?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  // Persistencia básica
  useEffect(() => {
    const saved = localStorage.getItem('bayup_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('bayup_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      // Si el carrito tiene ítems de otra tienda, limpiarlo antes de agregar
      const currentTenant = prev[0]?.tenant_id ?? prev[0]?.owner_id;
      const newTenant = item.tenant_id ?? item.owner_id;
      if (prev.length > 0 && currentTenant && newTenant && currentTenant !== newTenant) {
        showToast("Carrito reiniciado — solo puedes comprar en una tienda a la vez", "info");
        return [{ ...item, quantity: 1 }];
      }
      const existing = prev.find((i) => i.id === item.id && i.variant === item.variant);
      if (existing) {
        return prev.map((i) => (i.id === item.id && i.variant === item.variant ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
    setIsCartOpen(true);
    setTimeout(() => {
      const existing = items.find((i) => i.id === item.id && i.variant === item.variant);
      if (existing) {
        showToast(`Cantidad actualizada: ${item.title}`, "success");
      } else {
        showToast(`${item.title} añadido al carrito`, "success");
      }
    }, 0);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
