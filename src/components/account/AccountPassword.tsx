import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

export function AccountPassword() {
  const { user, isAdmin, changeAccountPassword } = useAuth();
  const { changeAdminPassword } = useSettings();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next !== next2) {
      setMsg({ ok: false, text: "Az új jelszavak nem egyeznek." });
      return;
    }
    if (isAdmin) {
      const res = changeAdminPassword(cur, next);
      if (!res.ok) {
        setMsg({ ok: false, text: res.message ?? "Hiba." });
        return;
      }
      setMsg({
        ok: true,
        text: "Admin jelszó frissítve. Következő belépéshez már az új jelszót használd.",
      });
    } else {
      const res = changeAccountPassword(cur, next);
      if (!res.ok) {
        setMsg({ ok: false, text: res.message ?? "Hiba." });
        return;
      }
      setMsg({ ok: true, text: "Jelszó megváltoztatva." });
    }
    setCur("");
    setNext("");
    setNext2("");
  }

  return (
    <Box>
      <Title>Jelszó</Title>
      <Lead>
        {isAdmin
          ? "Admin fiók: ugyanaz a jelszó, mint az Admin → Általános beállításokban."
          : "Add meg a jelenlegi jelszavad, majd az újat kétszer."}
      </Lead>
      <form onSubmit={handleSubmit}>
        <Field>
          Jelenlegi jelszó
          <Input
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            autoComplete="current-password"
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
            required
          />
        </Field>
        <Btn type="submit">Jelszó mentése</Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
