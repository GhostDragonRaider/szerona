/**
 * Automatikusan görgető terméksáv: a termékek kártyáinak sora végtelenített CSS animációval.
 * Nincs külön videó – csak keyframes translateX és duplikált tartalom a zökkenőmentes hurkhoz.
 */
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useProducts } from "../../context/ProductsContext";
import { ProductCard } from "../shop/ProductCard";

/** translate3d: jobb GPU réteg mobilon, kevesebb furcsa újrarajzolás */
const scroll = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
`;

const Section = styled.section`
  padding: ${({ theme }) => theme.space.xl} 0;
  overflow: hidden;
  overflow-x: clip;
  background: ${({ theme }) => theme.colors.bg};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  isolation: isolate;
  contain: layout paint;
  touch-action: pan-y;
  overscroll-behavior-x: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xxl} 0;
  }
`;

const Head = styled.div`
  max-width: 1200px;
  margin: 0 auto ${({ theme }) => theme.space.lg};
  padding: 0 ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-bottom: ${({ theme }) => theme.space.xl};
    padding: 0 ${({ theme }) => theme.space.lg};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text};
`;

const Sub = styled.p`
  margin: ${({ theme }) => theme.space.sm} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1rem;
`;

const Viewport = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  overflow-x: clip;
  contain: layout paint;
  /* mask-image iOS-on néha hibás kompozitálást okoz görgetéskor – csak nagyobb képernyőn */
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    -webkit-mask-image: linear-gradient(
      90deg,
      transparent,
      #000 8%,
      #000 92%,
      transparent
    );
    mask-image: linear-gradient(
      90deg,
      transparent,
      #000 8%,
      #000 92%,
      transparent
    );
  }
`;

const Track = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  width: max-content;
  min-width: min-content;
  animation: ${scroll} 45s linear infinite;
  backface-visibility: hidden;
  @media (hover: hover) {
    &:hover {
      animation-play-state: paused;
    }
  }
`;

const CardWrap = styled.div`
  flex: 0 0 280px;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 0 0 300px;
  }
`;

export function AutoScrollSlider() {
  const { products } = useProducts();
  const items = products.slice(0, 12);
  const loop = [...items, ...items];

  return (
    <Section aria-label="Kiemelt termékek automatikus sávja">
      <Head>
        <Title>Kiemeltek</Title>
        <Sub>
          Gördülő válogatás – állítsd meg az egeret a kártyán a szünethez.
        </Sub>
      </Head>
      <Viewport>
        <Track>
          {loop.map((p, i) => (
            <CardWrap key={`${p.id}-${i}`}>
              <ProductCard product={p} compact showCartButton={false} />
            </CardWrap>
          ))}
        </Track>
      </Viewport>
    </Section>
  );
}
