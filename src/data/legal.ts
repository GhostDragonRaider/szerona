export const TERMS_VERSION = "2026-04-06";
export const PRIVACY_VERSION = "2026-04-06";
export const COOKIE_VERSION = "2026-04-06";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  version: string;
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
}

export const LEGAL_OPERATOR = {
  brandName: "Serona",
  siteUrl: "https://serona.hu",
  supportEmail: "support@serona.hu",
  privacyEmail: "privacy@serona.hu",
  noReplyEmail: "noreply@serona.hu",
  operatorName: "Serona webáruház üzemeltetője",
  operatorSeat: "Az üzemeltető székhelye – élesítés előtt kitöltendő",
  operatorRegistry:
    "Cégjegyzékszám / egyéni vállalkozói nyilvántartási szám – élesítés előtt kitöltendő",
  operatorTaxNumber: "Adószám – élesítés előtt kitöltendő",
  representative: "Képviselő neve – élesítés előtt kitöltendő",
  complaintAddress:
    "Panaszkezelési postacím – élesítés előtt kitöltendő",
  dataProtectionAuthority:
    "Nemzeti Adatvédelmi és Információszabadság Hatóság, 1055 Budapest, Falk Miksa utca 9-11., https://naih.hu",
};

const introNotice = [
  `Ez a dokumentum a ${LEGAL_OPERATOR.brandName} webáruházhoz készült, a hatályos magyar elektronikus kereskedelmi és fogyasztóvédelmi szabályok, valamint az EU 2016/679 rendelet (GDPR) szerkezetét követve.`,
  "Mivel a projektben jelenleg nem szerepel minden kötelező vállalkozási azonosító adat, az üzemeltető azonosító mezőit élesítés előtt kötelezően a tényleges cég- vagy egyéni vállalkozói adatokkal feltölteni és jogi kontrollal ellenőrizni.",
];

