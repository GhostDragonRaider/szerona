import styled from "@emotion/styled";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type {
  PaymentGatewayConfig,
  PaymentProvider,
  SavedPaymentMethod,
} from "../../data/types";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Btn,
  BtnGhost,
  Field,
  Input,
  Lead,
  Msg,
  Select,
  Title,
} from "./accountShared";

const CardRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const CardMeta = styled.div`
  min-width: 0;
  font-size: 0.95rem;
`;

const CardTopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
`;

const Badge = styled.span<{ $default?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.24rem 0.6rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.76rem;
  font-weight: 700;
  background: ${({ theme, $default }) =>
    $default ? theme.colors.accentSoft : theme.colors.surfaceElevated};
  color: ${({ theme, $default }) =>
    $default ? theme.colors.accent : theme.colors.textMuted};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const MetaLine = styled.div`
  margin-top: 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
  word-break: break-word;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
  flex-shrink: 0;
`;

const SubTitle = styled.h3`
  margin: ${({ theme }) => theme.space.xl} 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.1rem;
  font-weight: 700;
`;

const Grid2 = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InlineNotice = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.65;
`;

const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface PaymentMethodsResponse {
  ok: boolean;
  paymentMethods: SavedPaymentMethod[];
  gateway: PaymentGatewayConfig;
}

interface PaymentMethodMutationResponse {
  ok: boolean;
  message?: string;
  paymentMethod: SavedPaymentMethod;
  gateway?: PaymentGatewayConfig;
}

interface MessageResponse {
  ok: boolean;
  message?: string;
}

interface FormState {
  provider: PaymentProvider;
  providerMethodId: string;
  providerCustomerId: string;
  holderName: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  funding: string;
  fingerprint: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  provider: "custom",
  providerMethodId: "",
  providerCustomerId: "",
  holderName: "",
  brand: "",
  last4: "",
  expiryMonth: "",
  expiryYear: "",
  funding: "",
  fingerprint: "",
  isDefault: false,
};

const PROVIDER_LABELS: Record<PaymentProvider | "none", string> = {
  none: "Nincs beállítva",
  stripe: "Stripe",
  barion: "Barion",
  simplepay: "SimplePay",
  custom: "Egyedi szolgáltató",
};

