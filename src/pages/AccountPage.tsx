/**
 * Bejelentkezett felhasználó fiókja: profil, számlázás, kártyák, e-mail, jelszó.
 * Reszponzív: mobilon lapfülek egy sorban, md felett oldalsáv.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { AccountBilling } from "../components/account/AccountBilling";
import { AccountEmail } from "../components/account/AccountEmail";
import { AccountPassword } from "../components/account/AccountPassword";
import { AccountPayment } from "../components/account/AccountPayment";
import { AccountProfile } from "../components/account/AccountProfile";

const Page = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: min(70vh, 100%);
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;

const PageTitle = styled.h1`
  margin: 0;
  padding: ${({ theme }) => theme.space.md} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    0 max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.2rem, 4vw, 1.65rem);
  letter-spacing: 0.06em;
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
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.md} max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  flex-shrink: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    flex-wrap: nowrap;
    width: min(240px, 100%);
    padding: ${({ theme }) => theme.space.md};
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const TabBtn = styled.button<{ active?: boolean }>`
  flex: 1 1 calc(50% - ${({ theme }) => theme.space.sm});
  min-width: min(140px, 100%);
  min-height: 44px;
  padding: ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, active }) =>
      active ? theme.colors.accent : theme.colors.border};
  background: ${({ theme, active }) =>
    active ? theme.colors.accentSoft : "transparent"};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: clamp(0.75rem, 2.6vw, 0.9rem);
  line-height: 1.2;
  cursor: pointer;
  text-align: center;
  &:hover {
    border-color: #000000;
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex: none;
    width: 100%;
    min-width: 0;
    text-align: left;
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    font-size: 0.9rem;
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

export type AccountTab =
  | "profile"
  | "billing"
  | "payment"
  | "email"
  | "password";

export function AccountPage() {
  const [tab, setTab] = useState<AccountTab>("profile");

  return (
    <Page>
      <PageTitle>Fiók</PageTitle>
      <Body>
        <Side role="navigation" aria-label="Fiók menü">
          <TabBtn
            type="button"
            active={tab === "profile"}
            onClick={() => setTab("profile")}
          >
            Profil
          </TabBtn>
          <TabBtn
            type="button"
            active={tab === "billing"}
            onClick={() => setTab("billing")}
          >
            Számlázás
          </TabBtn>
          <TabBtn
            type="button"
            active={tab === "payment"}
            onClick={() => setTab("payment")}
          >
            Fizetés
          </TabBtn>
          <TabBtn
            type="button"
            active={tab === "email"}
            onClick={() => setTab("email")}
          >
            E-mail
          </TabBtn>
          <TabBtn
            type="button"
            active={tab === "password"}
            onClick={() => setTab("password")}
          >
            Jelszó
          </TabBtn>
        </Side>
        <Content>
          {tab === "profile" ? <AccountProfile /> : null}
          {tab === "billing" ? <AccountBilling /> : null}
          {tab === "payment" ? <AccountPayment /> : null}
          {tab === "email" ? <AccountEmail /> : null}
          {tab === "password" ? <AccountPassword /> : null}
        </Content>
      </Body>
    </Page>
  );
}
