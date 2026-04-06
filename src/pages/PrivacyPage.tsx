import { PRIVACY_DOCUMENT } from "../data/legal";
import { LegalPage } from "./LegalPage";

export function PrivacyPage() {
  return <LegalPage document={PRIVACY_DOCUMENT} />;
}
