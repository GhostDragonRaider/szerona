/**
 * Oldalsó kosár panel: tételek listája, mennyiség, részösszeg, ürítés.
 * A CartContext isOpen állapotától függ; overlay kattintásra záródik.
 */
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const Overlay = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 150;
  background: ${({ theme }) => theme.colors.overlay};
  opacity: ${({ open }) => (open ? 1 : 0)};
  pointer-events: ${({ open }) => (open ? "auto" : "none")};
  transition: opacity 0.25s;
`;

const Panel = styled.aside<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 151;
  width: min(100%, 400px);
  height: 100%;
  max-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  transform: translateX(${({ open }) => (open ? "0" : "100%")});
  transition: transform 0.28s ease;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Head = styled.div`
  padding: ${({ theme }) => theme.space.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.5rem;
  letter-spacing: 0.06em;
`;

const Close = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.75rem;
  cursor: pointer;
  line-height: 1;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${({ theme }) => theme.space.md};
  flex: 1;
  overflow-y: auto;
`;

const Line = styled.li`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.space.sm};
  align-items: center;
  padding: ${({ theme }) => theme.space.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  @media (max-width: 340px) {
    grid-template-columns: 48px 1fr;
    grid-template-rows: auto auto;
    & > *:last-child {
      grid-column: 1 / -1;
      justify-self: end;
    }
  }
`;

const Thumb = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.productImageBg};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const Info = styled.div`
  min-width: 0;
`;

const PName = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
`;

const PPrice = styled.p`
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Qty = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const QBtn = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
`;

const Foot = styled.div`
  padding: ${({ theme }) => theme.space.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Total = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

/** Ugyanaz a „fekete” kitöltött stílus, mint a termékkártya Kosárba gombjánál. */
const SolidBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 1rem;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
  &:active {
    transform: scale(0.99);
  }
`;

const CheckoutBtn = styled(SolidBtn)`
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const ClearBtn = styled(SolidBtn)``;

const EmptyMsg = styled.p`
  margin: ${({ theme }) => theme.space.xl};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    lines,
    isOpen,
    setOpen,
    setQuantity,
    totalPrice,
    clearCart,
    isLoading,
    error,
  } = useCart();

  return (
    <>
      <Overlay open={isOpen} onClick={() => setOpen(false)} aria-hidden={!isOpen} />
      <Panel open={isOpen} aria-hidden={!isOpen}>
        <Head>
          <Title>Kosár</Title>
          <Close type="button" onClick={() => setOpen(false)} aria-label="Bezárás">
            ×
          </Close>
        </Head>
        <List>
          {isLoading ? (
            <EmptyMsg>A kosár betöltése folyamatban...</EmptyMsg>
          ) : lines.length === 0 ? (
            <EmptyMsg>A kosár üres.</EmptyMsg>
          ) : (
            lines.map(({ product, quantity }) => (
              <Line key={product.id}>
                <Thumb src={product.image} alt="" />
                <Info>
                  <PName>{product.name}</PName>
                  <PPrice>
                    {product.price.toLocaleString("hu-HU")} Ft / db
                  </PPrice>
                </Info>
                <Qty>
                  <QBtn
                    type="button"
                    onClick={() => setQuantity(product.id, quantity - 1)}
                    aria-label="Kevesebb"
                  >
                    −
                  </QBtn>
                  <span>{quantity}</span>
                  <QBtn
                    type="button"
                    onClick={() => setQuantity(product.id, quantity + 1)}
                    aria-label="Több"
                  >
                    +
                  </QBtn>
                </Qty>
              </Line>
            ))
          )}
        </List>
        <Foot>
          {error ? <EmptyMsg css={{ margin: 0, marginBottom: "1rem" }}>{error}</EmptyMsg> : null}
          <Total>
            Összesen: {totalPrice.toLocaleString("hu-HU")} Ft
          </Total>
          {lines.length > 0 ? (
            <>
              <CheckoutBtn
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/checkout");
                }}
              >
                Tovább a fizetéshez
              </CheckoutBtn>
              <ClearBtn
                type="button"
                onClick={() => {
                  void clearCart();
                }}
              >
                Kosár ürítése
              </ClearBtn>
            </>
          ) : null}
        </Foot>
      </Panel>
    </>
  );
}
