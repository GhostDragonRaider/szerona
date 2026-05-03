import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { formatPrice, PAYMENT_METHOD_LABELS, SHIPPING_METHOD_LABELS } from "../../data/commerce";
import { apiFetch } from "../../lib/api";
import { loadAuthSession } from "../../lib/authSession";
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

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  align-items: center;
  margin: ${({ theme }) => theme.space.sm} 0;
`;

const SmallInput = styled.input`
  min-height: 40px;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

const Btn = styled.button`
  min-height: 40px;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Feedback = styled.p<{ $ok?: boolean }>`
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.accent)};
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

async function openInvoicePdf(invoiceNumber: string) {
  const session = loadAuthSession();
  if (!session?.token) {
    throw new Error("Hiányzó admin munkamenet.");
  }

  const response = await fetch(
    `/api/admin/invoices/${encodeURIComponent(invoiceNumber)}/pdf`,
    {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    },
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "A számla PDF megnyitása sikertelen.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

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

  async function saveTrackingNumber(order: Order) {
    const trackingNumber = (trackingInputs[order.id] ?? order.trackingNumber ?? "").trim();
    if (!trackingNumber) {
      setMessage({ ok: false, text: "Adj meg GLS vagy MPL csomagszámot." });
      return;
    }

    setBusyOrderId(order.id);
    setMessage(null);
    try {
      const response = await apiFetch<{ ok: boolean; message?: string; order: Order }>(
        `/api/orders/${order.id}/fulfillment-event`,
        {
          method: "POST",
          auth: true,
          json: {
            event: "shipped",
            trackingNumber,
          },
        },
      );
      setOrders((current) =>
        current.map((entry) => (entry.id === order.id ? response.order : entry)),
      );
      setMessage({
        ok: true,
        text: response.message ?? "A csomagszám rögzítve.",
      });
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült rögzíteni a csomagszámot.",
      });
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <Wrapper>
      <Title>Rendelések</Title>
      <Lead>
        Itt látod az összes bejövő rendelést. A státuszuk és a csomagszám
        valós fulfillment- vagy futáradatok beérkezése után frissül.
      </Lead>
      {isLoading ? <Lead>Rendelések betöltése...</Lead> : null}
      {message ? <Feedback $ok={message.ok}>{message.text}</Feedback> : null}
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
          <ActionRow>
            <SmallInput
              value={trackingInputs[order.id] ?? order.trackingNumber ?? ""}
              onChange={(event) =>
                setTrackingInputs((current) => ({
                  ...current,
                  [order.id]: event.target.value,
                }))
              }
              placeholder="GLS / MPL csomagszám"
            />
            <Btn
              type="button"
              disabled={busyOrderId === order.id}
              onClick={() => void saveTrackingNumber(order)}
            >
              Csomagszám mentése
            </Btn>
          </ActionRow>
          <div css={{ marginBottom: "0.5rem" }}>
            Számla kiküldése:{" "}
            <strong>
              {order.invoice?.number && order.invoice.status === "success"
                ? "sikeres"
                : order.invoice?.number
                  ? order.invoice.status ?? "folyamatban"
                  : "még nincs számla"}
            </strong>
            {order.invoice?.number ? ` · ${order.invoice.number}` : ""}
          </div>
          {order.invoice?.number ? (
            <Btn
              type="button"
              onClick={async () => {
                try {
                  await openInvoicePdf(order.invoice?.number ?? "");
                } catch (error) {
                  setMessage({
                    ok: false,
                    text:
                      error instanceof Error
                        ? error.message
                        : "Nem sikerült megnyitni a számlát.",
                  });
                }
              }}
            >
              Számla megtekintése
            </Btn>
          ) : null}
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
