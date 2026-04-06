import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

export function AccountPassword() {
  const { user, isAdmin, changeAccountPassword } = useAuth();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setMsg(null);
    if (next !== next2) {
      setMsg({ ok: false, text: "Az uj jelszavak nem egyeznek." });
      return;
    }

    setIsSubmitting(true);
    const res = await changeAccountPassword(cur, next);
    setIsSubmitting(false);

    if (!res.ok) {
      setMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }

    setMsg({
      ok: true,
      text: isAdmin ? "Admin jelszo frissitve." : "Jelszo megvaltoztatva.",
    });
    setCur("");
    setNext("");
    setNext2("");
  }

  return (
    <Box>
      <Title>Jelszó</Title>
      <Lead>
        {isAdmin
          ? "Admin fioknal is add meg a jelenlegi jelszavad, majd az uj jelszot ketszer. Az uj admin jelszo legalabb 4 karakter legyen."
          : "Add meg a jelenlegi jelszavad, majd az uj jelszot ketszer."}
      </Lead>
      <form onSubmit={handleSubmit}>
        <Field>
          Jelenlegi jelszó
          <Input
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </Field>
        <Field>
          Új jelszó
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            minLength={isAdmin ? 4 : 8}
            required
          />
        </Field>
        <Field>
          Új jelszó újra
          <Input
            type="password"
            value={next2}
            onChange={(e) => setNext2(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            minLength={isAdmin ? 4 : 8}
            required
          />
        </Field>
        <Btn type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : "Jelszó mentése"}
        </Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
