import { createFileRoute } from "@tanstack/react-router";
import { PageThree } from "@/pages/PageThree";

export const Route = createFileRoute("/page-3")({
  head: () => ({
    meta: [
      { title: "The Final Mission | A Little Story Just for You" },
      {
        name: "description",
        content:
          "Enter a secret mission room, uncover a heartfelt proposal, and celebrate with Mochi.",
      },
      { property: "og:title", content: "The Final Mission | A Little Story Just for You" },
      {
        property: "og:description",
        content: "A playful interdimensional mission leads to a very special message.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageThree,
});
