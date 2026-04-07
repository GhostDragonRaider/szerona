/**
 * Főoldali hős szekció: márkalogó, alcím, CTA a bolt felé.
 * Az alcím a SettingsContext-ből jön (admin módosíthatja).
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { Logo } from "../branding/Logo";
import { useSettings } from "../../context/SettingsContext";

const Section = styled.section`
  position: relative;
  overflow: hidden;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md}
    ${({ theme }) => theme.space.xl};
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    padding-top: calc(
      56px + env(safe-area-inset-top, 0px) + ${({ theme }) => theme.space.md}
    );
    padding-bottom: ${({ theme }) => theme.space.lg};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) and (max-width: ${({
      theme,
    }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    padding-top: calc(
      56px + env(safe-area-inset-top, 0px) + ${({ theme }) => theme.space.xl}
    );
    padding-left: ${({ theme }) => theme.space.lg};
    padding-right: ${({ theme }) => theme.space.lg};
    padding-bottom: ${({ theme }) => theme.space.xxl};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 5rem ${({ theme }) => theme.space.lg} 6rem;
  }
`;

const Inner = styled.div`
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
`;

/** Logó és alcím – középre igazítva */
const HeroLead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.lg};
  width: 100%;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.md};
  }
`;

const HeroBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.xl};
  width: 100%;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.lg};
  }
`;

/** Logó a h1-ben – lejjebb tolva a fejléc alatt, teljes szélesség + középre */
const HeroBrandHeading = styled.h1`
  margin: ${({ theme }) => theme.space.md} 0 0;
  padding: 0;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-top: ${({ theme }) => theme.space.sm};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    margin-top: ${({ theme }) => theme.space.xxl};
  }
  width: 100%;
  line-height: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Sub = styled.p`
  margin: 0;
  max-width: 520px;
  width: 100%;
  text-align: center;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: 20rem;
    font-size: 1.02rem;
    line-height: 1.5;
  }
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.space.md};
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.sm};
  }
`;

/** Közös CTA: Kollekció / Belépés jellegű szegélyes, felületi gomb */
const CtaBase = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 2px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  transition: none;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
    font-size: 0.88rem;
  }
  @media (hover: hover) {
    &:hover {
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      border-color: ${({ theme }) => theme.colors.text};
      color: ${({ theme }) => theme.colors.bg};
      background: ${({ theme }) => theme.colors.text};
    }
  }
`;

const Cta = CtaBase;
const CtaGhost = CtaBase;

export function HeroSection() {
  const { settings } = useSettings();

  return (
    <Section>
      <Inner>
        <HeroBlock>
          <HeroLead>
            <HeroBrandHeading>
              <Logo variant="hero" />
            </HeroBrandHeading>
            <Sub>{settings.heroSubtitle}</Sub>
          </HeroLead>
          <CtaRow>
            <Cta to="/shop">Vásárlás most</Cta>
            <CtaGhost to="/shop">Kollekció</CtaGhost>
          </CtaRow>
        </HeroBlock>
      </Inner>
    </Section>
  );
}
