/**
 * Serona márka: logó kép + SERONA szójel + tagline; világos/sötét PNG.
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import {
  BRAND_TAGLINE,
  SERONA_LOGO_DARK_PNG,
  SERONA_LOGO_LIGHT_PNG,
} from "../../constants/branding";
import { useThemeMode } from "../../context/ThemeModeContext";

const TAGLINE = BRAND_TAGLINE;

const Wrap = styled(Link)<{ $inline?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  ${({ $inline }) => $inline && `vertical-align: middle;`}
`;

const BrandStack = styled.div<{ $variant: "bar" | "hero" | "footer" }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  gap: ${({ $variant, theme }) =>
    $variant === "hero" ? theme.space.md : theme.space.sm};
`;

const MarkImg = styled.img<{ $variant: "bar" | "hero" | "footer" }>`
  display: block;
  object-fit: contain;
  flex-shrink: 0;
  ${({ $variant, theme }) =>
    $variant === "bar"
      ? `
    width: 80px;
    height: auto;
    @media (min-width: ${theme.breakpoints.sm}) {
      width: 88px;
    }
  `
      : $variant === "footer"
        ? `
    width: 96px;
    height: auto;
    @media (max-width: ${theme.breakpoints.md}) {
      width: 80px;
    }
  `
        : `
    width: min(100%, clamp(320px, 72vw, 520px));
    height: auto;
    @media (max-width: ${theme.breakpoints.sm}) {
      width: min(100%, 280px);
    }
  `}
`;

/** Geometrikus sans, erős betűköz (mint a referencia); 500 = kicsit vékonyabb, mint a korábbi 700. */
const Wordmark = styled.span<{ $variant: "bar" | "hero" | "footer" }>`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 500;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.42em;
  line-height: 1.15;
  color: ${({ theme }) => theme.colors.text};
  ${({ $variant, theme }) =>
    $variant === "bar"
      ? `
    font-size: clamp(0.68rem, 2vw, 0.82rem);
    letter-spacing: 0.32em;
    color: ${theme.colors.headerText};
  `
      : $variant === "footer"
        ? `
    font-size: clamp(0.88rem, 1.8vw, 1rem);
    letter-spacing: 0.38em;
  `
        : `
    font-size: clamp(1.15rem, 3.8vw, 1.55rem);
    letter-spacing: 0.48em;
    @media (max-width: ${theme.breakpoints.sm}) {
      font-size: 1rem;
      letter-spacing: 0.36em;
    }
  `}
`;

const MicroTagline = styled.span<{ $variant: "bar" | "hero" | "footer" }>`
  display: block;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 400;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  width: 100%;
  margin: 0;
  padding: 0 ${({ theme }) => theme.space.xs};
  box-sizing: border-box;
  ${({ $variant, theme }) =>
    $variant === "bar"
      ? `
    font-size: clamp(0.5rem, 1.35vw, 0.625rem);
    max-width: 14rem;
    letter-spacing: 0.02em;
    color: ${theme.colors.headerTextMuted};
  `
      : $variant === "footer"
        ? `
    font-size: 0.8125rem;
    max-width: min(100%, 20rem);
    letter-spacing: 0.03em;
  `
        : `
    font-size: clamp(0.78rem, 1.85vw, 0.92rem);
    max-width: min(100%, 22rem);
    letter-spacing: 0.04em;
    @media (max-width: ${theme.breakpoints.sm}) {
      font-size: 0.74rem;
      max-width: 18rem;
    }
  `}
`;

const HeroLogoLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: min(100%, 520px);
  margin-inline: auto;
  text-decoration: none;
  color: inherit;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: min(100%, 320px);
  }
`;

interface LogoProps {
  /** Fejléc közepe: kisméretű. */
  variant?: "bar" | "hero" | "footer";
  /** Csak az S-jel (nav bar), SERONA és tagline nélkül. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({
  variant = "bar",
  markOnly = false,
  className,
}: LogoProps) {
  const { mode } = useThemeMode();
  const onDarkSurface = mode === "dark";
  const markSrc = onDarkSurface ? SERONA_LOGO_DARK_PNG : SERONA_LOGO_LIGHT_PNG;
  const inline = variant === "footer";

  const stack = (
    <BrandStack $variant={variant}>
      <MarkImg
        src={markSrc}
        alt=""
        decoding="async"
        $variant={variant}
        {...(variant === "hero"
          ? { fetchPriority: "high" as const }
          : {})}
      />
      {markOnly ? null : (
        <>
          <Wordmark $variant={variant}>SERONA</Wordmark>
          <MicroTagline $variant={variant}>{TAGLINE}</MicroTagline>
        </>
      )}
    </BrandStack>
  );

  if (variant === "hero") {
    return (
      <HeroLogoLink to="/" className={className} aria-label="Serona kezdőlap">
        {stack}
      </HeroLogoLink>
    );
  }

  return (
    <Wrap
      to="/"
      className={className}
      $inline={inline}
      aria-label="Serona kezdőlap"
    >
      {stack}
    </Wrap>
  );
}
