import { Mochi, type MochiExpression } from "@/components/Mochi";
import { DialogueBubble } from "@/components/DialogueBubble";
import { Button } from "@/components/ui/button";

export function MochiGuide({
  text,
  expression = "happy",
  action,
  onAction,
  dark = false,
}: {
  text: string;
  expression?: MochiExpression;
  action?: string;
  onAction?: () => void;
  dark?: boolean;
}) {
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
