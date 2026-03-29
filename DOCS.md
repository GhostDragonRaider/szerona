# Serona webshop – fejlesztői dokumentáció

## Áttekintés

A **Serona** egy React + TypeScript alapú, **CSS fájlok nélküli** frontend webshop. A stílusokat **@emotion/react** és **@emotion/styled** biztosítja. A build eszköz a **Vite 6**.

## Előfeltételek

- **Node.js** (ajánlott: LTS)
- **npm** (a projekt a `package-lock.json` alapján telepít függőségeket)

## Telepítés és futtatás

```bash
npm install
npm run dev
```

A fejlesztői szerver alapértelmezés szerint a `http://localhost:5173` címen érhető el.

Éles build:

```bash
npm run build
npm run preview
```

A kimenet a `dist/` mappa. A statikus fájlok (termékképek) a `public/` mappából kerülnek a gyökér alá (pl. `/pictures/...`).

## Projektstruktúra (rövid)

| Útvonal | Szerep |
|--------|--------|
| `src/main.tsx` | React mount, globális Emotion reset, `BrowserRouter`, `AppProviders` |
| `src/App.tsx` | Útvonalak: kezdőlap, bolt, admin |
| `src/providers/AppProviders.tsx` | Kontextusok sorrendje + dinamikus téma |
| `src/theme/` | Emotion téma, típus bővítés |
| `src/data/` | Típusok, kezdeti termékek, hírek, kategória címkék |
| `src/context/` | Termékek, kosár, auth, kereső, beállítások, **világos/sötét mód** (`ThemeModeContext`) |
| `src/components/` | UI komponensek (layout, home, shop, cart, auth, admin) |
| `src/pages/` | Összetett oldalak (pl. `HomePage`) |
| `src/routes/` | Védett útvonal (admin) |
| `public/pictures/` | Termékfotók URL-jei (`/pictures/...`) |

Minden releváns forrásfájl tetején magyarázó **fájl szintű komment** található; a fontosabb logikák mellett **soron belüli kommentek** segítik az olvasást.

## Funkciók

### Vásárlói felület

- **Kezdőlap**: hero, automatikusan görgető terméksáv (CSS animáció), kategória rács, hírek (kikapcsolható).
- **Bolt**: kategória szűrő (URL query: `?category=polo` stb.), **globális kereső** (fejléc + termék név/leírás).
- **Kosár**: oldalsó panel, mennyiség, összeg, ürítés; állapot **localStorage**-ban.

### Regisztráció és belépés

- **Regisztráció**: mock tárolás `localStorage`-ban (jelszó titkosítás nélkül – csak demó).
- **Belépés**: ugyanígy mock.
- **Admin**: felhasználónév `admin`, jelszó alapból `admin`. A jelszó az **Admin → Általános beállítások** panelen módosítható; a rendszer a `szerona_admin_password_v1` kulcsot használja.

### Admin felület (`/admin`)

Csak **admin** szerepkörrel elérhető (vagy `admin` / tárolt jelszó páros).

- **Termékek kezelése**: lista, kategória + szöveg szerinti szűrés, szerkesztés, törlés, új termék.
- **Általános**: hero szövegek, kiemelő szín (hex), hírek / kategória sáv ki-bekapcsolása, admin jelszó csere.

## Témázás és beállítások

- Alap témák: `src/theme/emotionTheme.ts` – **`seronaThemeDark`** és **`seronaThemeLight`** (közös tipográfia, térközök, eltérő színek és árnyékok).
- **Világos / sötét mód**: `ThemeModeContext` + fejléc / admin **`ThemeToggle`** (☀️ / 🌙). Állapot: `localStorage` kulcs `szerona_color_mode_v1`; első látogatáskor, ha nincs mentett érték, a böngésző `prefers-color-scheme` beállítása számít.
- A `document.documentElement` kap `data-color-mode` és `color-scheme` attribútumot a natív böngésző elemekhez.
- Az **Admin** panelben megadott **accent szín** továbbra is felülírja a kiemelő színt (és a gradient egy részét) a `DynamicTheme` rétegben, **mindkét** színsémában.

## Fontok

A `index.html` a Google Fonts-ról tölti a **Bebas Neue** (display) és **DM Sans** (szöveg) betűket.

## Ismert korlátok (demó)

- Nincs valódi fizetés és szállítás.
- Felhasználói jelszavak titkosítás nélkül tárolódnak a böngészőben.
- A termék- és beállításadatok **localStorage**-ban vannak; másik böngészőben / gépen nem szinkronizálnak.

## Hibaelhárítás

- **`tsc` / `vite: not found`**: bizonyos (pl. kettőspontot tartalmazó) útvonalakon az npm scriptek nem találják a binárisokat. A `package.json` a `node node_modules/...` közvetlen hívást használja.
- **Képek nem látszanak**: ellenőrizd, hogy a `public/pictures/` alatt megvannak-e a fájlok, és az URL `/pictures/...` formátumú-e.

## Verzió

Projekt: `package.json` → `version` mező. Build dátuma: helyi gépen a `npm run build` futtatásakor.
