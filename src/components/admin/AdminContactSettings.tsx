import styled from "@emotion/styled";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api";

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
`;

const Lead = styled.p`
  max-width: 720px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

const Field = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  display: block;
  width: min(640px, 100%);
  box-sizing: border-box;
  margin-top: 6px;
  min-height: 48px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

const Button = styled.button`
  min-height: 48px;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 700;
  cursor: pointer;
`;

const Message = styled.p<{ $ok?: boolean }>`
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.accent)};
`;

interface ContactSettingsResponse {
  ok: boolean;
  message?: string;
  settings: {
    phone: string;
    email: string;
  };
}

export function AdminContactSettings() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await apiFetch<ContactSettingsResponse>(
          "/api/admin/contact-settings",
          { auth: true },
        );
        setPhone(response.settings.phone);
        setEmail(response.settings.email);
      } catch (error) {
        setMessage({
          ok: false,
          text:
            error instanceof Error
              ? error.message
              : "Nem sikerült betölteni a kapcsolat adatokat.",
        });
      }
    }

    void loadSettings();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setMessage(null);
    try {
      const response = await apiFetch<ContactSettingsResponse>(
        "/api/admin/contact-settings",
        {
          method: "PATCH",
          auth: true,
          json: { phone, email },
        },
      );
      setPhone(response.settings.phone);
      setEmail(response.settings.email);
      setMessage({
        ok: true,
        text: response.message ?? "A kapcsolat menüpont adatai mentve.",
      });
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült menteni a kapcsolat adatokat.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <Title>Kapcsolat menüpont adatok</Title>
      <Lead>
        Ezek az adatok jelennek meg a publikus Kapcsolat oldalon a hamburger
        menüből megnyitva.
      </Lead>
      {message ? <Message $ok={message.ok}>{message.text}</Message> : null}
      <form onSubmit={save}>
        <Field>
          Telefonszám
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </Field>
        <Field>
          E-mail cím
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Mentés..." : "Mentés"}
        </Button>
      </form>
    </section>
  );
}
