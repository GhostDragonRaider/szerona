/**
 * Keresőmező: szinkronban van a SearchContext-tel; placeholder és törlés gomb.
 */
import styled from "@emotion/styled";
import { useSearch } from "../../context/SearchContext";

const Wrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: min(420px, 100%);
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  padding-right: 2.5rem;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentSoft};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Clear = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #000000;
    color: #ffffff;
  }
`;

export function SearchBar() {
  const { query, setQuery } = useSearch();
  return (
    <Wrap>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Keresés termékek között…"
        aria-label="Termékkereső"
      />
      {query ? (
        <Clear type="button" onClick={() => setQuery("")} title="Törlés">
          ×
        </Clear>
      ) : null}
    </Wrap>
  );
}
