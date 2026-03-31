/**
 * Termékcsoportok vizuális rácsa: kategóriánként modellfotó (generált), link a bolt + szűrőre.
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { BrandStorySection } from "./BrandStorySection";
import { CATEGORY_LABELS } from "../../data/categoryLabels";
import type { ProductCategory } from "../../data/types";

/** Generált kategória-képek (public/pictures) – modell a megfelelő ruhanemben */
const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  polo: "/pictures/category-polo.png",
  pulover: "/pictures/category-pulover.png",
  nadrag: "/pictures/category-nadrag.png",
  cipo: "/pictures/category-cipo.png",
};

const Section = styled.section`
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
  }
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.xl};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Card = styled(Link)<{ $imageUrl: string }>`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  min-height: 200px;
  padding: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-height: 240px;
    padding: ${({ theme }) => theme.space.lg};
  }
  border-radius: ${({ theme }) => theme.radii.lg};
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.surfaceElevated};
  background-image: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.88) 0%,
      rgba(0, 0, 0, 0.35) 42%,
      transparent 68%
    ),
    url(${({ $imageUrl }) => $imageUrl});
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
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
  color: #ffffff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
`;

const CardHint = styled.span`
  margin-top: ${({ theme }) => theme.space.sm};
  font-size: 0.85rem;
  color: #ffffff;
  position: relative;
  z-index: 1;
`;

const categories: ProductCategory[] = ["polo", "pulover", "nadrag", "cipo"];

export function CategoryGrid() {
  return (
    <>
      <BrandStorySection />
      <Section>
        <Title>Fedezd fel</Title>
        <Grid>
          {categories.map((cat) => (
            <Card
              key={cat}
              to={`/shop?category=${cat}`}
              $imageUrl={CATEGORY_IMAGES[cat]}
            >
              <CardTitle>{CATEGORY_LABELS[cat]}</CardTitle>
              <CardHint>Megnézem →</CardHint>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
