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

  it("renders vintage parchment card with botanical flourishes, couple vignette, and ornamental divider", () => {
    render(
      <Dialog open={true}>
        <DialogContent className="clue-dialog vintage-parchment-note">
          <div className="parchment-frame-decor" aria-hidden="true">
            <svg className="botanical-corner botanical-tl" viewBox="0 0 100 100" />
            <svg className="botanical-corner botanical-tr" viewBox="0 0 100 100" />
            <svg className="botanical-corner botanical-br" viewBox="0 0 100 100" />
            <img src="/test-couple.jpg" alt="" className="vintage-embracing-couple-art" />
          </div>
          <div className="parchment-content-layer">
            <header className="parchment-header">
              <DialogTitle className="parchment-title font-display">
                A Little Sweetness for You
              </DialogTitle>
              <div className="parchment-divider" aria-hidden="true">
                <span className="divider-line" />
                <span className="divider-motif">❧ ♡ ☙</span>
                <span className="divider-line" />
              </div>
            </header>
            <blockquote className="handwritten-note parchment-message-text">
              They say chocolate makes life sweeter...
            </blockquote>
            <DialogDescription className="clue-dialogue parchment-dialogue">
              Chocolate! A perfect discovery.
            </DialogDescription>
            <button className="story-action parchment-close-btn">Close</button>
          </div>
        </DialogContent>
      </Dialog>,
    );

    const parchmentCard = document.querySelector(".vintage-parchment-note");
    expect(parchmentCard).not.toBeNull();

    const coupleArt = document.querySelector(".vintage-embracing-couple-art");
    expect(coupleArt).not.toBeNull();

    const botanicalFlourishes = document.querySelectorAll(".botanical-corner");
    expect(botanicalFlourishes.length).toBe(3);

    const divider = document.querySelector(".parchment-divider");
    expect(divider).not.toBeNull();

    const messageText = document.querySelector(".parchment-message-text");
    expect(messageText).not.toBeNull();
    expect(messageText?.textContent).toContain("They say chocolate makes life sweeter");
  });
});
