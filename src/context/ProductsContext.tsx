/**
 * Terméklista globális állapota: betöltés localStorage-ból, admin módosítások mentése.
 * A teljes webshop és az admin termékkezelő ugyanezt a forrást használja.
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
import { INITIAL_PRODUCTS } from "../data/products";
import type { Product, ProductCategory } from "../data/types";

const STORAGE_KEY = "szerona_products_v1";

function loadFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* üres tároló vagy hibás JSON – alaplista */
  }
  return INITIAL_PRODUCTS;
}

function saveToStorage(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

interface ProductsContextValue {
  products: Product[];
  setProducts: (next: Product[]) => void;
  addProduct: (p: Omit<Product, "id"> & { id?: string }) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  /** Szűrés kategória és szöveges kereső szerint (név + leírás). */
  filterProducts: (query: string, category: ProductCategory | "all") => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(() =>
    typeof window === "undefined" ? INITIAL_PRODUCTS : loadFromStorage(),
  );

  useEffect(() => {
    saveToStorage(products);
  }, [products]);

  const setProducts = useCallback((next: Product[]) => {
    setProductsState(next);
  }, []);

  const addProduct = useCallback(
    (p: Omit<Product, "id"> & { id?: string }) => {
      const id =
        p.id ??
        `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setProductsState((prev) => [...prev, { ...p, id }]);
    },
    [],
  );

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProductsState((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProductsState((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const filterProducts = useCallback(
    (query: string, category: ProductCategory | "all") => {
      const q = query.trim().toLowerCase();
      return products.filter((p) => {
        const catOk = category === "all" || p.category === category;
        if (!catOk) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      });
    },
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      setProducts,
      addProduct,
      updateProduct,
      removeProduct,
      filterProducts,
    }),
    [
      products,
      setProducts,
      addProduct,
      updateProduct,
      removeProduct,
      filterProducts,
    ],
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
