/**
 * Admin útvonal: keresőmotorok indexelésének kizárása; látható tartalom változatlan.
 */
import { Helmet } from "react-helmet-async";

export function AdminSeo() {
  return (
    <Helmet>
      <title>Admin – Serona</title>
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="bingbot" content="noindex, nofollow" />
      <meta name="theme-color" content="#050505" />
    </Helmet>
  );
}
