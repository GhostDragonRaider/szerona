/**
 * Admin útvonal: keresőmotorok indexelésének kizárása; látható tartalom változatlan.
 */
import { Helmet } from "react-helmet-async";

export function AdminSeo() {
  return (
    <Helmet>
      <title>Admin – Serona</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
}
