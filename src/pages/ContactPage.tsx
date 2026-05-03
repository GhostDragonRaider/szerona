import styled from "@emotion/styled";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../lib/api";

const Page = styled.main`
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 4rem) ${({ theme }) => theme.space.md};
  box-sizing: border-box;
`;

const Hero = styled.section`
  margin-bottom: ${({ theme }) => theme.space.xl};
  padding: clamp(1.5rem, 5vw, 3rem);
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(2rem, 7vw, 4rem);
`;

const Lead = styled.p`
  margin: 0;
  max-width: 720px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 0.8fr 1.2fr;
  }
`;

const Card = styled.section`
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Heading = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 1.25rem;
`;

const ContactLine = styled.a`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  font-weight: 700;
`;

const Field = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  min-height: 46px;
  box-sizing: border-box;
  margin-top: 6px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  box-sizing: border-box;
  margin-top: 6px;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  resize: vertical;
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

const Feedback = styled.p<{ $ok?: boolean }>`
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.accent)};
`;

interface ContactResponse {
  ok: boolean;
  contact: {
    phone: string;
    email: string;
  };
}

export function ContactPage() {
  const [contact, setContact] = useState({ phone: "", email: "" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContact() {
      try {
        const response = await apiFetch<ContactResponse>("/api/contact");
        if (!cancelled) {
          setContact(response.contact);
        }
      } catch {
        if (!cancelled) {
          setContact({ phone: "+36 30 000 0000", email: "info@serona.hu" });
        }
      }
    }

    void loadContact();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await apiFetch<{ ok: boolean; message?: string }>(
        "/api/contact/messages",
        {
          method: "POST",
          json: { name, email, message },
        },
      );
      setFeedback({
        ok: true,
        text: response.message ?? "Köszönjük, az üzenetet rögzítettük.",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      setFeedback({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült elküldeni az üzenetet.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Page>
      <Hero>
        <Title>Kapcsolat</Title>
        <Lead>
          Kérdésed, észrevételed vagy rendelés előtti kérésed van? Írj nekünk az
          űrlapon, vagy keress közvetlenül az alábbi elérhetőségeken.
        </Lead>
      </Hero>
      <Grid>
        <Card>
          <Heading>Elérhetőségek</Heading>
          <ContactLine href={`tel:${contact.phone}`}>{contact.phone}</ContactLine>
          <ContactLine href={`mailto:${contact.email}`}>{contact.email}</ContactLine>
        </Card>
        <Card>
          <Heading>Üzenet küldése</Heading>
          <form onSubmit={submitMessage}>
            <Field>
              Név
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
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
            <Field>
              Üzenet
              <TextArea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </Field>
            {feedback ? <Feedback $ok={feedback.ok}>{feedback.text}</Feedback> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Küldés..." : "Üzenet küldése"}
            </Button>
          </form>
        </Card>
      </Grid>
    </Page>
  );
}
