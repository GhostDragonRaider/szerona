import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { formatPrice, PAYMENT_METHOD_LABELS, SHIPPING_METHOD_LABELS } from "../../data/commerce";
import { apiFetch } from "../../lib/api";
import type { Order, OrderStatus } from "../../data/types";
import { Box, Lead, Msg, Title } from "./accountShared";

const OrderCard = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const Status = styled.span<{ $status: OrderStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.8rem;
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
  margin: ${({ theme }) => theme.space.sm} 0 0;
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

const Section = styled.section`
  margin-top: ${({ theme }) => theme.space.xl};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-size: 1.05rem;
  font-weight: 700;
`;

const SectionLead = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`;

const Meta = styled.div`
  margin-bottom: 0.5rem;
  color: inherit;
  opacity: 0.82;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.space.md} 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const statusLabels: Record<OrderStatus, string> = {
  pending: "Függőben",
  confirmed: "Jóváhagyva",
  processing: "Feldolgozás alatt",
  shipped: "Átadva a futárnak",
  delivered: "Kézbesítve",
  cancelled: "Törölve",
};

const statusDescriptions: Record<OrderStatus, string> = {
  pending: "A rendelést rögzítettük, várja a következő feldolgozási lépést.",
  confirmed: "A rendelést jóváhagytuk, hamarosan indul az összekészítés.",
  processing: "A csomag éppen összekészítés alatt van.",
  shipped: "A csomag átadásra került a szállítónak, és már elérhető a csomagszám.",
  delivered: "A rendelést kiszállítottuk és teljesítettük.",
  cancelled: "A rendelést töröltük, további teendőd nincs vele.",
};

const pendingStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
];

interface OrdersResponse {
  ok: boolean;
  orders: Order[];
}

function sortByNewest(left: Order, right: Order) {
  return (
    Date.parse(right.updatedAt || right.createdAt) -
    Date.parse(left.updatedAt || left.createdAt)
  );
}

function renderOrderCard(order: Order) {
  return (
    <OrderCard key={order.id}>
      <Row>
        <div>
          <strong>{order.id}</strong>
          <div>
            {new Date(order.createdAt).toLocaleString("hu-HU")}
          </div>
        </div>
        <Status $status={order.status}>{statusLabels[order.status]}</Status>
      </Row>
      <div css={{ marginBottom: "0.5rem" }}>
        Végösszeg: <strong>{formatPrice(order.total)}</strong>
      </div>
      <Meta>{statusDescriptions[order.status]}</Meta>
      <Meta>
        Fizetés: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
      </Meta>
      <Meta>
        Szállítási mód: {SHIPPING_METHOD_LABELS[order.shippingMethod]} ·{" "}
        {formatPrice(order.shippingPrice)}
      </Meta>
      {order.discountAmount ? (
        <Meta>
          Kedvezmény
          {order.discountCode ? ` (${order.discountCode})` : ""}: -
          {formatPrice(order.discountAmount)}
        </Meta>
      ) : null}
      <Meta>
        Szállítás: {order.shipping.fullName}, {order.shipping.zip}{" "}
        {order.shipping.city}, {order.shipping.line1}
      </Meta>
      {order.trackingNumber ? (
        <Meta>
          Csomagszám: <strong>{order.trackingNumber}</strong>
        </Meta>
      ) : null}
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
  );
}

export function AccountOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await apiFetch<OrdersResponse>("/api/orders/my", {
          auth: true,
        });
        if (!cancelled) {
          setOrders(response.orders);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Nem sikerült betölteni a rendeléseket.",
          );
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
    <Box>
      <Title>Rendeléseim</Title>
      <Lead>
        Itt látod a szerveroldalon létrejött rendeléseket és az aktuális
        státuszukat, a valós fulfillment- és futáradatok alapján.
      </Lead>
      {error ? <Msg>{error}</Msg> : null}
      {isLoading ? <Lead>Rendelések betöltése...</Lead> : null}
      {!isLoading && !error && orders.length === 0 ? (
        <Lead>Meg nincs leadott rendelesed.</Lead>
      ) : null}
      {!isLoading && !error && orders.length > 0 ? (
        <>
          <Section>
            <SectionTitle>Függőben lévő rendelések</SectionTitle>
            <SectionLead>
              Itt követheted azokat a rendeléseket, amelyek még feldolgozás,
              átadás vagy kézbesítés alatt állnak.
            </SectionLead>
            {orders
              .filter((order) => pendingStatuses.includes(order.status))
              .sort(sortByNewest)
              .map(renderOrderCard)}
            {orders.every((order) => !pendingStatuses.includes(order.status)) ? (
              <EmptyState>Nincs jelenleg függőben lévő rendelésed.</EmptyState>
            ) : null}
          </Section>

          <Section>
            <SectionTitle>Teljesített rendelések</SectionTitle>
            <SectionLead>
              Ide kerülnek azok a rendelések, amelyeket már sikeresen
              kiszállítottunk.
            </SectionLead>
            {orders
              .filter((order) => order.status === "delivered")
              .sort(sortByNewest)
              .map(renderOrderCard)}
            {orders.every((order) => order.status !== "delivered") ? (
              <EmptyState>Még nincs teljesített rendelése a fiókodnak.</EmptyState>
            ) : null}
          </Section>

          {orders.some((order) => order.status === "cancelled") ? (
            <Section>
              <SectionTitle>Törölt rendelések</SectionTitle>
              <SectionLead>
                Ezek a rendelések már nem aktívak, de továbbra is
                visszanézhetők.
              </SectionLead>
              {orders
                .filter((order) => order.status === "cancelled")
                .sort(sortByNewest)
                .map(renderOrderCard)}
            </Section>
          ) : null}
        </>
      ) : null}
    </Box>
  );
}
