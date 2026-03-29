/**
 * Útvonalankénti head meta (title, leírás, canonical, OG/Twitter), kezdőlapon JSON-LD.
 * A látható oldaltartalom nem módosul; csak a dokumentum fejléce.
 */
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const DEFAULT_DESCRIPTION = "Serona – prémium utcai divat webáruház";

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
};

function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function jsonLdWebSite(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Serona",
    url: `${origin}/`,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "hu-HU",
    publisher: {
      "@type": "Organization",
      name: "Serona",
      url: `${origin}/`,
      logo: {
        "@type": "ImageObject",
        url: `${origin}/serona-logo.png`,
      },
    },
  };
}

export function Seo() {
  const { pathname } = useLocation();
  const key = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const meta = ROUTE_META[key] ?? ROUTE_META["/"];
  const origin = siteOrigin();
  const canonical = origin ? `${origin}${pathname === "/" ? "/" : pathname}` : "";
  const ogImage = origin ? `${origin}/serona-logo.png` : "";

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: "hu" }}>
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
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      {canonical ? (
        <link rel="alternate" hrefLang="hu" href={canonical} />
      ) : null}
      {pathname === "/" && origin ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdWebSite(origin))}
        </script>
      ) : null}
    </Helmet>
  );
}
