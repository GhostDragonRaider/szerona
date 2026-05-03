import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-family: ${({ theme }) => theme.fonts.display};
`;

const Card = styled.section`
  max-width: 720px;
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const Lead = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.55;
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

interface BackupState {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
}

export function AdminBackup() {
  const [backup, setBackup] = useState<BackupState | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isRestoring, setIsRestoring] = useState(false);

  async function loadBackup() {
    const response = await apiFetch<{ ok: boolean; backup: BackupState }>(
      "/api/admin/backup",
      { auth: true },
    );
    setBackup(response.backup);
  }

  useEffect(() => {
    void loadBackup().catch((error) =>
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült betölteni a mentési állapotot.",
      }),
    );
  }, []);

  async function restoreBackup() {
    const confirmed = window.confirm(
      "Biztosan visszaállítod a legutóbbi adatbázis mentést? A művelet előtt biztonsági másolat készül a jelenlegi állapotról.",
    );
    if (!confirmed || isRestoring) return;

    setIsRestoring(true);
    setMessage(null);
    try {
      const response = await apiFetch<{
        ok: boolean;
        message?: string;
        backup: BackupState;
      }>("/api/admin/backup/restore", {
        method: "POST",
        auth: true,
      });
      setBackup(response.backup);
      setMessage({
        ok: true,
        text:
          response.message ??
          "A legutóbbi biztonsági mentés visszaállítva.",
      });
    } catch (error) {
      setMessage({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "Nem sikerült visszaállítani a mentést.",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <section>
      <Title>Biztonsági mentések</Title>
      <Card>
        <Lead>
          A backend percenként mentést készít az SQLite adatbázisról, amely a
          felhasználókat, rendeléseket és termékadatokat tartalmazza.
        </Lead>
        <p>
          Utolsó mentés:{" "}
          <strong>
            {backup?.lastBackupAt
              ? new Date(backup.lastBackupAt).toLocaleString("hu-HU")
              : "még nincs adat"}
          </strong>
        </p>
        <p>
          Utolsó visszaállítás:{" "}
          <strong>
            {backup?.lastRestoreAt
              ? new Date(backup.lastRestoreAt).toLocaleString("hu-HU")
              : "nem történt"}
          </strong>
        </p>
        {message ? <Feedback $ok={message.ok}>{message.text}</Feedback> : null}
        <Button type="button" onClick={restoreBackup} disabled={isRestoring}>
          {isRestoring ? "Visszaállítás..." : "Legutóbbi mentés visszaállítása"}
        </Button>
      </Card>
    </section>
  );
}