export const TERMS_DOCUMENT: LegalDocument = {
  title: "Általános Szerződési Feltételek",
  version: TERMS_VERSION,
  lastUpdated: "2026. április 6.",
  intro: introNotice,
  sections: [
    {
      title: "1. Szolgáltatói adatok",
      paragraphs: [
        `A webáruház megnevezése: ${LEGAL_OPERATOR.brandName}.`,
        `A webáruház internetes címe: ${LEGAL_OPERATOR.siteUrl}.`,
        `Az üzemeltető neve: ${LEGAL_OPERATOR.operatorName}.`,
        `Székhely: ${LEGAL_OPERATOR.operatorSeat}.`,
        `Nyilvántartási azonosító: ${LEGAL_OPERATOR.operatorRegistry}.`,
        `Adószám: ${LEGAL_OPERATOR.operatorTaxNumber}.`,
        `Képviselő: ${LEGAL_OPERATOR.representative}.`,
        `Kapcsolattartási e-mail cím: ${LEGAL_OPERATOR.supportEmail}.`,
        `Panaszkezelési cím: ${LEGAL_OPERATOR.complaintAddress}.`,
      ],
    },
    {
      title: "2. Az ÁSZF tárgya és hatálya",
      paragraphs: [
        "A jelen Általános Szerződési Feltételek a webáruházban elérhető termékek online értékesítésére, valamint az ezekkel összefüggő elektronikus szerződéskötésre vonatkoznak.",
        "A jelen feltételek a fogyasztó és a szolgáltató között, a webáruházon keresztül létrejövő valamennyi megrendelésre és vásárlásra irányadóak.",
      ],
    },
    {
      title: "3. A megrendelés folyamata",
      bullets: [
        "A vásárló kiválasztja a terméket, kosárba helyezi, majd a pénztárban megadja a szükséges szállítási és számlázási adatokat.",
        "A vásárló a megrendelés véglegesítése előtt bármikor ellenőrizheti és javíthatja a megadott adatokat.",
        "A rendelés elküldésével a vásárló fizetési kötelezettséggel járó ajánlatot tesz.",
        "A szerződés a szolgáltató visszaigazolásával jön létre, amelyet a rendszer elektronikus úton küld meg.",
      ],
    },
    {
      title: "4. Termékek, árak és elérhetőség",
      paragraphs: [
        "A webáruházban feltüntetett árak forintban értendők. A szolgáltató a fogyasztói árakat egyértelműen, teljes összegben jeleníti meg.",
        "A szolgáltató mindent megtesz azért, hogy az oldalon megjelenített termékadatok, készletinformációk és árak pontosak legyenek, azonban az esetleges nyilvánvaló hibákért a szolgáltató nem vállal felelősséget.",
      ],
      bullets: [
        "A termékfotók illusztrációként szolgálhatnak, a tényleges termék árnyalata kisebb mértékben eltérhet.",
        "A készletinformációk a rendszer állapota alapján jelennek meg; több egyidejű rendelés esetén előfordulhat átmeneti készlethiány.",
      ],
    },
    {
      title: "5. Fizetési és szállítási feltételek",
      paragraphs: [
        "A webáruházban elérhető fizetési és szállítási módokat a pénztár oldala tartalmazza. A szolgáltató a teljesítés várható feltételeit minden rendelésnél külön feltünteti.",
        "Bankkártyás vagy egyéb online fizetési mód bekötése esetén a fizetés külső, szerződött fizetési szolgáltató rendszerén keresztül történik.",
      ],
    },
    {
      title: "6. Szállítási határidő és teljesítés",
      paragraphs: [
        "A szolgáltató a megrendelés visszaigazolását követően, a készlet rendelkezésre állása mellett teljesíti a rendelést.",
        "Amennyiben a szolgáltató a vállalt határidőn belül nem tud teljesíteni, erről haladéktalanul tájékoztatja a vásárlót.",
      ],
    },
    {
      title: "7. Elállási jog fogyasztók részére",
      paragraphs: [
        "A fogyasztót a jogszabályok szerint a termék átvételétől számított tizennégy napon belül indokolás nélküli elállási jog illeti meg távollévők között kötött szerződés esetén.",
        "Az elállási jog gyakorlásának részletes feltételeit és esetleges kivételeit a hatályos 45/2014. (II. 26.) Korm. rendelet szabályozza.",
      ],
      bullets: [
        "Az elállási szándékot egyértelmű nyilatkozattal kell jelezni a szolgáltató felé.",
        "A visszaküldés közvetlen költsége a fogyasztót terheli, kivéve, ha a szolgáltató ettől eltérően rendelkezik.",
        "A szolgáltató az elállással érintett összeget a jogszabályban meghatározott feltételek szerint téríti vissza.",
      ],
    },
    {
      title: "8. Kellékszavatosság, termékszavatosság, jótállás",
      paragraphs: [
        "A fogyasztót a Polgári Törvénykönyv, a kötelező jótállásról szóló szabályok és az egyéb fogyasztóvédelmi jogszabályok alapján a hibás teljesítéshez kapcsolódó jogok illetik meg.",
        "A szolgáltató a termékoldalon, illetve a rendelés során feltünteti, ha valamely termékre kötelező vagy önként vállalt jótállás vonatkozik.",
      ],
    },
    {
      title: "9. Panaszkezelés és jogérvényesítés",
      paragraphs: [
        `A vásárló a panaszát a szolgáltató részére az alábbi e-mail címen küldheti meg: ${LEGAL_OPERATOR.supportEmail}.`,
        "A szolgáltató a panaszokat a vonatkozó fogyasztóvédelmi előírásoknak megfelelően vizsgálja ki és válaszolja meg.",
      ],
      bullets: [
        "A fogyasztó lakóhelye vagy tartózkodási helye szerint illetékes békéltető testülethez fordulhat.",
        "A fogyasztó jogosult az Európai Bizottság online vitarendezési platformját is igénybe venni, ha annak működése az adott időpontban elérhető.",
        "A fogyasztó bírósági eljárást is kezdeményezhet a hatályos jogszabályok szerint.",
      ],
    },
    {
      title: "10. Felelősségkorlátozás",
      paragraphs: [
        "A szolgáltató nem felel az olyan működési zavarokért, amelyek a szolgáltató érdekkörén kívül eső technikai okból, vis maiorból vagy külső szolgáltató hibájából erednek.",
        "A szolgáltató nem zárja ki és nem korlátozza a fogyasztó jogszabályon alapuló, kötelező jogait.",
      ],
    },
    {
      title: "11. Szellemi tulajdon",
      paragraphs: [
        "A weboldalon elérhető minden tartalom, grafika, fotó, szöveg és egyéb megjelenés a szolgáltató vagy jogosult partnerei szellemi tulajdonát képezi, és csak jogszerű felhasználás keretében használható fel.",
      ],
    },
    {
      title: "12. Záró rendelkezések",
      paragraphs: [
        "A jelen ÁSZF-re a magyar jog szabályai irányadók.",
        "A szolgáltató jogosult az ÁSZF-et módosítani, amely módosítás a weboldalon való közzététellel lép hatályba a jövőbeni megrendelésekre.",
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  title: "Adatkezelési tájékoztató (GDPR)",
  version: PRIVACY_VERSION,
  lastUpdated: "2026. április 6.",
  intro: introNotice,
  sections: [
    {
      title: "1. Az adatkezelő adatai",
      paragraphs: [
        `Adatkezelő: ${LEGAL_OPERATOR.operatorName}.`,
        `Weboldal: ${LEGAL_OPERATOR.siteUrl}.`,
        `Székhely: ${LEGAL_OPERATOR.operatorSeat}.`,
        `Kapcsolattartási e-mail: ${LEGAL_OPERATOR.privacyEmail}.`,
        `Hatósági jogorvoslat: ${LEGAL_OPERATOR.dataProtectionAuthority}.`,
      ],
    },
    {
      title: "2. Az adatkezelés alapelvei",
      bullets: [
        "A személyes adatok kezelése jogszerűen, tisztességesen és átlátható módon történik.",
        "A kezelt adatok köre a célhoz kötöttség és az adattakarékosság elvéhez igazodik.",
        "A szolgáltató megfelelő technikai és szervezési intézkedésekkel gondoskodik a személyes adatok biztonságáról.",
      ],
    },
    {
      title: "3. Kezelt adatok köre és céljai",
      bullets: [
        "Regisztráció: felhasználónév, e-mail cím, jelszó hash, jogi elfogadások adatai, valamint a megerősítési státusz.",
        "Fiókkezelés: megjelenített név, kapcsolattartási adatok, számlázási adatok.",
        "Rendeléskezelés: rendelési tételek, szállítási és számlázási adatok, kapcsolattartási adatok, rendelési állapotok.",
        "Biztonság: munkamenet-azonosítók, frissítő tokenek hash-ei, IP-cím, user-agent, bejelentkezési korlátozások.",
        "Jelszó-visszaállítás és e-mail megerősítés: egyszer használható tokenek hash-ei, lejárati és felhasználási időpontok.",
      ],
    },
    {
      title: "4. Az adatkezelés jogalapjai",
      bullets: [
        "GDPR 6. cikk (1) bekezdés b) pont: szerződés megkötése és teljesítése, illetve a felhasználói fiók létrehozására irányuló lépések.",
        "GDPR 6. cikk (1) bekezdés c) pont: jogszabályi kötelezettségek teljesítése, például számviteli és fogyasztóvédelmi kötelezettségek.",
        "GDPR 6. cikk (1) bekezdés f) pont: jogos érdek alapján végzett biztonsági, csalásmegelőzési és rendszerüzemeltetési adatkezelés.",
      ],
    },
    {
      title: "5. Adatfeldolgozók és címzettek",
      paragraphs: [
        "A szolgáltató a rendszer működtetéséhez, a levelek kiküldéséhez, a tárhely és egyes technikai szolgáltatások biztosításához szerződött adatfeldolgozókat vehet igénybe.",
      ],
      bullets: [
        "Webtárhely- és infrastruktúra-szolgáltató – élesítés előtt pontosan megnevezendő.",
        "Tranzakciós e-mail szolgáltató: Resend, Inc. – fiókmegerősítő és jelszó-visszaállító levelek kiküldéséhez.",
        "Fizetési szolgáltató – bankkártyás fizetés élesítésekor a tényleges szolgáltatóval kiegészítendő.",
      ],
    },
    {
      title: "6. Adatmegőrzési idők",
      bullets: [
        "Fiókadatok: a felhasználói fiók fennállásáig, illetve a törlési igény jogszerű teljesítéséig.",
        "Rendelési és számlázási adatok: a vonatkozó számviteli és adójogi megőrzési idő végéig.",
        "Biztonsági és hozzáférési naplók: a biztonsági cél teljesítéséhez szükséges, arányos ideig.",
        "E-mail megerősítő és jelszó-visszaállító tokenek: a lejáratig vagy a felhasználásig, ezt követően törlésre vagy érvénytelenítésre kerülnek.",
      ],
    },
    {
      title: "7. Az érintettek jogai",
      bullets: [
        "Tájékoztatáshoz való jog.",
        "Hozzáféréshez való jog.",
        "Helyesbítéshez való jog.",
        "Törléshez való jog a jogszabályi korlátok figyelembevételével.",
        "Az adatkezelés korlátozásához való jog.",
        "Adathordozhatósághoz való jog, ha annak feltételei fennállnak.",
        "Tiltakozáshoz való jog a jogos érdeken alapuló adatkezeléssel szemben.",
        "Panasztételhez való jog a felügyeleti hatóságnál.",
      ],
    },
    {
      title: "8. Adatbiztonság",
      paragraphs: [
        "A szolgáltató az adatokat védi különösen a jogosulatlan hozzáférés, megváltoztatás, továbbítás, nyilvánosságra hozatal, törlés vagy megsemmisítés ellen.",
      ],
      bullets: [
        "Jelszavak hash-elt formában kerülnek tárolásra.",
        "A munkamenet- és helyreállítási tokenek a szerveren hash-elt formában kerülnek tárolásra.",
        "A rendszer hitelesítési és brute-force védelmi mechanizmusokat alkalmaz.",
      ],
    },
    {
      title: "9. Sütik, helyi tárolás és technikai azonosítók",
      paragraphs: [
        "A weboldal a működéshez szükséges technikai tárolást és helyi böngésző-adatokat használhat, különösen a munkamenet, a kosár és a felhasználói élmény fenntartása érdekében.",
        "Az olyan nem kötelező technológiák, amelyekhez külön hozzájárulás szükséges, csak a megfelelő tájékoztatás és hozzájárulás birtokában alkalmazhatók.",
        "A részletes kategóriákat, megőrzési időket és beállítási lehetőségeket a külön Sütitájékoztató tartalmazza.",
      ],
    },
    {
      title: "10. Jogorvoslat",
      paragraphs: [
        `Az érintett a ${LEGAL_OPERATOR.privacyEmail} címen gyakorolhatja jogait, továbbá panaszt nyújthat be a felügyeleti hatósághoz: ${LEGAL_OPERATOR.dataProtectionAuthority}.`,
      ],
    },
    {
      title: "11. A tájékoztató módosítása",
      paragraphs: [
        "A szolgáltató jogosult a jelen tájékoztatót módosítani. A módosított tájékoztató a weboldalon történő közzététellel lép hatályba.",
      ],
    },
  ],
};

export const COOKIE_DOCUMENT: LegalDocument = {
  title: "Sütitájékoztató",
  version: COOKIE_VERSION,
  lastUpdated: "2026. április 6.",
  intro: [
    `A ${LEGAL_OPERATOR.brandName} webáruház sütiket, helyi tárolási megoldásokat és egyéb technikai azonosítókat használhat a biztonságos működés, a kosár fenntartása és a felhasználói döntések megőrzése érdekében.`,
    "Ez a tájékoztató bemutatja az alkalmazott kategóriákat, a hozzájárulás kezelését, valamint azt, hogyan módosítható vagy visszavonható a döntés bármikor.",
  ],
  sections: [
    {
      title: "1. Az adatkezelő és elérhetőségei",
      paragraphs: [
        `Szolgáltató: ${LEGAL_OPERATOR.operatorName}.`,
        `Weboldal: ${LEGAL_OPERATOR.siteUrl}.`,
        `Kapcsolattartási e-mail: ${LEGAL_OPERATOR.privacyEmail}.`,
        `Panaszkezelési cím: ${LEGAL_OPERATOR.complaintAddress}.`,
      ],
    },
    {
      title: "2. Mik azok a sütik és technikai azonosítók?",
      paragraphs: [
        "A sütik olyan kis adatfájlok, amelyeket a böngésző az eszközön tárol. Hasonló célra a böngésző helyi tárolója és más technikai azonosítók is használhatók.",
        "Ezek a technológiák segítenek megkülönböztetni az egyes látogatásokat, fenntartani a munkamenetet, megőrizni a kosár tartalmát, valamint eltárolni a hozzájárulási döntést.",
      ],
    },
    {
      title: "3. Elengedhetetlen sütik és technikai tárolás",
      bullets: [
        "Hitelesítés és biztonság: a bejelentkezési folyamat, a munkamenet fenntartása, a jogosulatlan hozzáférés elleni védelem.",
        "Kosár és rendelés: a kosár tartalmának megőrzése, a rendelési lépések folytonossága, a választott szállítási és fizetési adatok technikai kezelése.",
        "Hozzájárulás megjegyzése: a sütibeállítások döntésének eltárolása, hogy a rendszer ne kérje be indokolatlanul újra ugyanazt a hozzájárulást.",
      ],
    },
    {
      title: "4. Funkcionális és kényelmi technológiák",
      paragraphs: [
        "A funkcionális kategória olyan nem kötelező tárolásokat fed le, amelyek a felhasználói élményt javítják, például később bevezetett megjelenítési vagy kényelmi preferenciák megőrzését.",
        "Ezek a technológiák kizárólag hozzájárulás alapján használhatók, és a hozzájárulás hiánya nem akadályozza meg az alapvető vásárlási folyamatot.",
      ],
    },
    {
      title: "5. Analitikai és marketing technológiák",
      paragraphs: [
        "Az analitikai sütik a weboldal használatának mérésére, a hibák feltárására és a szolgáltatás fejlesztésére szolgálhatnak. A marketing sütik kampányok, hirdetések és remarketing folyamatok mérésére használhatók.",
        "A Serona jelenlegi verziójában alapértelmezetten nincsenek aktív analitikai vagy marketing sütik. Ezek csak későbbi bekötés esetén, a felhasználó előzetes hozzájárulásával aktiválhatók.",
      ],
    },
    {
      title: "6. Tárolási idők",
      bullets: [
        "Sütibeállítások: a hozzájárulási döntés legfeljebb 180 napig kerül tárolásra, vagy a felhasználó korábbi módosításáig.",
        "Munkamenet és hitelesítés: a biztonsági célhoz és a bejelentkezési munkamenethez szükséges ideig.",
        "Kosáradatok: a böngésző helyi tárolójában a felhasználói folyamat fenntartásához szükséges ideig, illetve a felhasználó általi törlésig.",
      ],
    },
    {
      title: "7. Hozzájárulás kezelése és visszavonása",
      bullets: [
        "A weboldal első látogatásakor a felhasználó kiválaszthatja, hogy csak az elengedhetetlen sütiket engedélyezi, vagy külön beállítja az opcionális kategóriákat.",
        "A hozzájárulás bármikor módosítható a weboldal láblécében található Sütibeállítások gombbal.",
        "A böngésző beállításaiban a sütik egyedileg is törölhetők vagy blokkolhatók, azonban ez a webáruház egyes funkcióinak működését korlátozhatja.",
      ],
    },
    {
      title: "8. Jogalap és érintetti jogok",
      paragraphs: [
        "Az elengedhetetlen technológiák használata a szolgáltatás nyújtásához és a weboldal biztonságos működéséhez fűződő jogos érdekhez, illetve a kifejezetten kért szolgáltatás teljesítéséhez kapcsolódik.",
        "Az opcionális kategóriák használatának jogalapja a felhasználó önkéntes, előzetes hozzájárulása.",
        `Az érintett a ${LEGAL_OPERATOR.privacyEmail} címen kérhet tájékoztatást, illetve gyakorolhatja a GDPR szerinti jogait.`,
      ],
    },
  ],
};
