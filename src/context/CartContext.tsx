/**
 * Kosár állapot: tételek, mennyiség, összeg; perzisztencia localStorage-ban.
 * A kosár panel csak a fejléc „Kosár” gombjára nyílik; kosárba tétel nem nyitja ki.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "../data/types";

const STORAGE_KEY = "szerona_cart_v1";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback üres kosár */
  }
  return [];
}

function saveCart(lines: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product, qty?: number) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : loadCart(),
  );
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    saveCart(lines);
  }, [lines]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      if (i === -1) return [...prev, { product, quantity: qty }];
      const next = [...prev];
      next[i] = {
        ...next[i],
        quantity: next[i].quantity + qty,
      };
      return next;
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeLine(productId);
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId ? { ...l, quantity } : l,
      ),
    );
  }, [removeLine]);

  const clearCart = useCallback(() => setLines([]), []);

  const totalItems = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines],
  );

  const totalPrice = useMemo(
    () => lines.reduce((s, l) => s + l.product.price * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      removeLine,
      setQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isOpen,
      setOpen,
    }),
    [
      lines,
      addToCart,
      removeLine,
      setQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isOpen,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
