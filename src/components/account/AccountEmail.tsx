import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

export function AccountEmail() {
  const { user, isAdmin, changeAccountEmail, requestEmailVerification } =
    useAuth();
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!user) return null;
  const currentEmail = user.email;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setMsg(null);
    setIsSubmitting(true);
    const res = await changeAccountEmail(email, password);
    setIsSubmitting(false);

    if (!res.ok) {
      setMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }
    setMsg({
      ok: true,
      text:
        res.message ??
        "E-mail cím frissítve. Ellenőrizd a beérkező leveleidet a megerősítéshez.",
    });
    setPassword("");
  }

  async function handleResendVerification() {
    if (isResending) return;

    setMsg(null);
    setIsResending(true);
    const result = await requestEmailVerification(currentEmail);
    setIsResending(false);
    setMsg({
      ok: result.ok,
      text:
        result.message ??
        (result.ok
          ? "Új megerősítő levelet küldtünk."
          : "Nem sikerült új megerősítő levelet küldeni."),
    });
  }

  return (
    <Box>
      <Title>E-mail cím</Title>
      <Lead>
        {isAdmin
          ? "Admin fioknal az uj cim mentesehez is add meg a jelenlegi jelszavad."
          : "Az uj cim mentesehez add meg a jelenlegi jelszavad."}
      </Lead>
      {!isAdmin && user.emailVerified === false ? (
        <>
          <Lead>
            Az e-mail címed még nincs megerősítve. Ha szükséges, innen újra
            elküldheted a megerősítő levelet.
          </Lead>
          <Btn
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "Küldés..." : "Megerősítő levél újraküldése"}
          </Btn>
        </>
      ) : null}
      <form onSubmit={handleSubmit}>
        <Field>
          E-mail
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </Field>
        <Field>
          Jelenlegi jelszó a megerősítéshez
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </Field>
        <Btn type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentés..." : "E-mail mentése"}
        </Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
