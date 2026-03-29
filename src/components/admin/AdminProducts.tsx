/**
 * Admin terméklista: kategória szerinti szűrő, szöveges kereső, törlés, űrlap új/szerkesztett termékhez.
 */
import styled from "@emotion/styled";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useProducts } from "../../context/ProductsContext";
import { CATEGORY_LABELS } from "../../data/categoryLabels";
import type { Product, ProductCategory } from "../../data/types";

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: clamp(0.85rem, 2.8vw, 0.95rem);
  line-height: 1.5;
  max-width: 65ch;
`;

const Head = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  line-height: 1.2;
`;

const Filters = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  align-items: stretch;
  margin-bottom: ${({ theme }) => theme.space.lg};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 1 1 200px;
  }
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  min-height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  min-height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font-size: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    min-width: 200px;
    width: auto;
  }
`;

const TableScroll = styled.div`
  display: none;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: ${({ theme }) => theme.space.md};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.space.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.space.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const TableActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
  align-items: center;
`;

const Thumb = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.productImageBg};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const Btn = styled.button`
  padding: 10px 14px;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 0.9rem;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const BtnDanger = styled(Btn)`
  border-color: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accent};
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.lg};
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const ProductCard = styled.article`
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.md};
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: ${({ theme }) => theme.space.md};
  align-items: start;
`;

const CardBody = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const CardName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.3;
  word-break: break-word;
`;

const CardMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const CardPrice = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-top: ${({ theme }) => theme.space.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const CardActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.xs};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    flex-wrap: wrap;
  }
`;

const FormBox = styled.div`
  margin-top: ${({ theme }) => theme.space.xl};
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  max-width: 100%;
  box-sizing: border-box;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.space.lg};
  }
`;

const FormTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 1.1rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};
  grid-template-columns: 1fr;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const TextArea = styled.textarea`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  min-height: 88px;
  width: 100%;
  box-sizing: border-box;
  font-size: 1rem;
  resize: vertical;
`;

const FullSpan = styled.div`
  grid-column: 1 / -1;
`;

const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.sm};
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const SaveBtn = styled.button`
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  min-height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  font-size: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: auto;
    max-width: 280px;
  }
`;

const categories: (ProductCategory | "all")[] = [
  "all",
  "polo",
  "pulover",
  "nadrag",
  "cipo",
];

export function AdminProducts() {
  const { products, removeProduct, updateProduct, addProduct } = useProducts();
  const [catFilter, setCatFilter] = useState<ProductCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCat, setFormCat] = useState<ProductCategory>("polo");
  const [formImage, setFormImage] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = catFilter === "all" || p.category === catFilter;
      if (!catOk) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, catFilter, search]);

  function startEdit(p: Product) {
    setEditing(p);
    setFormName(p.name);
    setFormPrice(String(p.price));
    setFormCat(p.category);
    setFormImage(p.image);
    setFormDesc(p.description);
  }

  function clearForm() {
    setEditing(null);
    setFormName("");
    setFormPrice("");
    setFormCat("polo");
    setFormImage("/pictures/serona-01-tshirt-black.png");
    setFormDesc("");
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const price = parseInt(formPrice, 10);
    if (Number.isNaN(price) || price < 0) return;
    if (editing) {
      updateProduct(editing.id, {
        name: formName,
        price,
        category: formCat,
        image: formImage,
        description: formDesc,
      });
    } else {
      addProduct({
        name: formName,
        price,
        category: formCat,
        image: formImage,
        description: formDesc,
      });
    }
    clearForm();
  }

  return (
    <div>
      <Head>
        <Title>Termékek</Title>
        <Hint>
          Szűrj kategória és szöveg szerint; szerkesztéshez kattints a Sor szerkesztése
          gombra.
        </Hint>
      </Head>
      <Filters>
        <Field>
          Kategória
          <Select
            value={catFilter}
            onChange={(e) =>
              setCatFilter(e.target.value as ProductCategory | "all")
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Összes" : CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          Keresés (név / leírás)
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="pl. póló"
          />
        </Field>
      </Filters>
      <CardList aria-label="Termékek kártyanézet">
        {filtered.map((p) => (
          <ProductCard key={p.id}>
            <Thumb src={p.image} alt="" />
            <CardBody>
              <CardName>{p.name}</CardName>
              <CardMeta>{CATEGORY_LABELS[p.category]}</CardMeta>
              <CardPrice>{p.price.toLocaleString("hu-HU")} Ft</CardPrice>
            </CardBody>
            <CardActions>
              <Btn type="button" onClick={() => startEdit(p)}>
                Szerkesztés
              </Btn>
              <BtnDanger
                type="button"
                onClick={() => {
                  if (confirm("Biztosan törlöd ezt a terméket?")) {
                    removeProduct(p.id);
                    if (editing?.id === p.id) clearForm();
                  }
                }}
              >
                Törlés
              </BtnDanger>
            </CardActions>
          </ProductCard>
        ))}
      </CardList>
      <TableScroll>
        <Table>
        <thead>
          <tr>
            <Th>Kép</Th>
            <Th>Név</Th>
            <Th>Csoport</Th>
            <Th>Ár (Ft)</Th>
            <Th>Művelet</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <Td>
                <Thumb src={p.image} alt="" />
              </Td>
              <Td>{p.name}</Td>
              <Td>{CATEGORY_LABELS[p.category]}</Td>
              <Td>{p.price.toLocaleString("hu-HU")}</Td>
              <Td>
                <TableActions>
                  <Btn type="button" onClick={() => startEdit(p)}>
                    Szerkesztés
                  </Btn>
                  <BtnDanger
                    type="button"
                    onClick={() => {
                      if (confirm("Biztosan törlöd ezt a terméket?")) {
                        removeProduct(p.id);
                        if (editing?.id === p.id) clearForm();
                      }
                    }}
                  >
                    Törlés
                  </BtnDanger>
                </TableActions>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      </TableScroll>

      <FormBox>
        <FormTitle>{editing ? "Termék szerkesztése" : "Új termék"}</FormTitle>
        <form onSubmit={handleSave}>
          <FormGrid>
            <Field>
              Név
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </Field>
            <Field>
              Ár (Ft)
              <Input
                type="number"
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </Field>
            <Field>
              Kategória
              <Select
                value={formCat}
                onChange={(e) =>
                  setFormCat(e.target.value as ProductCategory)
                }
              >
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ),
                )}
              </Select>
            </Field>
            <Field>
              Kép URL (pl. /pictures/…)
              <Input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                required
              />
            </Field>
            <FullSpan>
              <Field>
                Leírás
                <TextArea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                />
              </Field>
            </FullSpan>
            <FormActions>
              <SaveBtn type="submit">
                {editing ? "Mentés" : "Termék hozzáadása"}
              </SaveBtn>
              {editing ? (
                <Btn type="button" onClick={clearForm}>
                  Mégse szerkesztés
                </Btn>
              ) : null}
            </FormActions>
          </FormGrid>
        </form>
      </FormBox>
    </div>
  );
}
