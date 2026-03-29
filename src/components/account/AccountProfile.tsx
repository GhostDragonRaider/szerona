import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "./accountShared";

export function AccountProfile() {
  const { user, updateDisplayName } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");

  useEffect(() => {
    if (user) setName(user.displayName);
  }, [user]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateDisplayName(name);
    setMsg({ ok: true, text: "Profil mentve." });
  }

  return (
    <Box>
      <Title>Profil</Title>
      <Lead>
        A megjelenített neved és a belépési neved. A felhasználónév nem
        változtatható.
      </Lead>
      <form onSubmit={handleSubmit}>
        <Field>
          Felhasználónév
          <Input value={user.username} readOnly disabled />
        </Field>
        <Field>
          Megjelenített név
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Btn type="submit">Mentés</Btn>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
