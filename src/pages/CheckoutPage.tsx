/**
 * Pénztár: szállítási adatok → fizetési mód → összegzés (demo, nincs valós terhelés).
 */
import styled from "@emotion/styled";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Field,
  Input,
  Lead,
  Title,
} from "../components/account/accountShared";
import { useCart } from "../context/CartContext";

const Page = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.lg} max(${({ theme }) => theme.space.md}, env(safe-area-inset-left, 0px))
    ${({ theme }) => theme.space.xl} max(${({ theme }) => theme.space.md}, env(safe-area-inset-right, 0px));
  width: 100%;
  box-sizing: border-box;
  min-height: min(70vh, 100%);
`;

const PageTitle = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 2rem);
  letter-spacing: 0.06em;
`;

const Steps = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.sm};
  margin: 0 0 ${({ theme }) => theme.space.xl};
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StepItem = styled.li<{ $active: boolean; $done: boolean }>`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $active, $done }) =>
    $active
      ? theme.colors.accentSoft
      : $done
        ? theme.colors.secondarySoft
        : "transparent"};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : "inherit"};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.accent : theme.colors.border};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.md};
  align-items: center;
  margin-top: ${({ theme }) => theme.space.lg};
`;

/** Termékkártya Kosárba gombjával megegyező kitöltött stílus. */
const SolidBtn = styled.button`
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.2s;
  width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: 200px;
  }
  &:hover {
    opacity: 0.9;
  }
  &:active {
    transform: scale(0.99);
  }
`;

const RadioList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const RadioLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid
    ${({ theme, $checked }) =>
      $checked ? theme.colors.accent : theme.colors.border};
  cursor: pointer;
  background: ${({ theme, $checked }) =>
    $checked ? theme.colors.accentSoft : theme.colors.surface};
