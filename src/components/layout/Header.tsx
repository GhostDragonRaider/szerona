/**
 * Fő fejléc: navigáció, kereső, kosár, belépés / regisztráció (csak lg+ képernyőn).
 * Mobilon a belépés és regisztráció csak a hamburger menüben (MobileNav).
 * A márkalogó csak a kezdőlap hero szekciójában jelenik meg (nem a fejlécben).
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { SearchBar } from "../search/SearchBar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${({ theme }) => theme.colors.headerBg};
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  flex-wrap: wrap;
  min-width: 0;
  width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
    gap: ${({ theme }) => theme.space.md};
  }
`;

const Nav = styled.nav`
  display: none;
  gap: ${({ theme }) => theme.space.lg};
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
  }
`;

const NavLink = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textMuted};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const SearchRow = styled.div`
  flex: 1 1 100%;
  min-width: 0;
  order: 3;
  width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: 0;
    flex: 1 1 auto;
    width: auto;
    max-width: min(360px, 100%);
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
  margin-left: auto;
  justify-content: flex-end;
  min-width: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.sm};
  }
`;

const IconBtn = styled.button`
  position: relative;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.72rem, 2.8vw, 0.85rem);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, background 0.2s;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  }
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Burger = styled.button`
  display: flex;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  span {
    display: block;
    width: 22px;
    height: 2px;
    background: ${({ theme }) => theme.colors.text};
  }
`;

const UserLabel = styled.span`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: inline;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** Belépés / Regisztráció csak asztali fejlécben; mobilon a hamburger menüben marad. */
const AuthHeaderDesktop = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: contents;
  }
`;

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function Header({ onOpenLogin, onOpenRegister }: HeaderProps) {
  const { totalItems, setOpen } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Bar>
      <Inner>
        <Burger
          type="button"
          aria-label="Menü"
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </Burger>
        <Nav>
          <NavLink to="/">Kezdőlap</NavLink>
          <NavLink to="/shop">Bolt</NavLink>
          {user ? <NavLink to="/account">Fiók</NavLink> : null}
          {isAdmin ? (
            <NavLink to="/admin">Admin</NavLink>
          ) : null}
        </Nav>
        <SearchRow>
          <SearchBar />
        </SearchRow>
        <Actions>
          <ThemeToggle />
          {user ? (
            <>
              <UserLabel title={user.username}>
                {user.role === "admin"
                  ? "👤 admin"
                  : `👤 ${user.displayName || user.username}`}
              </UserLabel>
              <IconBtn type="button" onClick={() => logout()}>
                Kilépés
              </IconBtn>
            </>
          ) : (
            <AuthHeaderDesktop>
              <IconBtn type="button" onClick={onOpenLogin}>
                Belépés
              </IconBtn>
              <IconBtn type="button" onClick={onOpenRegister}>
                Regisztráció
              </IconBtn>
            </AuthHeaderDesktop>
          )}
          <IconBtn
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Kosár megnyitása"
          >
            Kosár
            {totalItems > 0 ? <Badge>{totalItems > 99 ? "99+" : totalItems}</Badge> : null}
          </IconBtn>
        </Actions>
      </Inner>
      <MobileNav
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
      />
    </Bar>
  );
}
