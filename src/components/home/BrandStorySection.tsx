/**
 * Márkatörténet sáv: section.png háttér, szöveg bal alsó, CTA – referencia elrendezés.
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";

const Outer = styled.div`
  width: 100%;
  margin: 0 0 ${({ theme }) => theme.space.xl};
  padding: 0;
`;

const Banner = styled.section`
  position: relative;
  width: 100%;
  margin: 0;
  overflow: hidden;
  min-height: min(72vh, 560px);
  background-color: ${({ theme }) => theme.colors.surfaceElevated};
  background-image: url("/section.png");
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  border-radius: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-height: 380px;
    border-radius: ${({ theme }) => theme.radii.lg};
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    min-height: 420px;
  }
`;

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(0, 0, 0, 0.88) 0%,
    rgba(0, 0, 0, 0.5) 45%,
    rgba(0, 0, 0, 0.15) 100%
  );
  pointer-events: none;
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  box-sizing: border-box;
  min-height: min(72vh, 560px);
  padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.md}
    clamp(2rem, 8vw, 3.5rem);
  max-width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-height: 380px;
    padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg}
      clamp(2.25rem, 5vw, 3rem);
    max-width: min(46%, 480px);
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    min-height: 420px;
    max-width: min(44%, 500px);
  }
`;

const Headline = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(2.4rem, 8.4vw, 3.1rem);
  font-weight: 500;
  line-height: 1.32;
  letter-spacing: 0.01em;
  color: #ffffff;
  text-align: left;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.55);
`;

const Brand = styled.strong`
  display: inline;
  font-weight: 800;
  font-size: 1.12em;
  letter-spacing: 0.06em;
`;

const Cta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  color: #000000;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: clamp(0.68rem, 2vw, 0.82rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.2s ease;
  @media (hover: hover) {
    &:hover {
      background: #f0f0f0;
    }
  }
`;

export function BrandStorySection() {
  return (
    <Outer>
      <Banner aria-label="Serona márkaüzenet">
        <Scrim />
        <Inner>
          <Headline>
            <Brand>SERONA</Brand> nem egy
            <br />
            márka. Ez egy új
            <br />
            irány.
          </Headline>
          <Cta to="/shop">Kollekció megnézése</Cta>
        </Inner>
      </Banner>
    </Outer>
  );
}
