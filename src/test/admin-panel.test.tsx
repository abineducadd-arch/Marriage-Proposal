import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { routeTree } from "@/routeTree.gen";
import { PersonalDetailsEditor } from "@/components/admin/PersonalDetailsEditor";
import { PageTwoMessagesEditor } from "@/components/admin/PageTwoMessagesEditor";
import { DEFAULT_PERSONAL_DETAILS, DEFAULT_PAGE_TWO } from "@/lib/proposal-config";

describe("Admin Panel & Navigation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("registers and matches the /admin route successfully", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes("/admin");

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.at(-1)?.routeId).toBe("/admin");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("renders PersonalDetailsEditor and fires onChange when inputs change", () => {
    let currentDetails = { ...DEFAULT_PERSONAL_DETAILS };
    const handleChange = (updated: typeof DEFAULT_PERSONAL_DETAILS) => {
      currentDetails = updated;
    };

    render(<PersonalDetailsEditor details={currentDetails} onChange={handleChange} />);

    const senderInput = screen.getByLabelText(/Sender's Name/i);
    const recipientInput = screen.getByLabelText(/Recipient's Name/i);

    fireEvent.change(senderInput, { target: { value: "Romeo" } });
    expect(currentDetails.senderName).toBe("Romeo");

    fireEvent.change(recipientInput, { target: { value: "Juliet" } });
    expect(currentDetails.recipientName).toBe("Juliet");
  });

  it("renders PageTwoMessagesEditor and allows editing chocolate note", () => {
    let currentMessages = { ...DEFAULT_PAGE_TWO };
    const handleChange = (updated: typeof DEFAULT_PAGE_TWO) => {
      currentMessages = updated;
    };

    render(<PageTwoMessagesEditor messages={currentMessages} onChange={handleChange} />);

    // Check that title input exists and has default chocolate title
    const titleInput = screen.getByLabelText(/Message Title/i) as HTMLInputElement;
    expect(titleInput.value).toBe(DEFAULT_PAGE_TWO.chocolate.title);

    // Edit message body
    const clueTextarea = screen.getByLabelText(/Romantic Message Body/i) as HTMLTextAreaElement;
    fireEvent.change(clueTextarea, { target: { value: "You are the sweetest part of my day." } });

    expect(currentMessages.chocolate.clue).toBe("You are the sweetest part of my day.");
  });

  it("resets an individual Page 2 message to default", () => {
    let currentMessages = {
      ...DEFAULT_PAGE_TWO,
      chocolate: {
        title: "Changed Title",
        clue: "Changed Clue",
      },
    };
    const handleChange = (updated: typeof DEFAULT_PAGE_TWO) => {
      currentMessages = updated;
    };

    render(<PageTwoMessagesEditor messages={currentMessages} onChange={handleChange} />);

    const resetButton = screen.getByRole("button", { name: /Reset this note/i });
    fireEvent.click(resetButton);

    expect(currentMessages.chocolate.title).toBe(DEFAULT_PAGE_TWO.chocolate.title);
    expect(currentMessages.chocolate.clue).toBe(DEFAULT_PAGE_TWO.chocolate.clue);
  });
});
