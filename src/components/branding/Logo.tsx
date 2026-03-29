/**
 * Serona márkalogó: alap/helyzet nélkül `SERONA_LOGO_PNG` maszk + gradient;
 * hero: nagy PNG; lábléc: világos módban fekete PNG, sötétben fehér PNG.
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import {
  SERONA_LOGO_DARK_PNG,
  SERONA_LOGO_PNG,
} from "../../constants/branding";
import { useThemeMode } from "../../context/ThemeModeContext";

const Wrap = styled(Link)<{ $inline?: boolean }>`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  ${({ $inline }) => $inline && `vertical-align: middle;`}
`;

const Mark = styled.div<{ $variant: "default" | "compact" | "footer" }>`
  flex-shrink: 0;
  display: block;
  background: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.accent}, #f97316)`};
  -webkit-mask-image: url(${SERONA_LOGO_PNG});
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-image: url(${SERONA_LOGO_PNG});
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  ${({ $variant, theme }) =>
    $variant === "footer"
      ? `
    width: 52px;
    height: calc(52px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 44px;
      height: calc(44px * 338 / 401);
    }
  `
      : $variant === "compact"
        ? `
    width: 100px;
    height: calc(100px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 88px;
      height: calc(88px * 338 / 401);
    }
  `
        : `
    width: 148px;
    height: calc(148px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 128px;
      height: calc(128px * 338 / 401);
    }
  `}
`;

/** Sötét mód: ugyanaz a méret, raszteres PNG (nem gradient maszk). */
const LogoRaster = styled.img<{ $variant: "default" | "compact" | "footer" }>`
  flex-shrink: 0;
  display: block;
  object-fit: contain;
  ${({ $variant, theme }) =>
    $variant === "footer"
      ? `
    width: 52px;
    height: calc(52px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 44px;
      height: calc(44px * 338 / 401);
    }
  `
      : $variant === "compact"
        ? `
    width: 100px;
    height: calc(100px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 88px;
      height: calc(88px * 338 / 401);
    }
  `
        : `
    width: 148px;
    height: calc(148px * 338 / 401);
    @media (max-width: ${theme.breakpoints.md}) {
      width: 128px;
      height: calc(128px * 338 / 401);
    }
  `}
`;

/** Hero: teljes szélességű sorban középre igazított link + kép */
const HeroLogoLink = styled(Link)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: min(100%, 560px);
  margin-inline: auto;
  text-decoration: none;
  color: inherit;
`;

/** Hero: valódi kép, fix képarány */
const HeroImg = styled.img`
  display: block;
  width: min(100%, clamp(260px, 52vw, 560px));
  height: auto;
  object-fit: contain;
  margin-inline: auto;
`;

interface LogoProps {
  /** Ha false, kisebb méret (a kép továbbra is teljes logó: ikon + felirat). */
  showText?: boolean;
  /** Lábléc / szövegköz: kisméretű; hero: főoldali hős szekció nagy logója. */
  variant?: "default" | "footer" | "hero";
  className?: string;
}

export function Logo({ showText = true, variant = "default", className }: LogoProps) {
  const { mode } = useThemeMode();
  const darkLogo = mode === "dark";
  const logoSrc = darkLogo ? SERONA_LOGO_DARK_PNG : SERONA_LOGO_PNG;
  const markVariant: "default" | "compact" | "footer" =
    variant === "footer"
      ? "footer"
      : showText
        ? "default"
        : "compact";
  const inline = variant === "footer";

  if (variant === "hero") {
    return (
      <HeroLogoLink to="/" className={className} aria-label="Serona kezdőlap">
        <HeroImg
          src={logoSrc}
          alt=""
          width={401}
          height={338}
          decoding="async"
          fetchPriority="high"
        />
      </HeroLogoLink>
    );
  }

  /** Lábléc: mindig raszter – világos mód fekete logó, sötét mód fehér logó. */
  if (variant === "footer") {
    const footerSrc = darkLogo ? SERONA_LOGO_DARK_PNG : SERONA_LOGO_PNG;
    return (
      <Wrap to="/" className={className} $inline aria-label="Serona kezdőlap">
        <LogoRaster
          $variant="footer"
          src={footerSrc}
          alt=""
          decoding="async"
        />
      </Wrap>
    );
  }

  return (
    <Wrap to="/" className={className} $inline={inline} aria-label="Serona kezdőlap">
      {darkLogo ? (
        <LogoRaster
          $variant={markVariant}
          src={SERONA_LOGO_DARK_PNG}
          alt=""
          decoding="async"
        />
      ) : (
        <Mark $variant={markVariant} role="img" aria-hidden />
      )}
    </Wrap>
  );
}
