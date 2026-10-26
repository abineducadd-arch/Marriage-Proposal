import { useEffect } from "react";
import { Mochi, type MochiExpression } from "@/components/Mochi";
import { DialogueBubble } from "@/components/DialogueBubble";
import { Button } from "@/components/ui/button";
import { speakMochiDialogue } from "@/lib/mochi-voice";

export function MochiGuide({
  text,
  expression = "happy",
  action,
  onAction,
  dark = false,
  autoSpeak = true,
}: {
  text: string;
  expression?: MochiExpression;
  action?: string;
  onAction?: () => void;
  dark?: boolean;
  autoSpeak?: boolean;
}) {
  useEffect(() => {
    if (autoSpeak && text) {
      speakMochiDialogue(text);
    }
  }, [text, autoSpeak]);

  return (
    <aside className={`mochi-guide ${dark ? "guide-dark" : ""}`} aria-label="Mochi's guidance">
      <div className="guide-bunny">
        <Mochi expression={expression} />
      </div>
      <div className="guide-words">
        <DialogueBubble text={text} visible />
        {action && (
          <Button className="story-action" onClick={onAction}>
            {action}
          </Button>
        )}
      </div>
    </aside>
  );
}
