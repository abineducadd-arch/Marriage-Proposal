import { useState } from "react";
import { type ObjectId, OBJECTS } from "@/components/story/adventure";
import { type PageTwoConfig, DEFAULT_PAGE_TWO } from "@/lib/proposal-config";
import { ObjectArtwork } from "@/components/story/ObjectArtwork";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RotateCcw, Sparkles, KeyRound, CheckCircle2 } from "lucide-react";

interface PageTwoMessagesEditorProps {
  messages: PageTwoConfig;
  onChange: (updated: PageTwoConfig) => void;
}

const OBJECT_DETAILS: Record<
  ObjectId,
  { label: string; icon: string; description: string; dialogue: string }
> = {
  chocolate: {
    label: "Chocolate Box",
    icon: "🍫",
    description: "Found on the rug. Sweet and comforting words for your special person.",
    dialogue: OBJECTS.chocolate.dialogue,
  },
  gift: {
    label: "Wrapped Gift",
    icon: "🎁",
    description: "Found on the cozy table. Expressing how much of a gift they are in your life.",
    dialogue: OBJECTS.gift.dialogue,
  },
  picture: {
    label: "Framed Picture",
    icon: "🖼️",
    description: "Found on the wooden shelf. Celebrating timeless moments shared together.",
    dialogue: OBJECTS.picture.dialogue,
  },
};

export function PageTwoMessagesEditor({ messages, onChange }: PageTwoMessagesEditorProps) {
  const [selectedObject, setSelectedObject] = useState<ObjectId>("chocolate");

  const currentMessage = messages[selectedObject];
  const currentMeta = OBJECT_DETAILS[selectedObject];

  const updateMessage = (field: "title" | "clue", value: string) => {
    onChange({
      ...messages,
      [selectedObject]: {
        ...currentMessage,
        [field]: value,
      },
    });
  };

  const resetCurrentObject = () => {
    onChange({
      ...messages,
      [selectedObject]: {
        ...DEFAULT_PAGE_TWO[selectedObject],
      },
    });
  };

  const resetAllObjects = () => {
    onChange({
      chocolate: { ...DEFAULT_PAGE_TWO.chocolate },
      gift: { ...DEFAULT_PAGE_TWO.gift },
      picture: { ...DEFAULT_PAGE_TWO.picture },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Editor Column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Object Navigation Bar */}
        <div className="admin-card p-2 sm:p-3 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            {(Object.keys(OBJECTS) as ObjectId[]).map((id) => {
              const meta = OBJECT_DETAILS[id];
              const isSelected = selectedObject === id;
              const isCustomized =
                messages[id].title !== DEFAULT_PAGE_TWO[id].title ||
                messages[id].clue !== DEFAULT_PAGE_TWO[id].clue;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedObject(id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-rose-50 border border-rose-200 text-rose-900 shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-lg leading-none">{meta.icon}</span>
                  <span>{meta.label}</span>
                  {isCustomized && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" title="Customized note" />
                  )}
                </button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetAllObjects}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset all 3
          </Button>
        </div>

        {/* Selected Object Form */}
        <div className="admin-card p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-amber-50 rounded-xl border border-amber-200/50">
                {currentMeta.icon}
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>{currentMeta.label}</span>
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    Interactive Discovery Clue
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{currentMeta.description}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetCurrentObject}
              className="text-xs gap-1 border-dashed"
            >
              <RotateCcw className="w-3 h-3" />
              Reset this note
            </Button>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="messageTitle" className="font-medium text-foreground">
                Message Title
              </Label>
              <span className="text-xs text-muted-foreground">
                {currentMessage.title.length} characters
              </span>
            </div>
            <Input
              id="messageTitle"
              value={currentMessage.title}
              onChange={(e) => updateMessage("title", e.target.value)}
              placeholder="e.g. A Little Sweetness for You"
              className="bg-background/80 font-hand text-lg font-semibold tracking-wide"
            />
            <p className="text-xs text-muted-foreground">
              Displayed as the handwritten header in the story popup when found.
            </p>
          </div>

          {/* Clue Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="messageClue" className="font-medium text-foreground">
                Romantic Message Body
              </Label>
              <span className="text-xs text-muted-foreground">
                {currentMessage.clue.length} characters
              </span>
            </div>
            <Textarea
              id="messageClue"
              rows={5}
              value={currentMessage.clue}
              onChange={(e) => updateMessage("clue", e.target.value)}
              placeholder="Write your personal, heartwarming message here..."
              className="bg-background/80 leading-relaxed text-sm italic"
            />
            <p className="text-xs text-muted-foreground">
              Shown inside the clue parchment. Use tender words, shared memories, or sweet jokes.
            </p>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>How this works in the story:</span>
            </div>
            <p>
              The recipient must discover and inspect all 3 objects with the flashlight in the dark
              room before the secret door to Chapter 3 unlocks!
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
        <div className="admin-card p-5 border-rose-200/60 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-sm text-foreground">Popup Modal Live Preview</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {currentMeta.label}
            </span>
          </div>

          <div className="mt-4 preview-clue-card">
            <h4 className="preview-clue-title">{currentMessage.title || "Note Title"}</h4>

            <div className="w-24 h-24 mx-auto my-3 flex items-center justify-center p-2 rounded-xl bg-amber-50/50">
              <ObjectArtwork kind={selectedObject} />
            </div>

            <blockquote className="preview-clue-body">
              "{currentMessage.clue || "Your romantic message will appear right here..."}"
            </blockquote>

            <p className="text-xs text-rose-800/80 font-hand text-base mb-4">
              {currentMeta.dialogue}
            </p>

            <Button
              type="button"
              disabled
              className="rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs px-6 py-2 shadow-xs"
            >
              Close
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg p-2.5 mt-4">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Interactive click event and flashlight mechanics are preserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
