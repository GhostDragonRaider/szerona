/**
 * Kezdeti terméklista – a Serona katalógus mock adatai (képek: public/pictures).
 * Az admin felület ezt a listát módosíthatja (localStorage-ban tárolva).
 */
import type { Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Serona Essential – fekete póló",
    price: 12990,
    category: "polo",
    image: "/pictures/serona-01-tshirt-black.png",
    description: "Pamut keverék, minimal S logó.",
    isNew: true,
  },
  {
    id: "p2",
    name: "Serona Core – fehér póló",
    price: 12990,
    category: "polo",
    image: "/pictures/serona-02-tshirt-white.png",
    description: "Könnyű viselet, mindennapi stílus.",
  },
  {
    id: "p3",
    name: "Serona Sand – bézs póló",
    price: 13990,
    category: "polo",
    image: "/pictures/serona-03-tshirt-beige.png",
    description: "Semleges tónus, sokoldalú kombinálhatóság.",
    isNew: true,
  },
  {
    id: "p4",
    name: "Serona Track – fekete nadrág",
    price: 24990,
    category: "nadrag",
    image: "/pictures/serona-04-sweatpants-black.png",
    description: "Jogger fazon, kényelmes derékrész.",
  },
  {
    id: "p5",
    name: "Serona Summer – fehér short",
    price: 15990,
    category: "nadrag",
    image: "/pictures/serona-05-shorts-white.png",
    description: "Rövidnadrág, laza szabás.",
  },
  {
    id: "p6",
    name: "Serona Dune – bézs short",
    price: 15990,
    category: "nadrag",
    image: "/pictures/serona-06-shorts-beige.png",
    description: "Meleg napokra, puha anyag.",
  },
  {
    id: "p7",
    name: "Serona Hood – bézs pulóver",
    price: 28990,
    category: "pulover",
    image: "/pictures/serona-07-hoodie-beige.png",
    description: "Kapucnis pulóver, kenguru zsebbel.",
    isNew: true,
  },
  {
    id: "p8",
    name: "Serona Stride – fehér cipő",
    price: 45990,
    category: "cipo",
    image: "/pictures/serona-08-shoes-white.png",
    description: "Alacsony szárú sneaker, letisztult dizájn.",
  },
  {
    id: "p9",
    name: "Serona Night – fekete cipő",
    price: 45990,
    category: "cipo",
    image: "/pictures/serona-09-shoes-black.png",
    description: "Sötét felsőrész, kontrasztos logó.",
    isNew: true,
  },
];
