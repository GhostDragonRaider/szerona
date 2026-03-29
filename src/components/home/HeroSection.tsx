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
  background: ${({ theme }) => theme.colors.gradientHero};
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg}
      ${({ theme }) => theme.space.xxl};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 5rem ${({ theme }) => theme.space.lg} 6rem;
  }
`;

const Glow = styled.div`
  position: absolute;
  width: 60%;
  max-width: 500px;
  height: 400px;
  top: -100px;
  right: -80px;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.accentSoft} 0%,
    transparent 70%
  );
  pointer-events: none;
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
`;

const HeroBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.xl};
  width: 100%;
`;

/** Logó a h1-ben – lejjebb tolva a fejléc alatt, teljes szélesség + középre */
const HeroBrandHeading = styled.h1`
  margin: ${({ theme }) => theme.space.xxl} 0 0;
  padding: 0;
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
`;

const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.space.md};
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
  transition: border-color 0.2s, color 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const Cta = CtaBase;
const CtaGhost = CtaBase;

export function HeroSection() {
  const { settings } = useSettings();
  return (
    <Section>
      <Glow />
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