`;

const SummaryLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.95rem;
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const CardBlock = styled.div`
  margin-top: ${({ theme }) => theme.space.lg};
  padding-top: ${({ theme }) => theme.space.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const SubTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.05rem;
  font-weight: 700;
`;

const ExpiryRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.md};
  @media (max-width: ${({ theme }) => `calc(${theme.breakpoints.sm} - 1px)`}) {
    grid-template-columns: 1fr;
  }
`;

const stepsConfig = [
  { id: 1, label: "1. Szállítási adatok" },
  { id: 2, label: "2. Fizetési mód" },
  { id: 3, label: "3. Összegzés" },
] as const;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "card" | "transfer"
  >("cod");

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = useState("");
  const [cardExpiryYear, setCardExpiryYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  function digitsOnly(s: string) {
    return s.replace(/\D/g, "");
  }

  function formatCardNumberInput(raw: string) {
    const d = digitsOnly(raw).slice(0, 16);
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function handleShippingNext(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) return;
    if (!zip.trim() || !city.trim() || !address.trim()) return;
    setStep(2);
  }

  function handlePaymentNext(e: FormEvent) {
    e.preventDefault();
    if (paymentMethod === "card") {
      const num = digitsOnly(cardNumber);
      const m = cardExpiryMonth.padStart(2, "0");
      const y = cardExpiryYear.length === 2 ? cardExpiryYear : cardExpiryYear.slice(-2);
      const cvv = digitsOnly(cardCvv);
      if (!cardHolderName.trim()) return;
      if (num.length < 13 || num.length > 16) return;
      const mi = parseInt(m, 10);
      if (Number.isNaN(mi) || mi < 1 || mi > 12) return;
      if (!/^\d{2}$/.test(y)) return;
      if (cvv.length < 3 || cvv.length > 4) return;
    }
    setStep(3);
  }

  function handlePlaceOrder() {
    clearCart();
    navigate("/", { replace: true });
  }

  if (lines.length === 0) {
    return (
      <Page>
        <EmptyBox>
          <p>Nincs termék a kosárban.</p>
          <p css={{ marginTop: "1rem" }}>
            <Link to="/shop">Vissza a boltba</Link>
          </p>
        </EmptyBox>
      </Page>
    );
  }

  const paymentLabels: Record<typeof paymentMethod, string> = {
    cod: "Utánvét (kézpénz átvételkor)",
    card: "Bankkártya (online – demo, nincs valós terhelés)",
    transfer: "Átutalás (közleményben rendelésszám)",
  };

  const cardLast4 =
    paymentMethod === "card"
      ? digitsOnly(cardNumber).slice(-4) || "—"
      : "";

  return (
    <Page>
      <PageTitle>Fizetés</PageTitle>
      <Steps>
        {stepsConfig.map((s) => (
          <StepItem
            key={s.id}
            $active={step === s.id}
            $done={step > s.id}
            aria-current={step === s.id ? "step" : undefined}
          >
            {s.label}
          </StepItem>
        ))}
      </Steps>

      {step === 1 ? (
        <Box as="form" onSubmit={handleShippingNext}>
          <Title>Szállítási adatok</Title>
          <Lead>
            Add meg, hova szállíthatjuk a rendelést. A mezők csak ezen az
            oldalon maradnak (demo).
          </Lead>
          <Field>
            Teljes név
            <Input
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field>
            E-mail
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            Telefon
            <Input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field>
            Irányítószám
            <Input
              required
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
          </Field>
          <Field>
            Település
            <Input
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Field>
          <Field>
            Utca, házszám
            <Input
              required
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
          <Row>
            <SolidBtn type="submit">Tovább a fizetési módhoz</SolidBtn>
          </Row>
        </Box>
      ) : null}

      {step === 2 ? (
        <Box as="form" onSubmit={handlePaymentNext}>
          <Title>Fizetési mód</Title>
          <Lead>Válassz, hogyan szeretnél fizetni (demó opciók).</Lead>
          <RadioList>
            <RadioLabel $checked={paymentMethod === "cod"}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span>Utánvét</span>
            </RadioLabel>
            <RadioLabel $checked={paymentMethod === "card"}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              <span>Bankkártya (online – demo)</span>
            </RadioLabel>
            <RadioLabel $checked={paymentMethod === "transfer"}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "transfer"}
                onChange={() => setPaymentMethod("transfer")}
              />
              <span>Előre utalás</span>
            </RadioLabel>
          </RadioList>

          {paymentMethod === "card" ? (
            <CardBlock>
              <SubTitle>Bankkártya adatok</SubTitle>
              <Lead css={{ marginBottom: "1rem" }}>
                Demo: az adatok nem kerülnek elküldésre és nem történik valós
                fizetés. Ne adj meg valós kártyaadatot.
              </Lead>
              <Field>
                Kártyán szereplő név
                <Input
                  required
                  autoComplete="cc-name"
                  name="ccname"
                  placeholder="Mint a kártyán"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                />
              </Field>
              <Field>
                Kártyaszám
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  name="ccnumber"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumberInput(e.target.value))
                  }
                />
              </Field>
              <ExpiryRow>
                <Field>
                  Lejárat (hónap)
                  <Input
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    name="ccmonth"
                    placeholder="MM"
                    maxLength={2}
                    value={cardExpiryMonth}
                    onChange={(e) =>
                      setCardExpiryMonth(
                        digitsOnly(e.target.value).slice(0, 2),
                      )
                    }
                  />
                </Field>
                <Field>
                  Lejárat (év)
                  <Input
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    name="ccyear"
                    placeholder="ÉÉ"
                    maxLength={2}
                    value={cardExpiryYear}
                    onChange={(e) =>
                      setCardExpiryYear(digitsOnly(e.target.value).slice(0, 2))
                    }
                  />
                </Field>
              </ExpiryRow>
              <Field>
                CVC / CVV
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  name="cccvc"
                  placeholder="123"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) =>
                    setCardCvv(digitsOnly(e.target.value).slice(0, 4))
                  }
                />
              </Field>
            </CardBlock>
          ) : null}

          <Row>
            <SolidBtn type="button" onClick={() => setStep(1)}>
              Vissza
            </SolidBtn>
            <SolidBtn type="submit">Tovább az összegzéshez</SolidBtn>
          </Row>
        </Box>
      ) : null}

      {step === 3 ? (
        <Box>
          <Title>Összegzés</Title>
          <Lead>Ellenőrizd az adatokat, majd zárd le a rendelést (demo).</Lead>
          <div
            css={(theme) => ({
              marginBottom: theme.space.lg,
              padding: theme.space.md,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              fontSize: "0.9rem",
            })}
          >
            <div css={{ fontWeight: 700, marginBottom: 8 }}>Szállítás</div>
            <div>{fullName}</div>
            <div>{email}</div>
            <div>{phone}</div>
            <div>
              {zip} {city}, {address}
            </div>
            <div css={{ marginTop: 12, fontWeight: 700 }}>Fizetés</div>
            <div>{paymentLabels[paymentMethod]}</div>
            {paymentMethod === "card" ? (
              <div css={{ marginTop: 8 }}>
                Kártya: •••• {cardLast4} · {cardHolderName.trim() || "—"} ·
                lej.: {cardExpiryMonth.padStart(2, "0")}/{cardExpiryYear}
              </div>
            ) : null}
          </div>
          {lines.map(({ product, quantity }) => (
            <SummaryLine key={product.id}>
              <span>
                {product.name} × {quantity}
              </span>
              <span>
                {(product.price * quantity).toLocaleString("hu-HU")} Ft
              </span>
            </SummaryLine>
          ))}
          <SummaryLine css={{ fontWeight: 700, fontSize: "1.1rem", border: "none" }}>
            <span>Összesen</span>
            <span>{totalPrice.toLocaleString("hu-HU")} Ft</span>
          </SummaryLine>
          <Row>
            <SolidBtn type="button" onClick={() => setStep(2)}>
              Vissza
            </SolidBtn>
            <SolidBtn type="button" onClick={handlePlaceOrder}>
              Rendelés leadása (demo)
            </SolidBtn>
          </Row>
        </Box>
      ) : null}
    </Page>
  );
}
