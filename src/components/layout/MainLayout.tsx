/**
 * Fő vázlat: fejléc, tartalom (Outlet), lábléc; modális belépés/regisztráció állapota itt van.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartDrawer } from "../cart/CartDrawer";
import { LoginModal } from "../auth/LoginModal";
import { RegisterModal } from "../auth/RegisterModal";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";

const Shell = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.fonts.body};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  overflow-x: hidden;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  min-width: 0;
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  &[data-mobile-header-pad="true"] {
    @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
      padding-top: calc(52px + env(safe-area-inset-top, 0px));
    }
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding-bottom: 0;
    padding-top: 0;
  }
`;

export function MainLayout() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Shell>
      <Header
        onOpenLogin={() => setLoginOpen(true)}
        onOpenRegister={() => setRegisterOpen(true)}
      />
      <Main data-mobile-header-pad={pathname !== "/" ? "true" : undefined}>
        <Outlet />
      </Main>
      <Footer />
      <MobileBottomNav onOpenLogin={() => setLoginOpen(true)} />
      <CartDrawer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </Shell>
  );
}
