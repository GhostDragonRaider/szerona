/**
 * Kiemelt termékek sávja:
 * – md+ : végtelenített CSS animáció (asztal / emulátor)
 * – mobilon : nincs transform-animáció (WebKit hibák elkerülése), vízszintes kézi görgetés + scroll-snap
 */
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { useProducts } from "../../context/ProductsContext";
import { ProductCard } from "../shop/ProductCard";

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
  background: ${({ theme }) => theme.colors.bg};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  /* Mobilon ne vágjuk le a vízszintes sávot; md+ szorítjuk be az animált sávot */
  overflow: visible;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    overflow: hidden;
    overflow-x: clip;
    isolation: isolate;
    contain: layout paint;
    touch-action: pan-y;
    overscroll-behavior-x: none;
  }
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

const SubMobile = styled.span`
  display: block;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const SubDesktop = styled.span`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

/** Csak telefon / keskeny: kézi görgetés, nincs CSS végtelen animáció */
const MobileStrip = styled.div`
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: ${({ theme }) => theme.space.md};
  padding-bottom: ${({ theme }) => theme.space.xs};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const MobileRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: ${({ theme }) => theme.space.md};
  width: max-content;
  padding: 0 ${({ theme }) => theme.space.md};
  box-sizing: border-box;
`;

const MobileCardWrap = styled.div`
  flex: 0 0 min(260px, 78vw);
  max-width: min(260px, 78vw);
  scroll-snap-align: start;
`;

/** Csak md+ : animált sáv */
const DesktopOnly = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const Viewport = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  overflow-x: clip;
  contain: layout paint;
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
    <Section aria-label="Kiemelt termékek sávja">
      <Head>
        <Title>Kiemeltek</Title>
        <Sub>
          <SubMobile>
            Gördíts vízszintesen a válogatásért – ujjal vagy hüvelykkel
            húzva.
          </SubMobile>
          <SubDesktop>
            Gördülő válogatás – állítsd meg az egeret a kártyán a szünethez.
          </SubDesktop>
        </Sub>
      </Head>

      <MobileStrip>
        <MobileRow>
          {items.map((p) => (
            <MobileCardWrap key={`m-${p.id}`}>
              <ProductCard product={p} compact showCartButton={false} />
            </MobileCardWrap>
          ))}
        </MobileRow>
      </MobileStrip>

      <DesktopOnly>
        <Viewport>
          <Track>
            {loop.map((p, i) => (
              <CardWrap key={`${p.id}-${i}`}>
                <ProductCard product={p} compact showCartButton={false} />
              </CardWrap>
            ))}
          </Track>
        </Viewport>
      </DesktopOnly>
    </Section>
  );
}
