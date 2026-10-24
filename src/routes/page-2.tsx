import { createFileRoute } from "@tanstack/react-router";
import { PageTwo } from "@/pages/PageTwo";

export const Route = createFileRoute("/page-2")({
  head: () => ({
    meta: [
      { title: "The Mysterious Door | A Little Story Just for You" },
      {
        name: "description",
        content: "Follow Mochi into a mysterious room and discover its little storybook secrets.",
      },
      { property: "og:title", content: "The Mysterious Door | A Little Story Just for You" },
      {
        property: "og:description",
        content: "A moonlit door, a little light, and a room full of secrets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageTwo,
});
