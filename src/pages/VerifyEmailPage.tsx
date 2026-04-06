import styled from "@emotion/styled";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Lead, Msg, Title } from "../components/account/accountShared";

const verificationRequestCache = new Map<
  string,
  Promise<{ ok: boolean; message?: string }>
>();

const Page = styled.main`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.md};
`;

const LinkLine = styled.p`
  margin: ${({ theme }) => theme.space.lg} 0 0;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  margin-top: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  text-decoration: none;
  font-weight: 700;
  box-sizing: border-box;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    min-width: 220px;
  }
`;

export function VerifyEmailPage() {
  const { confirmEmailVerification } = useAuth();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const [state, setState] = useState<{
    loading: boolean;
    ok: boolean | null;
    text: string;
  }>({
    loading: true,
    ok: null,
    text: "Ellenőrizzük a megerősítő linkedet...",
  });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        if (!cancelled) {
          setState({
            loading: false,
            ok: false,
            text: "A megerősítő link hiányos vagy hibás.",
          });
        }
        return;
      }

      let request = verificationRequestCache.get(token);
      if (!request) {
        request = confirmEmailVerification(token);
        verificationRequestCache.set(token, request);
      }

      const result = await request;
      if (cancelled) return;

      setState({
        loading: false,
        ok: result.ok,
        text:
          result.message ??
          (result.ok
            ? "Az e-mail címed sikeresen meg lett erősítve."
            : "A megerősítés nem sikerült."),
      });
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [confirmEmailVerification, token]);

  return (
    <Page>
      <Box>
        <Title>E-mail megerősítése</Title>
        <Lead>
          A Serona-fiók véglegesítéséhez a rendszer a link érvényességét és a
          megerősítő tokent ellenőrzi.
        </Lead>
        <Msg ok={state.ok ?? undefined}>{state.text}</Msg>
        {!state.loading && state.ok ? (
          <ActionLink to="/">Tovább a főoldalra</ActionLink>
        ) : null}
        <LinkLine>
          <Link to="/">Vissza a kezdőlapra</Link>
        </LinkLine>
      </Box>
    </Page>
  );
}
