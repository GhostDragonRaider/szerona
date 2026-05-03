import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
`;

const Lead = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
`;

const MessageCard = styled.article`
  margin-bottom: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Meta = styled.div`
  margin-bottom: ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`;

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const response = await apiFetch<{ ok: boolean; messages: ContactMessage[] }>(
          "/api/admin/contact-messages",
          { auth: true },
        );
        if (!cancelled) {
          setMessages(response.messages);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nem sikerült betölteni a beérkezett űrlapokat.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section>
      <Title>Beérkezett űrlapok</Title>
      <Lead>A Kapcsolat oldalon beküldött üzenetek időrendben.</Lead>
      {isLoading ? <Lead>Üzenetek betöltése...</Lead> : null}
      {error ? <Lead>{error}</Lead> : null}
      {!isLoading && messages.length === 0 ? <Lead>Még nincs beküldött üzenet.</Lead> : null}
      {messages.map((entry) => (
        <MessageCard key={entry.id}>
          <strong>{entry.name}</strong>
          <Meta>
            {entry.email} · {new Date(entry.createdAt).toLocaleString("hu-HU")}
          </Meta>
          <div>{entry.message}</div>
        </MessageCard>
      ))}
    </section>
  );
}
