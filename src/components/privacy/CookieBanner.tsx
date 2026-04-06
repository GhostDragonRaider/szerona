import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { useCookieConsent } from "../../context/CookieConsentContext";

const Bar = styled.aside`
  position: fixed;
  left: 50%;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  z-index: 1200;
  width: min(960px, calc(100vw - 24px));
  transform: translateX(-50%);
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    bottom: ${({ theme }) => theme.space.lg};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`;

const LegalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
`;

const ActionButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  min-height: 44px;
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

export function CookieBanner() {
  const {
    acceptAll,
    acceptNecessaryOnly,
    isBannerOpen,
    isPreferencesOpen,
    openPreferences,
  } = useCookieConsent();

  if (!isBannerOpen || isPreferencesOpen) return null;

  return (
    <Bar aria-live="polite" aria-label="Sütibeállítások">
      <Content>
        <div>
          <Title>Sütik és helyi tárolás kezelése</Title>
          <Description>
            A Serona a működéshez szükséges sütiket és helyi tárolókat használ a
            biztonságos belépéshez, a kosár megőrzéséhez és a rendelési
            folyamat fenntartásához. A kényelmi, analitikai és marketing célú
            technológiákat csak a hozzájárulásoddal aktiváljuk. A részleteket a{" "}
            <LegalLink to="/suti-tajekoztato">Sütitájékoztatóban</LegalLink>{" "}
            találod.
          </Description>
        </div>
        <Actions>
          <ActionButton type="button" onClick={acceptNecessaryOnly}>
            Csak szükséges
          </ActionButton>
          <ActionButton type="button" onClick={openPreferences}>
            Beállítások
          </ActionButton>
          <ActionButton type="button" $variant="primary" onClick={acceptAll}>
            Összes elfogadása
          </ActionButton>
        </Actions>
      </Content>
    </Bar>
  );
}
