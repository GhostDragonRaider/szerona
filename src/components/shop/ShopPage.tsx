/**
 * Bolt oldal: kategória, ár és kereső alapú szűrés a termékrácshoz.
 */
import styled from "@emotion/styled";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { useSearch } from "../../context/SearchContext";
import { CATEGORY_LABELS } from "../../data/categoryLabels";
import type { ProductCategory } from "../../data/types";
import { ProductCard } from "./ProductCard";

const Page = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.md}
    ${({ theme }) => theme.space.xl};
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg}
      ${({ theme }) => theme.space.xxl};
  }
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 0.06em;
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const Chip = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, active }) =>
      active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, active }) =>
    active ? theme.colors.accentSoft : "transparent"};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.9rem;
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.text};
  }
`;

const PriceFilters = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.xl};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, minmax(180px, 240px));
  }
`;

const PriceField = styled.label`
  display: block;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const PriceInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.lg};
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.05rem;
`;

const allCategories: (ProductCategory | "all")[] = [
  "all",
  "polo",
  "pulover",
  "nadrag",
  "cipo",
];

function parsePrice(value: string | null) {
  if (!value) return undefined;
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : undefined;
}

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category") as ProductCategory | "all" | null;
  const category: ProductCategory | "all" =
    categoryParam && allCategories.includes(categoryParam)
      ? categoryParam
      : "all";

  const minPriceValue = params.get("minPrice") ?? "";
  const maxPriceValue = params.get("maxPrice") ?? "";
  const minPrice = parsePrice(minPriceValue);
  const maxPrice = parsePrice(maxPriceValue);

  const { query } = useSearch();
  const { filterProducts, isLoading, error } = useProducts();

  const list = useMemo(
    () => filterProducts(query, category, minPrice, maxPrice),
    [filterProducts, query, category, minPrice, maxPrice],
  );

  function updateParams(next: {
    category?: ProductCategory | "all";
    minPrice?: string;
    maxPrice?: string;
  }) {
    const nextParams = new URLSearchParams(params);

    if (next.category !== undefined) {
      if (next.category === "all") nextParams.delete("category");
      else nextParams.set("category", next.category);
    }

    if (next.minPrice !== undefined) {
      if (next.minPrice.trim()) nextParams.set("minPrice", next.minPrice.trim());
      else nextParams.delete("minPrice");
    }

    if (next.maxPrice !== undefined) {
      if (next.maxPrice.trim()) nextParams.set("maxPrice", next.maxPrice.trim());
      else nextParams.delete("maxPrice");
    }

    setParams(nextParams);
  }

  function setCategory(next: ProductCategory | "all") {
    updateParams({ category: next });
  }

  return (
    <Page>
      <Title>Bolt</Title>
      <Filters role="group" aria-label="Kategória szűrő">
        {allCategories.map((c) => (
          <Chip
            key={c}
            type="button"
            active={category === c}
            onClick={() => setCategory(c)}
          >
            {c === "all" ? "Összes" : CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </Filters>
      <PriceFilters>
        <PriceField>
          Minimum ár
          <PriceInput
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="pl. 10000"
            value={minPriceValue}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
          />
        </PriceField>
        <PriceField>
          Maximum ár
          <PriceInput
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="pl. 30000"
            value={maxPriceValue}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
          />
        </PriceField>
      </PriceFilters>
      {error ? <Empty>{error}</Empty> : null}
      {isLoading ? <Empty>Termekek betoltese...</Empty> : null}
      {list.length === 0 ? (
        <Empty>
          Nincs találat. Próbálj más keresőszót, kategóriát vagy ártartományt.
        </Empty>
      ) : (
        <Grid>
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Grid>
      )}
    </Page>
  );
}
