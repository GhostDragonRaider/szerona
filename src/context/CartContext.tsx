/**
 * Kosar allapot: vendegkent localStorage, belepve backend szinkronnal.
 * A backend foglalja a keszletet es ellenorzi a rendelheto mennyiseget.
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
import { apiFetch, type ApiError } from "../lib/api";
import { useAuth } from "./AuthContext";
import type { CartLine, Product } from "../data/types";

const GUEST_STORAGE_KEY = "szerona_guest_cart_v1";
const LEGACY_STORAGE_KEYS = ["szerona_cart_v1", "szerona_cart_v2"];

interface CartResponse {
  ok: boolean;
  message?: string;
  cart: {
    lines: CartLine[];
    totalItems: number;
    totalPrice: number;
  };
}

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product, qty?: number) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* fallback ures kosar */
  }
  return [];
}

function saveGuestCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(lines));
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const apiError = error as ApiError | null;
  if (apiError?.message) {
    return apiError.message;
  }

  return fallback;
}

function toCartPayload(lines: CartLine[]) {
  return lines.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : loadGuestCart(),
  );
  const [isOpen, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServerCart = useCallback(async () => {
    const response = await apiFetch<CartResponse>("/api/cart", {
      auth: true,
    });
    setLines(response.cart.lines);
    setError(null);
  }, []);

  const commitLines = useCallback(
    async (nextLines: CartLine[]) => {
      setLines(nextLines);

      if (!user) {
        saveGuestCart(nextLines);
        return;
      }

      try {
        const response = await apiFetch<CartResponse>("/api/cart", {
          method: "PUT",
          auth: true,
          json: { lines: toCartPayload(nextLines) },
        });
        setLines(response.cart.lines);
        clearGuestCart();
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Nem sikerult a kosarat frissiteni."));
        try {
          await fetchServerCart();
        } catch {
          /* marad a legutobbi helyi allapot */
        }
      }
    },
    [fetchServerCart, user],
  );

  const refreshCart = useCallback(async () => {
    if (!user) {
      setLines(loadGuestCart());
      return;
    }

    setIsLoading(true);
    try {
      await fetchServerCart();
    } finally {
      setIsLoading(false);
    }
  }, [fetchServerCart, user]);

  useEffect(() => {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(legacyKey);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCart() {
      if (!user) {
        setLines(loadGuestCart());
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const guestLines = loadGuestCart();
        if (guestLines.length > 0) {
          const response = await apiFetch<CartResponse>("/api/cart", {
            method: "PUT",
            auth: true,
            json: { lines: toCartPayload(guestLines) },
          });
          if (!cancelled) {
            setLines(response.cart.lines);
            clearGuestCart();
            setError(null);
          }
        } else {
          const response = await apiFetch<CartResponse>("/api/cart", {
            auth: true,
          });
          if (!cancelled) {
            setLines(response.cart.lines);
            setError(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Nem sikerult a kosarat betolteni."));
          setLines([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void hydrateCart();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      const nextLines = (() => {
        const index = lines.findIndex((line) => line.product.id === product.id);
        if (index === -1) {
          return [...lines, { product, quantity: qty }];
        }

        const next = [...lines];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + qty,
        };
        return next;
      })();

      void commitLines(nextLines);
    },
    [commitLines, lines],
  );

  const removeLine = useCallback(
    (productId: string) => {
      const nextLines = lines.filter((line) => line.product.id !== productId);
      void commitLines(nextLines);
    },
    [commitLines, lines],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeLine(productId);
        return;
      }

      const nextLines = lines.map((line) =>
        line.product.id === productId ? { ...line, quantity } : line,
      );
      void commitLines(nextLines);
    },
    [commitLines, lines, removeLine],
  );

  const clearCart = useCallback(async () => {
    setLines([]);

    if (!user) {
      clearGuestCart();
      return;
    }

    try {
      const response = await apiFetch<CartResponse>("/api/cart", {
        method: "DELETE",
        auth: true,
      });
      setLines(response.cart.lines);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Nem sikerult a kosarat uriteni."));
      try {
        await fetchServerCart();
      } catch {
        /* */
      }
    }
  }, [fetchServerCart, user]);

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  const totalPrice = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      removeLine,
      setQuantity,
      clearCart,
      refreshCart,
      totalItems,
      totalPrice,
      isOpen,
      setOpen,
      isLoading,
      error,
    }),
    [
      lines,
      addToCart,
      removeLine,
      setQuantity,
      clearCart,
      refreshCart,
      totalItems,
      totalPrice,
      isOpen,
      isLoading,
      error,
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
