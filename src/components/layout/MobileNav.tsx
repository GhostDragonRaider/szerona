/**
 * Oldalsó navigációs panel (overlay): kezdőlap, bolt, fiók, admin, téma, belépés/kilépés.
 * Mobilon és asztalon ugyanaz a hamburger nyitja.
 */
import styled from "@emotion/styled";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Overlay = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: ${({ theme }) => theme.colors.overlay};
  opacity: ${({ open }) => (open ? 1 : 0)};
  pointer-events: ${({ open }) => (open ? "auto" : "none")};
  transition: opacity 0.25s ease;
`;

const Panel = styled.aside<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: min(88vw, 380px);
  height: 100%;
  max-height: 100dvh;
  padding: ${({ theme }) => theme.space.lg};
  padding-bottom: max(${({ theme }) => theme.space.lg}, env(safe-area-inset-bottom, 0px));
  padding-top: max(${({ theme }) => theme.space.md}, env(safe-area-inset-top, 0px));
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  z-index: 10001;
  transform: translateX(${({ open }) => (open ? "0" : "100%")});
  transition: transform 0.28s ease;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  width: 100%;
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  padding: ${({ theme }) => theme.space.sm};
  flex-shrink: 0;
`;

const UserBlock = styled.div`
  margin-top: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  word-break: break-word;
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.md};
  flex: 1 1 auto;
`;

const NavLink = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.space.sm};
  margin: 0 calc(-1 * ${({ theme }) => theme.space.sm});
  border-radius: ${({ theme }) => theme.radii.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: none;
  @media (hover: hover) {
    &:hover {
      transition: background 0.2s, color 0.2s;
      background: ${({ theme }) => theme.colors.text};
      color: ${({ theme }) => theme.colors.bg};
    }
  }
`;

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenRegister,
}: MobileNavProps) {
  const { user, logout, isAdmin } = useAuth();

  const userLabel =
    user?.role === "admin"
      ? "👤 admin"
      : user
        ? `👤 ${user.displayName || user.username}`
        : null;

  const tree = (
    <>
      <Overlay open={isOpen} onClick={onClose} aria-hidden={!isOpen} />
      <Panel open={isOpen} aria-hidden={!isOpen} aria-label="Főmenü">
        <TopRow>
          <CloseBtn type="button" onClick={onClose} aria-label="Menü bezárása">
            ×
          </CloseBtn>
        </TopRow>
        {user && userLabel ? (
          <UserBlock title={user.username}>{userLabel}</UserBlock>
        ) : null}
        <NavList onClick={onClose}>
          <NavLink to="/">Kezdőlap</NavLink>
          <NavLink to="/shop">Bolt</NavLink>
          {user && !isAdmin ? (
            <NavLink to="/account?tab=orders">Rendeléseim</NavLink>
          ) : null}
          {user && !isAdmin ? <NavLink to="/account">Fiók</NavLink> : null}
          {isAdmin ? <NavLink to="/admin">Admin Felület</NavLink> : null}
        </NavList>
        {!user ? (
          <div
            css={(theme) => ({
              marginTop: theme.space.xl,
              display: "flex",
              flexDirection: "column",
              gap: theme.space.sm,
            })}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              css={(theme) => ({
                padding: theme.space.md,
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surfaceElevated,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontWeight: 600,
                cursor: "pointer",
              })}
            >
              Belépés
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              css={(theme) => ({
                padding: theme.space.md,
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surfaceElevated,
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontWeight: 600,
                cursor: "pointer",
              })}
            >
              Regisztráció
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            css={(theme) => ({
              marginTop: theme.space.xl,
              padding: theme.space.md,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              background: "transparent",
              color: theme.colors.textMuted,
              cursor: "pointer",
              fontFamily: theme.fonts.body,
              fontWeight: 600,
            })}
          >
            Kilépés
          </button>
        )}
      </Panel>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(tree, document.body);
}
