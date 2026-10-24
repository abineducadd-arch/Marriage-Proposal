import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WelcomePage } from "@/pages/WelcomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Little Story Just for You ♡" },
      {
        name: "description",
        content: "Someone special has created a little adventure just for you...",
      },
      { property: "og:title", content: "A Little Story Just for You ♡" },
      {
        property: "og:description",
        content: "Someone special has created a little adventure just for you...",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomeChapter,
});

function WelcomeChapter() {
  const navigate = useNavigate();
  return (
    <WelcomePage
      onNext={() => {
        const isPreview =
          typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("preview") === "true";
        navigate({
          to: "/page-2",
          ...(isPreview ? { search: () => ({ preview: "true" }) } : {}),
        });
      }}
    />
  );
}