function shortenReference(value: string) {
  if (value.length <= 22) return value;
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function AccountPayment() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [gateway, setGateway] = useState<PaymentGatewayConfig>({
    provider: "none",
    mode: "tokenized",
    readyForClientSetup: false,
    supportsSavedCards: true,
  });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const hasDefaultMethod = useMemo(
    () => paymentMethods.some((method) => method.isDefault),
    [paymentMethods],
  );

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadPaymentMethods() {
      setIsLoading(true);
      try {
        const response = await apiFetch<PaymentMethodsResponse>(
          "/api/account/payment-methods",
          {
            auth: true,
          },
        );

        if (cancelled) return;
        setPaymentMethods(response.paymentMethods);
        setGateway(response.gateway);
      } catch (error) {
        if (cancelled) return;
        setMsg({
          ok: false,
          text:
            error instanceof Error
              ? error.message
              : "Nem sikerült betölteni a mentett fizetési módokat.",
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setMsg(null);
    setIsSaving(true);

    try {
      const response = await apiFetch<PaymentMethodMutationResponse>(
        "/api/account/payment-methods",
        {
          method: "POST",
          auth: true,
          json: {
            ...form,
            last4: form.last4.replace(/\D/g, "").slice(-4),
            expiryMonth: form.expiryMonth.replace(/\D/g, "").slice(0, 2),
            expiryYear: form.expiryYear.replace(/\D/g, "").slice(0, 4),
          },
        },
      );

      const nextMethods = await apiFetch<PaymentMethodsResponse>(
        "/api/account/payment-methods",
        {
          auth: true,
        },
      );

      setPaymentMethods(nextMethods.paymentMethods);
      setGateway(nextMethods.gateway);
      setForm({
        ...EMPTY_FORM,
        provider: form.provider,
      });
      setMsg({
        ok: true,
        text:
          response.message ??
          "A tokenizált fizetési mód mentése sikerült.",
      });
    } catch (error) {
      setMsg({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült menteni a fizetési módot.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault(paymentMethodId: string) {
    setBusyId(paymentMethodId);
    setMsg(null);

    try {
      const response = await apiFetch<PaymentMethodMutationResponse>(
        `/api/account/payment-methods/${paymentMethodId}/default`,
        {
          method: "PATCH",
          auth: true,
        },
      );

      const nextMethods = await apiFetch<PaymentMethodsResponse>(
        "/api/account/payment-methods",
        {
          auth: true,
        },
      );

      setPaymentMethods(nextMethods.paymentMethods);
      setMsg({
        ok: true,
        text:
          response.message ?? "Az alapértelmezett fizetési mód frissült.",
      });
    } catch (error) {
      setMsg({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült alapértelmezetté tenni a fizetési módot.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(paymentMethodId: string) {
    setBusyId(paymentMethodId);
    setMsg(null);

    try {
      const response = await apiFetch<MessageResponse>(
        `/api/account/payment-methods/${paymentMethodId}`,
        {
          method: "DELETE",
          auth: true,
        },
      );

      const nextMethods = await apiFetch<PaymentMethodsResponse>(
        "/api/account/payment-methods",
        {
          auth: true,
        },
      );

      setPaymentMethods(nextMethods.paymentMethods);
      setMsg({
        ok: true,
        text: response.message ?? "A fizetési mód eltávolítva.",
      });
    } catch (error) {
      setMsg({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült eltávolítani a fizetési módot.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box>
      <Title>Fizetési módok</Title>
      <Lead>
        Itt már tokenizált, szolgáltatói azonosítóval mentett bankkártyák
        kezelhetők. Valódi kártyaszámot vagy CVC/CVV kódot a Serona nem tárol.
      </Lead>

      <InlineNotice>
        <strong>Aktív fizetési provider:</strong>{" "}
        {PROVIDER_LABELS[gateway.provider]}
        <br />
        <strong>Állapot:</strong>{" "}
        {gateway.readyForClientSetup
          ? "a kliensoldali tokenizálás bekötéséhez már van alapkonfiguráció"
          : "a teljes kliensoldali tokenizáló widget még nincs bekötve"}
        <br />
        <strong>Jelenlegi működés:</strong> a szolgáltatótól kapott token vagy
        fizetési mód azonosító már menthető, így a rendszer készen áll a valódi
        mentett kártyás terhelés szerkezetére.
      </InlineNotice>

      {isLoading ? <Lead>Mentett fizetési módok betöltése...</Lead> : null}

      {paymentMethods.length > 0 ? (
        <div>
          {paymentMethods.map((method) => (
            <CardRow key={method.id}>
              <CardMeta>
                <CardTopRow>
                  <strong>
                    {method.brand} •••• {method.last4}
                  </strong>
                  <Badge>{PROVIDER_LABELS[method.provider]}</Badge>
                  {method.isDefault ? (
                    <Badge $default>Alapértelmezett</Badge>
                  ) : null}
                </CardTopRow>
                <MetaLine>
                  {method.holderName} · {method.expiryMonth}/{method.expiryYear}
                </MetaLine>
                <MetaLine>
                  Szolgáltatói azonosító:{" "}
                  {shortenReference(method.providerMethodId)}
                </MetaLine>
                {method.providerCustomerId ? (
                  <MetaLine>
                    Ügyfél-azonosító:{" "}
                    {shortenReference(method.providerCustomerId)}
                  </MetaLine>
                ) : null}
              </CardMeta>
              <CardActions>
                {!method.isDefault ? (
                  <BtnGhost
                    type="button"
                    disabled={busyId === method.id}
                    onClick={() => void handleSetDefault(method.id)}
                  >
                    Alapértelmezetté teszem
                  </BtnGhost>
                ) : null}
                <BtnGhost
                  type="button"
                  disabled={busyId === method.id}
                  onClick={() => void handleRemove(method.id)}
                >
                  Eltávolítás
                </BtnGhost>
              </CardActions>
            </CardRow>
          ))}
        </div>
      ) : (
        <Lead>
          Még nincs mentett, tokenizált fizetési módod. A checkout bankkártyás
          lépésénél később ezek közül lehet majd választani.
        </Lead>
      )}

      <SubTitle>Új tokenizált fizetési mód rögzítése</SubTitle>
      <Lead>
        Ide a fizetési szolgáltatótól kapott azonosítót kell rögzíteni.
        Nyers PAN, teljes kártyaszám és CVC/CVV mező nincs és nem is lesz
        eltárolva. Ha később a kliensoldali widget bekötésre kerül, ezt a
        folyamatot már közvetlenül az oldal fogja kitölteni.
      </Lead>
      <form onSubmit={handleAdd}>
        <Field>
          Fizetési szolgáltató
          <Select
            value={form.provider}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                provider: event.target.value as PaymentProvider,
              }))
            }
          >
            <option value="custom">Egyedi tokenforrás</option>
            <option value="stripe">Stripe</option>
            <option value="barion">Barion</option>
            <option value="simplepay">SimplePay</option>
          </Select>
        </Field>
        <Field>
          Szolgáltatói fizetési mód azonosító
          <Input
            value={form.providerMethodId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                providerMethodId: event.target.value,
              }))
            }
            placeholder="pl. pm_1Q..."
            required
          />
        </Field>
        <Field>
          Szolgáltatói ügyfél-azonosító (opcionális)
          <Input
            value={form.providerCustomerId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                providerCustomerId: event.target.value,
              }))
            }
            placeholder="pl. cus_..."
          />
        </Field>
        <Grid2>
          <Field>
            Kártyabirtokos neve
            <Input
              value={form.holderName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  holderName: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field>
            Kártyatársaság
            <Input
              value={form.brand}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  brand: event.target.value,
                }))
              }
              placeholder="pl. Visa"
              required
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field>
            Utolsó 4 számjegy
            <Input
              value={form.last4}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  last4: event.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              inputMode="numeric"
              maxLength={4}
              required
            />
          </Field>
          <Field>
            Kártyatípus / funding (opcionális)
            <Input
              value={form.funding}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  funding: event.target.value,
                }))
              }
              placeholder="pl. credit"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field>
            Lejárat hónap
            <Input
              value={form.expiryMonth}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiryMonth: event.target.value.replace(/\D/g, "").slice(0, 2),
                }))
              }
              inputMode="numeric"
              placeholder="MM"
              required
            />
          </Field>
          <Field>
            Lejárat év
            <Input
              value={form.expiryYear}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiryYear: event.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              inputMode="numeric"
              placeholder="ÉÉ vagy ÉÉÉÉ"
              required
            />
          </Field>
        </Grid2>
        <Field>
          Kártya ujjlenyomat / fingerprint (opcionális)
          <Input
            value={form.fingerprint}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fingerprint: event.target.value,
              }))
            }
            placeholder="pl. fp_..."
          />
        </Field>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={form.isDefault || !hasDefaultMethod}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                isDefault: event.target.checked,
              }))
            }
          />
          Legyen ez az alapértelmezett fizetési mód
        </CheckboxLabel>
        <Btn type="submit" disabled={isSaving}>
          {isSaving ? "Mentés..." : "Tokenizált fizetési mód mentése"}
        </Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>

      <Lead style={{ marginTop: "1.5rem" }}>
        Ha a bankkártyás fizetést a checkoutban is használni szeretnéd, a{" "}
        <Link to="/checkout">pénztárban</Link> mentett fizetési módot fogsz
        tudni kiválasztani, nem nyers kártyaadatot megadni.
      </Lead>
    </Box>
  );
}
