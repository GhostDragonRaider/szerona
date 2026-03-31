/**
 * Bolt oldal: kategória szűrő (URL query), kereső integráció, termékrács.
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
  margin-bottom: ${({ theme }) => theme.space.xl};
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

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get("category") as ProductCategory | "all" | null;
  const category: ProductCategory | "all" =
    categoryParam && allCategories.includes(categoryParam)
      ? categoryParam
      : "all";

  const { query } = useSearch();
  const { filterProducts } = useProducts();

  const list = useMemo(
    () => filterProducts(query, category),
    [filterProducts, query, category],
  );

  function setCategory(next: ProductCategory | "all") {
    if (next === "all") setParams({});
    else setParams({ category: next });
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
      {list.length === 0 ? (
        <Empty>Nincs találat. Próbálj más keresőszót vagy kategóriát.</Empty>
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
