/**
 * Útvonalankénti head meta (title, leírás, canonical, OG/Twitter), kezdőlapon JSON-LD.
 * A látható oldaltartalom nem módosul; csak a dokumentum fejléce.
 */
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SERONA_LOGO_LIGHT_PNG } from "../../constants/branding";

const DEFAULT_DESCRIPTION = "Serona – prémium utcai divat webáruház";

/** A serona-logo-light.png képaránya (OG / JSON-LD). */
const OG_IMAGE_WIDTH = 1536;
const OG_IMAGE_HEIGHT = 1024;

const ROUTE_META: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "Serona",
    description: DEFAULT_DESCRIPTION,
  },
  "/shop": {
    title: "Bolt – Serona",
    description:
      "Serona bolt: prémium utcai divat, ruházat és kiegészítők böngészése.",
  },
  "/account": {
    title: "Fiók – Serona",
    description:
      "Serona fiók: beállítások és személyes adatok kezelése.",
  },
  "/checkout": {
    title: "Fizetés – Serona",
    description:
      "Serona pénztár: szállítási adatok, fizetési mód és rendelés összegzése.",
  },
};

function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function jsonLdHome(origin: string) {
  const orgId = `${origin}/#organization`;
  const siteId = `${origin}/#website`;
  const logoUrl = `${origin}${SERONA_LOGO_LIGHT_PNG}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: "Serona",
        url: `${origin}/`,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
        },
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        name: "Serona",
        url: `${origin}/`,
        description: DEFAULT_DESCRIPTION,
        inLanguage: "hu-HU",
        publisher: { "@id": orgId },
      },
    ],
  };
}

export function Seo() {
  const { pathname } = useLocation();
  const key =
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const meta = ROUTE_META[key] ?? ROUTE_META["/"];
  const origin = siteOrigin();
  const canonical = origin
    ? `${origin}${pathname === "/" ? "/" : pathname}`
    : "";
  const ogImage = origin ? `${origin}${SERONA_LOGO_LIGHT_PNG}` : "";

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: "hu" }}>
      <meta name="robots" content="index, follow" />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Serona" />
      <meta property="og:locale" content="hu_HU" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? (
        <meta property="og:image:alt" content="Serona logó" />
      ) : null}
      {ogImage ? (
        <meta
          property="og:image:width"
          content={String(OG_IMAGE_WIDTH)}
        />
      ) : null}
      {ogImage ? (
        <meta
          property="og:image:height"
          content={String(OG_IMAGE_HEIGHT)}
        />
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      {canonical ? (
        <link rel="alternate" hrefLang="hu" href={canonical} />
      ) : null}
      {canonical ? (
        <link rel="alternate" hrefLang="x-default" href={canonical} />
      ) : null}
      {pathname === "/" && origin ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdHome(origin))}
        </script>
      ) : null}
    </Helmet>
  );
}
