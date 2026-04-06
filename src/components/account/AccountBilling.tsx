import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { BillingAddress } from "../../data/types";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

const emptyBilling = (): BillingAddress => ({
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  zip: "",
  country: "Magyarország",
});

export function AccountBilling() {
  const { user, updateBilling } = useAuth();
  const [form, setForm] = useState<BillingAddress>(emptyBilling);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.billing) setForm({ ...emptyBilling(), ...user.billing });
  }, [user]);

  if (!user) return null;

  function setField<K extends keyof BillingAddress>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMsg(null);
    const result = await updateBilling(form);
    setIsSubmitting(false);
    setMsg({
      ok: result.ok,
      text:
        result.message ??
        (result.ok ? "Szamlazasi cim mentve." : "Nem sikerult a mentes."),
    });
  }

  return (
    <Box>
      <Title>Számlázási cím</Title>
      <Lead>
        A rendeléshez és számlához használt adatok (demo, csak böngészőben
        tárolva).
      </Lead>
      <form onSubmit={handleSubmit}>
        <Field>
          Teljes név / cégnév
          <Input
            value={form.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            autoComplete="name"
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          Utca, házszám
          <Input
            value={form.line1}
            onChange={(e) => setField("line1", e.target.value)}
            autoComplete="street-address"
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          Emelet, ajtó (opcionális)
          <Input
            value={form.line2}
            onChange={(e) => setField("line2", e.target.value)}
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          Irányítószám
          <Input
            value={form.zip}
            onChange={(e) => setField("zip", e.target.value)}
            autoComplete="postal-code"
            inputMode="numeric"
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          Város
          <Input
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            autoComplete="address-level2"
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          Ország
          <Input
            value={form.country}
            onChange={(e) => setField("country", e.target.value)}
            autoComplete="country-name"
            disabled={isSubmitting}
          />
        </Field>
        <Btn type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : "Mentés"}
        </Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
