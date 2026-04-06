import styled from "@emotion/styled";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Btn, Field, Input, Lead, Msg, Title } from "../components/account/accountShared";

const Page = styled.main`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
`;

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const initialToken = useMemo(() => params.get("token") ?? "", [params]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    if (password !== password2) {
      setMessage({ ok: false, text: "Az uj jelszavak nem egyeznek." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);
    setMessage({
      ok: result.ok,
      text:
        result.message ??
        (result.ok
          ? "A jelszo sikeresen frissult."
          : "Nem sikerult visszaallitani a jelszot."),
    });
  }

  return (
    <Page>
      <Box>
        <Title>Jelszo visszaallitasa</Title>
        <Lead>
          Add meg a visszaallitasi tokenedet, majd az uj jelszot ketszer.
        </Lead>
        <form onSubmit={handleSubmit}>
          <Field>
            Token
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </Field>
          <Field>
            Uj jelszo
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={4}
              required
            />
          </Field>
          <Field>
            Uj jelszo ujra
            <Input
              type="password"
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={4}
              required
            />
          </Field>
          <Btn type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mentés..." : "Jelszo frissitese"}
          </Btn>
          {message ? <Msg ok={message.ok}>{message.text}</Msg> : null}
        </form>
        <Lead css={{ marginTop: "1rem" }}>
          <Link to="/">Vissza a kezdolapra</Link>
        </Lead>
      </Box>
    </Page>
  );
}
