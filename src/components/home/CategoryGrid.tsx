/**
 * Termékcsoportok vizuális rácsa: pólók, pulóverek, nadrágok, cipők – link a bolt + szűrőre.
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { CATEGORY_LABELS } from "../../data/categoryLabels";
import type { ProductCategory } from "../../data/types";

const Section = styled.section`
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  }
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.xl};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 0.06em;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const gradients: Record<ProductCategory, string> = {
  polo: "linear-gradient(145deg, #1e1b4b 0%, #ff3d5a 100%)",
  pulover: "linear-gradient(145deg, #0f172a 0%, #3b82f6 100%)",
  nadrag: "linear-gradient(145deg, #14532d 0%, #eab308 100%)",
  cipo: "linear-gradient(145deg, #292524 0%, #f97316 100%)",
};

const Card = styled(Link)<{ grad: string }>`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 140px;
  padding: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-height: 160px;
    padding: ${({ theme }) => theme.space.lg};
  }
  border-radius: ${({ theme }) => theme.radii.lg};
  text-decoration: none;
  background: ${({ grad }) => grad};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  &:hover {
    transform: translateY(-6px);
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`;

const CardTitle = styled.span`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
`;

const CardHint = styled.span`
  margin-top: ${({ theme }) => theme.space.sm};
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
`;

const categories: ProductCategory[] = ["polo", "pulover", "nadrag", "cipo"];

export function CategoryGrid() {
  return (
    <Section>
      <Title>Shop kategóriák</Title>
      <Grid>
        {categories.map((cat) => (
          <Card
            key={cat}
            to={`/shop?category=${cat}`}
            grad={gradients[cat]}
          >
            <CardTitle>{CATEGORY_LABELS[cat]}</CardTitle>
            <CardHint>Megnézem →</CardHint>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}
