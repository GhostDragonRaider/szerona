/**
 * Fő fejléc: fekete sáv; mobilon fix, asztalon sticky; kereső, navigáció, kosár.
 * Mobilon a kereső csak a bolt oldalon jelenik meg a sáv alatt.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { SearchBar } from "../search/SearchBar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

const Inner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
    gap: ${({ theme }) => theme.space.md};
  }
`;

const MobileTitle = styled.span`
  display: none;
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    text-align: center;
    font-family: ${({ theme }) => theme.fonts.display};
    font-weight: 700;
    font-size: clamp(1.15rem, 4vw, 1.35rem);
    letter-spacing: 0.14em;
    color: #ffffff;
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
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.25rem 0.5rem;
  margin: -0.25rem -0.5rem;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: none;
  @media (hover: hover) {
    &:hover {
      transition: background 0.2s, color 0.2s;
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
  }
`;

const SearchRow = styled.div<{ $showOnMobileShop: boolean }>`
  flex: 1 1 100%;
  min-width: 0;
  order: 3;
  width: 100%;
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    display: ${({ $showOnMobileShop }) =>
      $showOnMobileShop ? "block" : "none"};
    order: 4;
    margin-top: ${({ theme }) => theme.space.xs};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: 0;
    display: block;
    flex: 1 1 auto;
    width: auto;
    max-width: min(360px, 100%);
    margin-top: 0;
  }
  & input[type="search"] {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.28);
    color: #ffffff;
  }
  & input[type="search"]::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
  & input[type="search"]:focus {
    border-color: rgba(255, 255, 255, 0.45);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.12);
  }
  & button[type="button"] {
    color: rgba(255, 255, 255, 0.65);
  }
  & button[type="button"]:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
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
  order: 2;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.sm};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: unset;
    margin-left: auto;
  }
`;

const ThemeToggleDesktop = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
  }
  & button {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  @media (hover: hover) {
    & button:hover {
      border-color: rgba(255, 255, 255, 0.55);
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

const HeaderTextBtn = styled.button`
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: clamp(0.72rem, 2.8vw, 0.85rem);
  cursor: pointer;
  white-space: nowrap;
  transition: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  }
  @media (hover: hover) {
    &:hover {
      transition: border-color 0.2s, background 0.2s;
      border-color: rgba(255, 255, 255, 0.55);
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

const CartIconBtn = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: ${({ theme }) => theme.radii.md};
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  cursor: pointer;
  transition: none;
  @media (hover: hover) {
    &:hover {
      transition: border-color 0.2s, background 0.2s;
      border-color: rgba(255, 255, 255, 0.55);
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

const CartGlyph = styled.svg`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
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
  order: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  span {
    display: block;
    width: 22px;
    height: 2px;
    background: #ffffff;
  }
`;

const Bar = styled.header`
  z-index: 100;
  transition: none;
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: 0;
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
    color: rgba(255, 255, 255, 0.72);
  }
`;

const AuthHeaderDesktop = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: contents;
  }
`;

const LogoutDesktopOnly = styled.div`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
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
  const { pathname } = useLocation();
  const showMobileShopSearch = pathname === "/shop";

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
        <MobileTitle>SERONA</MobileTitle>
        <Nav>
          <NavLink to="/">Kezdőlap</NavLink>
          <NavLink to="/shop">Bolt</NavLink>
          {user ? <NavLink to="/account">Fiók</NavLink> : null}
          {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
        </Nav>
        <SearchRow $showOnMobileShop={showMobileShopSearch}>
          <SearchBar />
        </SearchRow>
        <Actions>
          <ThemeToggleDesktop>
            <ThemeToggle />
          </ThemeToggleDesktop>
          {user ? (
            <>
              <UserLabel title={user.username}>
                {user.role === "admin"
                  ? "👤 admin"
                  : `👤 ${user.displayName || user.username}`}
              </UserLabel>
              <LogoutDesktopOnly>
                <HeaderTextBtn type="button" onClick={() => logout()}>
                  Kilépés
                </HeaderTextBtn>
              </LogoutDesktopOnly>
            </>
          ) : (
            <AuthHeaderDesktop>
              <HeaderTextBtn type="button" onClick={onOpenLogin}>
                Belépés
              </HeaderTextBtn>
              <HeaderTextBtn type="button" onClick={onOpenRegister}>
                Regisztráció
              </HeaderTextBtn>
            </AuthHeaderDesktop>
          )}
          <CartIconBtn
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Kosár megnyitása"
          >
            <CartGlyph
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </CartGlyph>
            {totalItems > 0 ? (
              <Badge>{totalItems > 99 ? "99+" : totalItems}</Badge>
            ) : null}
          </CartIconBtn>
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
