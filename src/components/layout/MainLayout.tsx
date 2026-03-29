/**
 * Fő vázlat: fejléc, tartalom (Outlet), lábléc; modális belépés/regisztráció állapota itt van.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { CartDrawer } from "../cart/CartDrawer";
import { LoginModal } from "../auth/LoginModal";
import { RegisterModal } from "../auth/RegisterModal";
import { Footer } from "./Footer";
import { Header } from "./Header";

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
`;

export function MainLayout() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <Shell>
      <Header
        onOpenLogin={() => setLoginOpen(true)}
        onOpenRegister={() => setRegisterOpen(true)}
      />
      <Main>
        <Outlet />
      </Main>
      <Footer />
      <CartDrawer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </Shell>
  );
}
