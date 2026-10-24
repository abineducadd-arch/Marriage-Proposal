import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Proposal Admin Panel ♡ | Personalize Your Story" },
      {
        name: "description",
        content: "Personalize names, romantic messages, and video for the proposal adventure.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});
