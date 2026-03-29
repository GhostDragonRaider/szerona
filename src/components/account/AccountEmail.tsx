import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

export function AccountEmail() {
  const { user, changeAccountEmail } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = changeAccountEmail(email, password);
    if (!res.ok) {
      setMsg({ ok: false, text: res.message ?? "Hiba." });
      return;
    }
    setMsg({ ok: true, text: "E-mail cím frissítve." });
    setPassword("");
  }

  return (
    <Box>
      <Title>E-mail cím</Title>
      <Lead>
        Az új cím mentéséhez add meg a jelenlegi jelszavad (admin esetén az
        admin jelszót).
      </Lead>
      <form onSubmit={handleSubmit}>
        <Field>
          E-mail
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
            required
          />
        </Field>
        <Btn type="submit">E-mail mentése</Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
