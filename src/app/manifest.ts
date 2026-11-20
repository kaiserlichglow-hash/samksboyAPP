
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SAMKS BOY APP",
    short_name: "SAMKS BOY",
    description:
      "Sistema pessoal de disciplina, academia, sono, investimentos e mercado financeiro.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#090909",
    theme_color: "#090909",
    orientation: "any",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
