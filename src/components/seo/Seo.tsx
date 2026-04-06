/**
 * Útvonalankénti SEO meta: title, leírás, canonical, OG/Twitter és strukturált adatok.
 * A látható oldaltartalom változatlan marad; csak a dokumentum fejléce frissül.
 */
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { BRAND_TAGLINE, SERONA_LOGO_LIGHT_PNG } from "../../constants/branding";

const SITE_NAME = "Serona";
const DEFAULT_DESCRIPTION =
  "Serona – prémium utcai divat webáruház egyedi streetwear darabokkal, gondosan válogatott kollekciókkal és gyors rendelési folyamattal.";
const THEME_COLOR = "#050505";
const OG_IMAGE_WIDTH = 1536;
const OG_IMAGE_HEIGHT = 1024;

type SeoRouteMeta = {
  title: string;
  description: string;
  schemaType: "WebPage" | "CollectionPage";
  breadcrumbLabel: string;
};

const ROUTE_META: Record<string, SeoRouteMeta> = {
  "/": {
    title: "Serona – Prémium utcai divat webáruház",
    description: DEFAULT_DESCRIPTION,
    schemaType: "WebPage",
    breadcrumbLabel: "Kezdőlap",
  },
  "/shop": {
    title: "Bolt – Serona streetwear kollekciók",
    description:
      "Böngészd a Serona bolt streetwear kollekcióit: pólók, pulóverek, nadrágok és cipők modern, prémium válogatásban.",
    schemaType: "CollectionPage",
    breadcrumbLabel: "Bolt",
  },
  "/account": {
    title: "Fiók – Serona",
    description:
      "Serona fiók: személyes adatok, rendeléskövetés és mentett beállítások kezelése.",
    schemaType: "WebPage",
    breadcrumbLabel: "Fiók",
  },
  "/checkout": {
    title: "Pénztár – Serona",
    description:
      "Serona pénztár: szállítási adatok, fizetési mód és rendelés véglegesítése biztonságos ellenőrzéssel.",
    schemaType: "WebPage",
    breadcrumbLabel: "Pénztár",
  },
  "/verify-email": {
    title: "E-mail megerősítése – Serona",
    description:
      "Serona-fiók e-mail-címének megerősítése biztonságos aktiváló linken keresztül.",
    schemaType: "WebPage",
    breadcrumbLabel: "E-mail megerősítése",
  },
  "/reset-password": {
    title: "Jelszó visszaállítása – Serona",
    description:
      "Serona-fiók jelszavának visszaállítása biztonságos tokenes folyamattal.",
    schemaType: "WebPage",
    breadcrumbLabel: "Jelszó visszaállítása",
  },
  "/aszf": {
    title: "ÁSZF – Serona",
    description:
      "A Serona webáruház általános szerződési feltételei, vásárlási szabályai és szolgáltatási feltételei.",
    schemaType: "WebPage",
    breadcrumbLabel: "ÁSZF",
  },
  "/suti-tajekoztato": {
    title: "Sütitájékoztató – Serona",
    description:
      "A Serona webáruház sütitájékoztatója, a sütikategóriák, hozzájárulási beállítások és technikai tárolások részletei.",
    schemaType: "WebPage",
    breadcrumbLabel: "Sütitájékoztató",
  },
  "/adatkezelesi-tajekoztato": {
    title: "Adatkezelési tájékoztató – Serona",
    description:
      "A Serona webáruház adatkezelési tájékoztatója, GDPR-információi és adatkezelési alapelvei.",
    schemaType: "WebPage",
    breadcrumbLabel: "Adatkezelési tájékoztató",
  },
};

function siteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function buildCanonical(origin: string, pathname: string) {
  return `${origin}${pathname === "/" ? "/" : pathname}`;
}

function buildBreadcrumbItems(origin: string, pathname: string, meta: SeoRouteMeta) {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Kezdőlap",
      item: `${origin}/`,
    },
  ];

  if (pathname !== "/") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: meta.breadcrumbLabel,
      item: buildCanonical(origin, pathname),
    });
  }

  return items;
}

function buildStructuredData(origin: string, pathname: string, meta: SeoRouteMeta) {
  const canonical = buildCanonical(origin, pathname);
  const orgId = `${origin}/#organization`;
  const siteId = `${origin}/#website`;
  const pageId = `${canonical}#webpage`;
  const logoUrl = `${origin}${SERONA_LOGO_LIGHT_PNG}`;
  const breadcrumbItems = buildBreadcrumbItems(origin, pathname, meta);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: SITE_NAME,
      url: `${origin}/`,
      slogan: BRAND_TAGLINE,
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
      name: SITE_NAME,
      url: `${origin}/`,
      description: DEFAULT_DESCRIPTION,
      inLanguage: "hu-HU",
      publisher: { "@id": orgId },
    },
    {
      "@type": meta.schemaType,
      "@id": pageId,
      name: meta.title,
      url: canonical,
      description: meta.description,
      inLanguage: "hu-HU",
      isPartOf: { "@id": siteId },
      about: { "@id": orgId },
      breadcrumb:
        breadcrumbItems.length > 1 ? { "@id": `${canonical}#breadcrumb` } : undefined,
      ...(pathname === "/shop"
        ? {
            mainEntity: {
              "@type": "OfferCatalog",
              name: "Serona bolt",
              url: canonical,
            },
          }
        : {}),
    },
  ];

  if (breadcrumbItems.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function Seo() {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname);
  const meta = ROUTE_META[pathname] ?? ROUTE_META["/"];
  const origin = siteOrigin();
  const canonical = origin ? buildCanonical(origin, pathname) : "";
  const ogImage = origin ? `${origin}${SERONA_LOGO_LIGHT_PNG}` : "";
  const noIndexPaths = new Set([
    "/account",
    "/checkout",
    "/verify-email",
    "/reset-password",
  ]);
  const robotsContent = noIndexPaths.has(pathname)
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const structuredData =
    canonical && !noIndexPaths.has(pathname)
      ? buildStructuredData(origin, pathname, meta)
      : null;

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: "hu" }}>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="bingbot" content={robotsContent} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      <meta name="theme-color" content={THEME_COLOR} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta
        name="format-detection"
        content="telephone=no, address=no, email=no"
      />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {canonical ? <link rel="alternate" hrefLang="hu-HU" href={canonical} /> : null}
      {canonical ? <link rel="alternate" hrefLang="x-default" href={canonical} /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="hu_HU" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? <meta property="og:image:secure_url" content={ogImage} /> : null}
      {ogImage ? <meta property="og:image:type" content="image/png" /> : null}
      {ogImage ? <meta property="og:image:alt" content="Serona logó" /> : null}
      {ogImage ? (
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      ) : null}
      {ogImage ? (
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      ) : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      {ogImage ? <meta name="twitter:image:alt" content="Serona logó" /> : null}

      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
    </Helmet>
  );
}
