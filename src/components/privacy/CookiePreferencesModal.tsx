import styled from "@emotion/styled";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useCookieConsent } from "../../context/CookieConsentContext";
import type { CookieConsentOptionalCategory } from "../../lib/cookieConsent";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: ${({ theme }) => theme.colors.overlay};
`;

const Dialog = styled.section`
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 1301;
  width: min(760px, calc(100vw - 24px));
  max-height: min(88vh, 860px);
  overflow-y: auto;
  transform: translate(-50%, -50%);
  padding: ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 700;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.1;
`;

const Description = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.75;
`;

const CloseButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
`;

const SectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const SectionCard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.xs};
  font-size: 1rem;
`;

const SectionText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`;

const Toggle = styled.button<{ $enabled: boolean; $disabled?: boolean }>`
  position: relative;
  width: 60px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: ${({ theme, $enabled }) =>
    $enabled ? theme.colors.accent : theme.colors.border};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  opacity: ${({ $disabled }) => ($disabled ? 0.85 : 1)};
  transition: background 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    top: 4px;
    left: ${({ $enabled }) => ($enabled ? "30px" : "4px")};
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surface};
    transition: left 0.2s ease;
  }
`;

const Note = styled.p`
  margin: ${({ theme }) => `${theme.space.lg} 0 0`};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`;

const InlineLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.xl};
`;

const ActionButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  min-height: 46px;
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $variant }) =>
      $variant === "primary" ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, $variant }) =>
    $variant === "primary" ? theme.colors.accent : "transparent"};
  color: ${({ theme, $variant }) =>
    $variant === "primary" ? theme.colors.onAccent : theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  cursor: pointer;
`;

const sections: Array<{
  key: "necessary" | CookieConsentOptionalCategory;
  title: string;
  description: string;
  disabled?: boolean;
}> = [
  {
    key: "necessary",
    title: "Elengedhetetlen sütik és technikai tárolás",
    description:
      "A biztonságos belépéshez, a kosár megőrzéséhez, a rendelési folyamat fenntartásához és a választásod eltárolásához szükséges.",
    disabled: true,
  },
  {
    key: "preferences",
    title: "Funkcionális és kényelmi tárolás",
    description:
      "A felhasználói kényelmet szolgáló beállításokat, például a később bevezetett személyre szabási és megjelenítési preferenciákat tárolja.",
  },
  {
    key: "analytics",
    title: "Analitikai sütik",
    description:
      "A látogatottsági és használati adatok méréséhez kapcsolhatók be. Jelenleg nincsenek aktív analitikai sütik, de a hozzájárulásodat előre rögzítjük a későbbi bővíthetőséghez.",
  },
  {
    key: "marketing",
    title: "Marketing sütik",
    description:
      "Hirdetési, remarketing és kampánymérési technológiákhoz szükségesek. Jelenleg nincsenek aktív marketing sütik, ez a beállítás a jövőbeni aktiválást szabályozza.",
  },
];

export function CookiePreferencesModal() {
  const {
    acceptAll,
    acceptNecessaryOnly,
    closePreferences,
    draftPreferences,
    isPreferencesOpen,
    savePreferences,
    setDraftPreference,
  } = useCookieConsent();

  if (!isPreferencesOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      <Overlay onClick={closePreferences} aria-hidden="true" />
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preferences-title"
      >
        <TopRow>
          <TitleWrap>
            <Eyebrow>Adatvédelem</Eyebrow>
            <Title id="cookie-preferences-title">Sütibeállítások</Title>
          </TitleWrap>
          <CloseButton
            type="button"
            onClick={closePreferences}
            aria-label="Sütibeállítások bezárása"
          >
            ×
          </CloseButton>
        </TopRow>
        <Description>
          Itt döntheted el, hogy a Serona milyen nem kötelező technológiákat
          használhat a böngészésed során. A részletes kategóriákat és
          adatkezelési információkat a{" "}
          <InlineLink to="/suti-tajekoztato">Sütitájékoztatóban</InlineLink>{" "}
          találod.
        </Description>

        <SectionList>
          {sections.map((section) => {
            const enabled =
              section.key === "necessary"
                ? true
                : draftPreferences[section.key];

            return (
              <SectionCard key={section.key}>
                <div>
                  <SectionTitle>{section.title}</SectionTitle>
                  <SectionText>{section.description}</SectionText>
                </div>
                <Toggle
                  type="button"
                  aria-pressed={enabled}
                  aria-label={`${section.title} ${
                    enabled ? "bekapcsolva" : "kikapcsolva"
                  }`}
                  $enabled={enabled}
                  $disabled={section.disabled}
                  onClick={() => {
                    if (section.disabled || section.key === "necessary") return;
                    setDraftPreference(section.key, !enabled);
                  }}
                />
              </SectionCard>
            );
          })}
        </SectionList>

        <Note>
          A hozzájárulási döntésedet a böngészőben sütiben tároljuk 180 napig,
          és bármikor módosíthatod a láblécben található Sütibeállítások
          gombbal.
        </Note>

        <Actions>
          <ActionButton type="button" onClick={acceptNecessaryOnly}>
            Csak szükséges
          </ActionButton>
          <ActionButton type="button" onClick={savePreferences}>
            Beállítások mentése
          </ActionButton>
          <ActionButton type="button" $variant="primary" onClick={acceptAll}>
            Összes elfogadása
          </ActionButton>
        </Actions>
      </Dialog>
    </>,
    document.body,
  );
}
