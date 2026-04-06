import { LegalPage } from "./LegalPage";
import { TERMS_DOCUMENT } from "../data/legal";

export function TermsPage() {
  return <LegalPage document={TERMS_DOCUMENT} />;
}
