/**
 * Kezdő hírek / újdonságok – a főoldal „Hírek” szekciója ebből töltődik.
 * Szinkronban lehet a termékek isNew jelölésével (mock).
 */
import type { NewsItem } from "./types";

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Új Essential kollekció",
    excerpt:
      "A fekete–fehér–bézs trió mostantól egy helyen: pólók és nadrágok, amelyek minden szetthez passzolnak.",
    date: "2026. március 15.",
    image: "/pictures/serona-01-tshirt-black.png",
  },
  {
    id: "n2",
    title: "Stride cipő – utcai minimal",
    excerpt:
      "Két színben érkezett a Serona Stride: fehér és fekete felsőrész, könnyű talppal.",
    date: "2026. március 10.",
    image: "/pictures/serona-08-shoes-white.png",
  },
  {
    id: "n3",
    title: "Hood – bézs kapucnis",
    excerpt:
      "A tavaszi rétegezéshez: puha belső, diszkrét S logó, kenguru zseb.",
    date: "2026. március 5.",
    image: "/pictures/serona-07-hoodie-beige.png",
  },
];
