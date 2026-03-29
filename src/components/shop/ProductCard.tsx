/**
 * Termékkártya: kép, név, ár, opcionális kosárba gomb; compact mód a görgetősávhoz (kisebb padding).
 */
import styled from "@emotion/styled";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../data/types";

const Card = styled.article`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const ImgWrap = styled.div<{ $compact?: boolean }>`
  position: relative;
  aspect-ratio: 1;
  background: ${({ theme }) => theme.colors.productImageBg};
  padding: ${({ $compact, theme }) =>
    $compact ? theme.space.sm : theme.space.md};
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  /* iOS: ne méretezzen újra furcsán görgetés / animáció közben */
  -webkit-user-drag: none;
`;

const Badge = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space.sm};
  left: ${({ theme }) => theme.space.sm};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
`;

const Body = styled.div<{ $compact?: boolean }>`
  padding: ${({ $compact, theme }) =>
    $compact ? theme.space.md : theme.space.lg};
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${({ theme }) => theme.space.sm};
`;

const Name = styled.h3<{ $compact?: boolean }>`
  margin: 0;
  font-size: ${({ $compact }) => ($compact ? "0.95rem" : "1.05rem")};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.text};
`;

const Price = styled.p`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const Btn = styled.button`
  margin-top: auto;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  &:hover {
    background: #000000;
    color: #ffffff;
  }
  &:active {
    transform: scale(0.98);
  }
`;

interface ProductCardProps {
  product: Product;
  /** Kisebb megjelenés a görgetősávban. */
  compact?: boolean;
  /** Ha false, nincs kosárba gomb (pl. automatikus görgetősáv). Alapértelmezés: true. */
  showCartButton?: boolean;
}

export function ProductCard({
  product,
  compact,
  showCartButton = true,
}: ProductCardProps) {
  const { addToCart } = useCart();
  return (
    <Card>
      <ImgWrap $compact={compact}>
        <Img src={product.image} alt={product.name} loading="lazy" />
        {product.isNew ? <Badge>Új</Badge> : null}
      </ImgWrap>
      <Body $compact={compact}>
        <Name $compact={compact}>{product.name}</Name>
        <Price>{product.price.toLocaleString("hu-HU")} Ft</Price>
        {showCartButton ? (
          <Btn
            type="button"
            onClick={() => addToCart(product, 1)}
            aria-label={`${product.name} kosárba`}
          >
            Kosárba
          </Btn>
        ) : null}
      </Body>
    </Card>
  );
}
