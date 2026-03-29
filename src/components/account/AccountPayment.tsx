import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useState } from "react";
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
`;

const CardMeta = styled.div`
  font-size: 0.95rem;
  min-width: 0;
`;

const CardActions = styled.div`
  flex-shrink: 0;
`;

const Grid2 = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SubTitle = styled.h3`
  margin: ${({ theme }) => theme.space.xl} 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 1.1rem;
  font-weight: 700;
`;

export function AccountPayment() {
  const { user, addCard, removeCard } = useAuth();
  const [brand, setBrand] = useState("Visa");
  const [holderName, setHolderName] = useState("");
  const [last4, setLast4] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = addCard({
      brand,
      holderName: holderName.trim(),
      last4,
      expiryMonth: expiryMonth.padStart(2, "0").slice(-2),
      expiryYear: expiryYear.slice(-2),
    });
    if (!res.ok) {
      setMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }
    setMsg({ ok: true, text: "Kártya hozzáadva (demo)." });
    setHolderName("");
    setLast4("");
    setExpiryMonth("");
    setExpiryYear("");
  }

  return (
    <Box>
      <Title>Fizetési módok</Title>
      <Lead>
        Demo: a kártyaadatok csak a böngészőben tárolódnak, nincs valós
        fizetés. Add meg a kártya utolsó 4 számjegyét és a lejáratot.
      </Lead>

      {user.cards.length > 0 ? (
        <div>
          {user.cards.map((c) => (
            <CardRow key={c.id}>
              <CardMeta>
                <strong>
                  {c.brand} •••• {c.last4}
                </strong>
                <div css={{ color: "inherit", opacity: 0.75, marginTop: 4 }}>
                  {c.holderName} · {c.expiryMonth}/{c.expiryYear}
                </div>
              </CardMeta>
              <CardActions>
                <BtnGhost
                  type="button"
                  onClick={() => {
                    removeCard(c.id);
                    setMsg({ ok: true, text: "Kártya eltávolítva." });
                  }}
                >
                  Eltávolítás
                </BtnGhost>
              </CardActions>
            </CardRow>
          ))}
        </div>
      ) : (
        <p
          css={(theme) => ({
            color: theme.colors.textMuted,
            marginBottom: theme.space.lg,
          })}
        >
          Még nincs mentett kártya.
        </p>
      )}

      <SubTitle>Új kártya (demo)</SubTitle>
      <form onSubmit={handleAdd}>
        <Field>
          Típus
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="Amex">American Express</option>
          </Select>
        </Field>
        <Field>
          Kártyabirtokos neve
          <Input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            autoComplete="cc-name"
            required
          />
        </Field>
        <Field>
          Utolsó 4 számjegy
          <Input
            value={last4}
            onChange={(e) =>
              setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            maxLength={4}
            required
          />
        </Field>
        <Grid2>
          <Field>
            Lejárat hónap (1–12)
            <Input
              value={expiryMonth}
              onChange={(e) =>
                setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              inputMode="numeric"
              placeholder="MM"
              required
            />
          </Field>
          <Field>
            Lejárat év (pl. 27)
            <Input
              value={expiryYear}
              onChange={(e) =>
                setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              inputMode="numeric"
              placeholder="ÉÉ"
              required
            />
          </Field>
        </Grid2>
        <Btn type="submit">Kártya mentése</Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
