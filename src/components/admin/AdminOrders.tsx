import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { formatPrice, PAYMENT_METHOD_LABELS, SHIPPING_METHOD_LABELS } from "../../data/commerce";
import { apiFetch } from "../../lib/api";
import type { Order, OrderStatus } from "../../data/types";

const Wrapper = styled.div`
  max-width: 1100px;
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.75rem);
`;

const Lead = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`;

const OrderCard = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const StatusBadge = styled.span<{ $status: OrderStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.84rem;
  font-weight: 700;
  background: ${({ theme, $status }) =>
    $status === "cancelled"
      ? theme.colors.accentSoft
      : $status === "delivered"
        ? "rgba(34,197,94,0.15)"
        : theme.colors.surfaceElevated};
  color: ${({ theme, $status }) =>
    $status === "cancelled" ? theme.colors.accent : theme.colors.text};
`;

const ItemList = styled.ul`
  list-style: none;
  margin: ${({ theme }) => theme.space.md} 0 0;
  padding: 0;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.xs} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-of-type {
    border-bottom: none;
  }
`;

const statusLabels: Record<OrderStatus, string> = {
  pending: "Függőben",
  confirmed: "Jóváhagyva",
  processing: "Feldolgozás alatt",
  shipped: "Átadva a futárnak",
  delivered: "Kézbesítve",
  cancelled: "Törölve",
};

interface OrdersResponse {
  ok: boolean;
  orders: Order[];
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await apiFetch<OrdersResponse>("/api/orders", {
          auth: true,
        });
        if (!cancelled) {
          setOrders(response.orders);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();
    const timer = window.setInterval(() => {
      void loadOrders();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Wrapper>
      <Title>Rendelések</Title>
      <Lead>
        Itt látod az összes bejövő rendelést. A státuszuk és a csomagszám
        valós fulfillment- vagy futáradatok beérkezése után frissül.
      </Lead>
      {isLoading ? <Lead>Rendelések betöltése...</Lead> : null}
      {!isLoading && orders.length === 0 ? (
        <Lead>Még nincs rendelése a webshopnak.</Lead>
      ) : null}
      {orders.map((order) => (
        <OrderCard key={order.id}>
          <TopRow>
            <div>
              <strong>{order.id}</strong>
              <div>
                {new Date(order.createdAt).toLocaleString("hu-HU")}
              </div>
              <div>
                {order.contactEmail} · {order.contactPhone}
              </div>
              <div>
                Végösszeg: <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>
            <div>
              <StatusBadge $status={order.status}>
                {statusLabels[order.status]}
              </StatusBadge>
            </div>
          </TopRow>
          {order.trackingNumber ? (
            <div css={{ marginBottom: "0.5rem", fontWeight: 700 }}>
              Csomagszám: {order.trackingNumber}
            </div>
          ) : (
            <div css={{ marginBottom: "0.5rem", opacity: 0.78 }}>
              Csomagszám a feladási adatok beérkezése után jelenik meg.
            </div>
          )}
          <div css={{ marginBottom: "0.5rem" }}>
            Szállítási mód: {SHIPPING_METHOD_LABELS[order.shippingMethod]} ·{" "}
            {formatPrice(order.shippingPrice)}
          </div>
          {order.discountAmount ? (
            <div css={{ marginBottom: "0.5rem" }}>
              Kedvezmény
              {order.discountCode ? ` (${order.discountCode})` : ""}: -
              {formatPrice(order.discountAmount)}
            </div>
          ) : null}
          <div css={{ marginBottom: "0.5rem" }}>
            Szállítás: {order.shipping.fullName}, {order.shipping.zip}{" "}
            {order.shipping.city}, {order.shipping.line1}
          </div>
          <div css={{ marginBottom: "0.5rem" }}>
            Fizetés: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
          </div>
          <ItemList>
            {order.items.map((item) => (
              <Item key={item.id}>
                <span>
                  {item.name} x {item.quantity}
                </span>
                <strong>{formatPrice(item.lineTotal)}</strong>
              </Item>
            ))}
          </ItemList>
        </OrderCard>
      ))}
    </Wrapper>
  );
}
