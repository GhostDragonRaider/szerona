import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Btn,
  BtnGhost,
  Field,
  Input,
  Lead,
  Msg,
  Title,
} from "./accountShared";

export function AccountProfile() {
  const { user, logoutAllSessions, updateDisplayName } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOutEverywhere, setIsLoggingOutEverywhere] = useState(false);

  useEffect(() => {
    if (user) setName(user.displayName);
  }, [user]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMsg(null);
    const result = await updateDisplayName(name);
    setIsSubmitting(false);
    setMsg({
      ok: result.ok,
      text: result.message ?? (result.ok ? "Profil mentve." : "Hiba tortent."),
    });
  }

  async function handleLogoutEverywhere() {
    if (isLoggingOutEverywhere) return;
    setIsLoggingOutEverywhere(true);
    setMsg(null);
    const result = await logoutAllSessions();
    setIsLoggingOutEverywhere(false);
    setMsg({
      ok: result.ok,
      text:
        result.message ??
        (result.ok
          ? "Minden eszkozrol kijelentkeztettel."
          : "Nem sikerult a kijelentkeztetes minden eszkozrol."),
    });
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
            disabled={isSubmitting}
          />
        </Field>
        <Btn type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mentes..." : "Mentés"}
        </Btn>
        <BtnGhost
          type="button"
          onClick={() => {
            void handleLogoutEverywhere();
          }}
          disabled={isLoggingOutEverywhere}
          css={{ marginTop: "0.75rem" }}
        >
          {isLoggingOutEverywhere
            ? "Kijelentkeztetes..."
            : "Kijelentkeztetes minden eszkozrol"}
        </BtnGhost>
        {msg ? <Msg ok={msg.ok}>{msg.text}</Msg> : null}
      </form>
    </Box>
  );
}
