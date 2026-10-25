import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

describe("Page 2 Object Pop-Up Centering & Overlay", () => {
  it("renders with a full-screen fixed flex centering overlay (.object-popup-overlay)", () => {
    render(
      <Dialog open={true}>
        <DialogContent className="clue-dialog">
          <DialogTitle>Chocolate box</DialogTitle>
          <DialogDescription>A delicious treat waiting inside.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const overlay = document.querySelector(".object-popup-overlay");
    expect(overlay).not.toBeNull();

    const dialogContent = document.querySelector(".clue-dialog");
    expect(dialogContent).not.toBeNull();
    expect(overlay?.contains(dialogContent)).toBe(true);
  });

  it("applies .object-popup class to DialogContent for relative positioning", () => {
    render(
      <Dialog open={true}>
        <DialogContent className="clue-dialog">
          <DialogTitle>A Little Gift</DialogTitle>
          <DialogDescription>Wrapped with a golden ribbon.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const dialogContent = document.querySelector(".clue-dialog");
    expect(dialogContent?.classList.contains("object-popup")).toBe(true);
    expect(dialogContent?.classList.contains("relative")).toBe(true);
  });

  it("renders accessible close button and triggers close event", () => {
    let openState = true;
    const handleOpenChange = (open: boolean) => {
      openState = open;
    };

    render(
      <Dialog open={openState} onOpenChange={handleOpenChange}>
        <DialogContent className="clue-dialog">
          <DialogTitle>Framed Picture</DialogTitle>
          <DialogDescription>A sweet memory from our favorite trip.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(openState).toBe(false);
  });
});
