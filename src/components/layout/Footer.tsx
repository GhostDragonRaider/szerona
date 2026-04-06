/**
 * Lábléc: bevezető szöveg, jogi sor (logó nélkül).
 */
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import { useCookieConsent } from "../../context/CookieConsentContext";

const Foot = styled.footer`
  margin-top: auto;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.md};
  padding-bottom: max(${({ theme }) => theme.space.md}, env(safe-area-inset-bottom, 0px));
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.lg} ${({ theme }) => theme.space.lg};
  }
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

const Tagline = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  max-width: 48rem;
  width: 100%;
`;

const Copy = styled.p`
  margin: 0;
  width: 100%;
  font-size: 0.75rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

const LegalRow = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
`;

const LegalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  font-size: 0.82rem;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const LegalButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.82rem;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export function Footer() {
  const { openPreferences } = useCookieConsent();
  const year = new Date().getFullYear();
  return (
    <Foot>
      <Inner>
        <Tagline>
          Prémium utcai divat. Minőségi anyagok, merész sziluettek – a Serona a
          mindennapi önkifejezésedhez készült.
        </Tagline>
        <LegalRow aria-label="Jogi linkek">
          <LegalLink to="/aszf">Általános Szerződési Feltételek</LegalLink>
          <LegalLink to="/suti-tajekoztato">Sütitájékoztató</LegalLink>
          <LegalLink to="/adatkezelesi-tajekoztato">
            Adatkezelési tájékoztató
          </LegalLink>
          <LegalButton type="button" onClick={openPreferences}>
            Sütibeállítások
          </LegalButton>
        </LegalRow>
        <Copy>© {year} Serona. Minden jog fenntartva.</Copy>
      </Inner>
    </Foot>
  );
}
