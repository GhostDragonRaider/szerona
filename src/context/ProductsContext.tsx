/**
 * Termeklista globalis allapota: backendrol tolt, admin modositasok API-n at.
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
import { INITIAL_PRODUCTS } from "../data/products";
import type { Product, ProductCategory } from "../data/types";

interface ProductsActionResult {
  ok: boolean;
  message?: string;
  product?: Product;
}

interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: (includeInactive?: boolean) => Promise<void>;
  addProduct: (
    p: Omit<Product, "id"> & { id?: string },
  ) => Promise<ProductsActionResult>;
  updateProduct: (
    id: string,
    patch: Partial<Product>,
  ) => Promise<ProductsActionResult>;
  removeProduct: (id: string) => Promise<ProductsActionResult>;
  filterProducts: (
    query: string,
    category: ProductCategory | "all",
    minPrice?: number,
    maxPrice?: number,
  ) => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

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

interface ProductsResponse {
  ok: boolean;
  products: Product[];
}

interface ProductResponse {
  ok: boolean;
  message?: string;
  product: Product;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async (includeInactive = false) => {
    try {
      setError(null);
      const response = await apiFetch<ProductsResponse>(
        `/api/products${includeInactive ? "?includeInactive=true" : ""}`,
      );
      setProductsState(response.products);
    } catch (err) {
      setError(getErrorMessage(err, "Nem sikerult a termekeket betolteni."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const addProduct = useCallback(
    async (
      p: Omit<Product, "id"> & { id?: string },
    ): Promise<ProductsActionResult> => {
      try {
        const response = await apiFetch<ProductResponse>("/api/products", {
          method: "POST",
          auth: true,
          json: p,
        });

        setProductsState((prev) => [response.product, ...prev]);
        return {
          ok: true,
          message: response.message ?? "Termek letrehozva.",
          product: response.product,
        };
      } catch (err) {
        return {
          ok: false,
          message: getErrorMessage(err, "Nem sikerult a termeket menteni."),
        };
      }
    },
    [],
  );

  const updateProductAction = useCallback(
    async (id: string, patch: Partial<Product>): Promise<ProductsActionResult> => {
      const current = products.find((product) => product.id === id);
      if (!current) {
        return { ok: false, message: "A termek nem talalhato." };
      }

      try {
        const response = await apiFetch<ProductResponse>(`/api/products/${id}`, {
          method: "PATCH",
          auth: true,
          json: { ...current, ...patch },
        });

        setProductsState((prev) =>
          prev.map((product) => (product.id === id ? response.product : product)),
        );

        return {
          ok: true,
          message: response.message ?? "Termek frissitve.",
          product: response.product,
        };
      } catch (err) {
        return {
          ok: false,
          message: getErrorMessage(err, "Nem sikerult a termek frissitese."),
        };
      }
    },
    [products],
  );

  const removeProduct = useCallback(async (id: string): Promise<ProductsActionResult> => {
    try {
      const response = await apiFetch<{ ok: boolean; message?: string }>(
        `/api/products/${id}`,
        {
          method: "DELETE",
          auth: true,
        },
      );

      setProductsState((prev) => prev.filter((product) => product.id !== id));
      return {
        ok: true,
        message: response.message ?? "Termek torolve.",
      };
    } catch (err) {
      return {
        ok: false,
        message: getErrorMessage(err, "Nem sikerult a termek torlese."),
      };
    }
  }, []);

  const filterProducts = useCallback(
    (
      query: string,
      category: ProductCategory | "all",
      minPrice?: number,
      maxPrice?: number,
    ) => {
      const q = query.trim().toLowerCase();
      return products.filter((p) => {
        if (p.active === false) return false;
        const catOk = category === "all" || p.category === category;
        if (!catOk) return false;
        if (typeof minPrice === "number" && p.price < minPrice) return false;
        if (typeof maxPrice === "number" && p.price > maxPrice) return false;
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
      isLoading,
      error,
      refreshProducts,
      addProduct,
      updateProduct: updateProductAction,
      removeProduct,
      filterProducts,
    }),
    [
      products,
      isLoading,
      error,
      refreshProducts,
      addProduct,
      updateProductAction,
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
