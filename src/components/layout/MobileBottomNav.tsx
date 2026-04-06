/**
 * Mobil alsó navigáció: Kezdőlap, Vásárlás, Keresés (bolt + fókusz), Profil.
 */
import styled from "@emotion/styled";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Bar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.xs};
  padding-bottom: max(
    ${({ theme }) => theme.space.sm},
    env(safe-area-inset-bottom, 0px)
  );
  background: ${({ theme }) => theme.colors.mobileNavBg};
  border-top: 1px solid ${({ theme }) => theme.colors.headerBorder};
  border-top-left-radius: ${({ theme }) => theme.radii.md};
  border-top-right-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.35);
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const Item = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: ${({ theme }) => theme.space.xs};
  text-decoration: none;
  color: ${({ theme }) => theme.colors.mobileNavText};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  min-width: 0;
  transition: none;
  &.active {
    color: ${({ theme }) => theme.colors.mobileNavTextActive};
  }
  svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const ItemButton = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: ${({ theme }) => theme.space.xs};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.mobileNavText};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  min-width: 0;
  svg {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9.5z"
      />
    </svg>
  );
}

function IconShop() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        fill="none"
        d="M6 6h15l-1.5 9h-12L6 6zM6 6 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="7" fill="none" />
      <path fill="none" d="m20 20-3-3" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="3.5" fill="none" />
      <path fill="none" d="M5 20v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

interface MobileBottomNavProps {
  onOpenLogin: () => void;
}

export function MobileBottomNav({ onOpenLogin }: MobileBottomNavProps) {
  const { user, isAdmin } = useAuth();

  return (
    <Bar aria-label="Mobil navigáció">
      <Item to="/" end>
        <IconHome />
        Kezdőlap
      </Item>
      <Item to="/shop">
        <IconShop />
        Vásárlás
      </Item>
      <Item
        to="/shop"
        onClick={() => {
          window.setTimeout(() => {
            document.getElementById("global-search-input")?.focus();
          }, 280);
        }}
      >
        <IconSearch />
        Keresés
      </Item>
      {user && !isAdmin ? (
        <Item to="/account">
          <IconProfile />
          Profil
        </Item>
      ) : !user ? (
        <ItemButton type="button" onClick={onOpenLogin}>
          <IconProfile />
          Profil
        </ItemButton>
      ) : null}
    </Bar>
  );
}
