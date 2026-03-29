/**
 * Admin felület: oldalsó menü (termékek / általános), csak admin szerepkörrel elérhető.
 * Termékkezelés: csoportonkénti szűrés, lista, törlés, szerkesztés, új termék.
 * Általános: jelszó, hero szövegek, színek, szekciók láthatósága.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminSeo } from "../seo/AdminSeo";
import { ThemeToggle } from "../layout/ThemeToggle";
import { AdminProducts } from "./AdminProducts";
import { AdminSettings } from "./AdminSettings";

const Page = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;

const Top = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} max(${({ theme }) => theme.space.sm}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.sm} max(${({ theme }) => theme.space.sm}, env(safe-area-inset-right, 0px));
  padding-top: max(${({ theme }) => theme.space.sm}, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.md};
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
    padding-left: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-left, 0px));
    padding-right: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-right, 0px));
  }
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
  justify-content: flex-end;
  min-width: 0;
  flex-shrink: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.md};
  }
`;

const BackLink = styled(Link)`
  font-size: clamp(0.8rem, 3.5vw, 0.9rem);
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

const BackLabelLong = styled.span`
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const BackLabelShort = styled.span`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: inline;
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
  }
`;

const Side = styled.aside`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.md} max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  flex-shrink: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    flex-wrap: nowrap;
    width: min(220px, 100%);
    padding: ${({ theme }) => theme.space.md};
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const TabBtn = styled.button<{ active?: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, active }) =>
      active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, active }) =>
    active ? theme.colors.accentSoft : "transparent"};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: clamp(0.78rem, 2.8vw, 0.95rem);
  line-height: 1.25;
  cursor: pointer;
  text-align: center;
  &:hover {
    border-color: #000000;
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex: none;
    width: 100%;
    text-align: left;
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    font-size: 0.95rem;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.space.sm} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.md} max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  overflow: auto;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.lg};
    padding-left: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-left, 0px));
    padding-right: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-right, 0px));
  }
`;

export type AdminTab = "products" | "settings";

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("products");

  return (
    <Page>
      <AdminSeo />
      <Top>
        <TopRight>
          <ThemeToggle />
          <BackLink to="/" title="Vissza a webshopba">
            <BackLabelLong>← Vissza a webshopba</BackLabelLong>
            <BackLabelShort>← Webshop</BackLabelShort>
          </BackLink>
        </TopRight>
      </Top>
      <Body>
        <Side role="navigation" aria-label="Admin menü">
          <TabBtn
            type="button"
            active={tab === "products"}
            onClick={() => setTab("products")}
          >
            Termékek kezelése
          </TabBtn>
          <TabBtn
            type="button"
            active={tab === "settings"}
            onClick={() => setTab("settings")}
          >
            Általános beállítások
          </TabBtn>
        </Side>
        <Content>
          {tab === "products" ? <AdminProducts /> : <AdminSettings />}
        </Content>
      </Body>
    </Page>
  );
}
