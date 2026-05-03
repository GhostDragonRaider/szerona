import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { formatPrice, PAYMENT_METHOD_LABELS } from "../../data/commerce";
import { loadAuthSession } from "../../lib/authSession";
import { apiFetch } from "../../lib/api";
import type { PaymentMethod } from "../../data/types";

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

const InvoiceCard = styled.article`
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
`;

const Badge = styled.span<{ $ok?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.75rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.accent)};
  background: ${({ theme, $ok }) =>
    $ok ? "rgba(34,197,94,0.15)" : theme.colors.accentSoft};
`;

const Btn = styled.button`
  min-height: 42px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

interface AdminInvoice {
  orderId: string;
  invoiceNumber: string;
  status: string | null;
  createdAt: string | null;
  contactEmail: string;
  total: number;
  paymentMethod: PaymentMethod;
  pdfAvailable: boolean;
}

interface InvoicesResponse {
  ok: boolean;
  invoices: AdminInvoice[];
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

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      try {
        const response = await apiFetch<InvoicesResponse>("/api/admin/invoices", {
          auth: true,
        });
        if (!cancelled) {
          setInvoices(response.invoices);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({
            ok: false,
            text:
              error instanceof Error
                ? error.message
                : "Nem sikerült betölteni a számlákat.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Wrapper>
      <Title>Számlák</Title>
      <Lead>
        Itt láthatók a backend által eltárolt számlák. A PDF-ek a szerveren a
        számlák mappában vannak, és csak admin jogosultsággal nyithatók meg.
      </Lead>
      {isLoading ? <Lead>Számlák betöltése...</Lead> : null}
      {message ? (
        <Lead css={(theme) => ({ color: message.ok ? theme.colors.success : theme.colors.accent })}>
          {message.text}
        </Lead>
      ) : null}
      {!isLoading && invoices.length === 0 ? (
        <Lead>Még nincs eltárolt számla.</Lead>
      ) : null}
      {invoices.map((invoice) => (
        <InvoiceCard key={`${invoice.orderId}-${invoice.invoiceNumber}`}>
          <TopRow>
            <div>
              <strong>{invoice.invoiceNumber}</strong>
              <div>Rendelés: {invoice.orderId}</div>
              <div>Vevő e-mail: {invoice.contactEmail}</div>
              <div>
                Fizetés: {PAYMENT_METHOD_LABELS[invoice.paymentMethod]} ·{" "}
                {formatPrice(invoice.total)}
              </div>
              {invoice.createdAt ? (
                <div>
                  Kiállítva: {new Date(invoice.createdAt).toLocaleString("hu-HU")}
                </div>
              ) : null}
            </div>
            <div css={{ display: "grid", gap: "0.75rem", alignContent: "start" }}>
              <Badge $ok={invoice.status === "success"}>
                {invoice.status === "success" ? "Sikeres" : invoice.status ?? "Ismeretlen"}
              </Badge>
              <Badge $ok={invoice.pdfAvailable}>
                {invoice.pdfAvailable ? "PDF eltárolva" : "PDF hiányzik"}
              </Badge>
              <Btn
                type="button"
                disabled={!invoice.pdfAvailable}
                onClick={async () => {
                  try {
                    await openInvoicePdf(invoice.invoiceNumber);
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
                PDF megnyitása
              </Btn>
            </div>
          </TopRow>
        </InvoiceCard>
      ))}
    </Wrapper>
  );
}
