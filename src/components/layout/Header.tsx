/**
 * Fő fejléc: mobilon középen SERONA; asztalon nincs középső márka – csak menü, kereső, kosár.
 */
import styled from "@emotion/styled";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { SearchBar } from "../search/SearchBar";
import { MobileNav } from "./MobileNav";

const Inner = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  }
`;

/** Mobil: hamburger | SERONA | kosár; asztal (lg+): hamburger | kereső+kosár (közép nélkül). */
const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  width: 100%;
  min-width: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.md};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const LeftSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
`;

/** Középső SERONA csak keskeny nézetben; lg felett a slot nincs a rácsban */
const CenterSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const MobileBarBrand = styled(Link)`
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: clamp(0.85rem, 3.5vw, 1rem);
  color: ${({ theme }) => theme.colors.headerText};
  text-decoration: none;
  white-space: nowrap;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

const RightSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
  min-width: 0;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.md};
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    justify-content: flex-end;
    width: 100%;
  }
`;

/** Közös: fejlécben a SearchBar input / gomb színei */
const HeaderSearchField = styled.div`
  min-width: 0;
  & input[type="search"] {
    background: ${({ theme }) => theme.colors.headerInputBg};
    border-color: ${({ theme }) => theme.colors.headerInputBorder};
    color: ${({ theme }) => theme.colors.headerText};
  }
  & input[type="search"]::placeholder {
    color: ${({ theme }) => theme.colors.headerTextMuted};
  }
  & input[type="search"]:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
  & button[type="button"] {
    color: ${({ theme }) => theme.colors.headerTextMuted};
  }
  & button[type="button"]:hover {
    background: ${({ theme }) => theme.colors.headerInputBg};
    color: ${({ theme }) => theme.colors.headerText};
  }
`;

const SearchDesktop = styled(HeaderSearchField)`
  display: none;
  flex: 0 1 min(360px, 100%);
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
`;

const SearchMobile = styled(HeaderSearchField)<{ $show: boolean }>`
  display: none;
  width: 100%;
  margin-top: ${({ theme }) => theme.space.xs};
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    display: ${({ $show }) => ($show ? "block" : "none")};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space.xs};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: ${({ theme }) => theme.space.sm};
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
  border: 1px solid ${({ theme }) => theme.colors.headerInputBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.headerInputBg};
  color: ${({ theme }) => theme.colors.headerText};
  cursor: pointer;
  transition: none;
  @media (hover: hover) {
    &:hover {
      transition: border-color 0.2s, background 0.2s;
      border-color: ${({ theme }) => theme.colors.headerTextMuted};
      background: ${({ theme }) => theme.colors.surfaceElevated};
      color: ${({ theme }) => theme.colors.headerText};
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
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.headerInputBorder};
  background: transparent;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  flex-shrink: 0;
  span {
    display: block;
    width: 22px;
    height: 2px;
    background: ${({ theme }) => theme.colors.headerText};
  }
`;

const Bar = styled.header`
  z-index: 100;
  width: 100%;
  max-width: 100%;
  transition: none;
  /* Ugyanaz a háttér mint a lapon (világos: halvány átmenet + alapszín), fixed = illeszkedik görgetéskor */
  background: ${({ theme }) => theme.colors.pageBackground};
  background-color: ${({ theme }) => theme.colors.bg};
  background-attachment: fixed;
  border-bottom: 1px solid ${({ theme }) => theme.colors.headerBorder};
  box-sizing: border-box;
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.lg} - 1px)`}) {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
  }
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: 0;
  }
`;

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function Header({ onOpenLogin, onOpenRegister }: HeaderProps) {
  const { totalItems, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const showMobileShopSearch = pathname === "/shop";

  return (
    <Bar>
      <Inner>
        <HeaderRow>
          <LeftSlot>
            <Burger
              type="button"
              aria-label="Menü megnyitása"
              onClick={() => setMenuOpen(true)}
            >
              <span />
              <span />
              <span />
            </Burger>
          </LeftSlot>
          <CenterSlot>
            <MobileBarBrand to="/" aria-label="Serona kezdőlap">
              SERONA
            </MobileBarBrand>
          </CenterSlot>
          <RightSlot>
            <SearchDesktop>
              <SearchBar />
            </SearchDesktop>
            <Actions>
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
          </RightSlot>
        </HeaderRow>
        <SearchMobile $show={showMobileShopSearch}>
          <SearchBar />
        </SearchMobile>
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
