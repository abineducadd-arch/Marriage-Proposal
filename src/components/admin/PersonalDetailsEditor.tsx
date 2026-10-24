import { useState } from "react";
import {
  type PersonalDetails,
  DEFAULT_PERSONAL_DETAILS,
  getWelcomeDialogue,
  getPersonalizedProposalLetter,
} from "@/lib/proposal-config";
import { Mochi } from "@/components/Mochi";
import { DialogueBubble } from "@/components/DialogueBubble";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RotateCcw, Heart, Calendar, Sparkles, BookOpen } from "lucide-react";

interface PersonalDetailsEditorProps {
  details: PersonalDetails;
  onChange: (updated: PersonalDetails) => void;
}

export function PersonalDetailsEditor({ details, onChange }: PersonalDetailsEditorProps) {
  const [previewTab, setPreviewTab] = useState<"welcome" | "proposal">("welcome");
  const [welcomeStep, setWelcomeStep] = useState(0);

  const updateField = (field: keyof PersonalDetails, value: string) => {
    onChange({
      ...details,
      [field]: value,
    });
  };

  const resetDefaults = () => {
    onChange({ ...DEFAULT_PERSONAL_DETAILS });
  };

  const previewDialogue = getWelcomeDialogue(details);
  const previewLetter = getPersonalizedProposalLetter(details);
  const currentDialogue = previewDialogue[welcomeStep % previewDialogue.length]!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Area */}
      <div className="lg:col-span-7 space-y-6">
        <div className="admin-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <h2 className="text-xl font-bold font-display italic text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                Couple & Story Details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Personalize names and heartfelt messages throughout the entire romantic adventure.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDefaults}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender Name */}
            <div className="space-y-2">
              <Label
                htmlFor="senderName"
                className="font-medium text-foreground flex items-center gap-1.5"
              >
                <span>Sender's Name</span>
                <span className="text-xs text-rose-500">*</span>
              </Label>
              <Input
                id="senderName"
                placeholder="e.g. Alex, James, Your Love"
                value={details.senderName}
                onChange={(e) => updateField("senderName", e.target.value)}
                className="bg-background/80"
              />
              <p className="text-xs text-muted-foreground">
                The one who planned this little surprise.
              </p>
            </div>

            {/* Recipient Name */}
            <div className="space-y-2">
              <Label
                htmlFor="recipientName"
                className="font-medium text-foreground flex items-center gap-1.5"
              >
                <span>Recipient's Name</span>
                <span className="text-xs text-rose-500">*</span>
              </Label>
              <Input
                id="recipientName"
                placeholder="e.g. Maya, Sarah, Elena"
                value={details.recipientName}
                onChange={(e) => updateField("recipientName", e.target.value)}
                className="bg-background/80"
              />
              <p className="text-xs text-muted-foreground">Her or their official first name.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recipient Nickname */}
            <div className="space-y-2">
              <Label
                htmlFor="recipientNickname"
                className="font-medium text-foreground flex items-center gap-1.5"
              >
                <span>Pet Name / Nickname</span>
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="recipientNickname"
                placeholder="e.g. Sweetheart, Cutie, Honey"
                value={details.recipientNickname}
                onChange={(e) => updateField("recipientNickname", e.target.value)}
                className="bg-background/80"
              />
              <p className="text-xs text-muted-foreground">Used by Mochi for cute, tender lines.</p>
            </div>

            {/* Anniversary Date */}
            <div className="space-y-2">
              <Label
                htmlFor="anniversaryDate"
                className="font-medium text-foreground flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Special Date / Anniversary</span>
                <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="anniversaryDate"
                placeholder="e.g. June 14, 2021 or 14/06/2021"
                value={details.anniversaryDate}
                onChange={(e) => updateField("anniversaryDate", e.target.value)}
                className="bg-background/80"
              />
              <p className="text-xs text-muted-foreground">
                Weaved gracefully into the proposal letter.
              </p>
            </div>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Label
              htmlFor="greeting"
              className="font-medium text-foreground flex items-center gap-1.5"
            >
              <span>Personal Greeting</span>
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="greeting"
              placeholder={`e.g. Hiii, ${details.recipientNickname || details.recipientName || "Maya"}! ♡`}
              value={details.greeting}
              onChange={(e) => updateField("greeting", e.target.value)}
              className="bg-background/80"
            />
            <p className="text-xs text-muted-foreground">
              Mochi's very first line when opening the website.
            </p>
          </div>

          {/* Introductory Message */}
          <div className="space-y-2">
            <Label
              htmlFor="introMessage"
              className="font-medium text-foreground flex items-center gap-1.5"
            >
              <span>Story Intro Message</span>
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="introMessage"
              rows={3}
              placeholder="Someone who thinks you're the most special person in their world has prepared a little adventure just for you..."
              value={details.introMessage}
              onChange={(e) => updateField("introMessage", e.target.value)}
              className="bg-background/80 leading-relaxed text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Spoken by Mochi on Page 1 to set the mood.
            </p>
          </div>

          {/* Closing Message */}
          <div className="space-y-2">
            <Label
              htmlFor="closingMessage"
              className="font-medium text-foreground flex items-center gap-1.5"
            >
              <span>Custom Proposal Closing Note</span>
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="closingMessage"
              rows={2}
              placeholder="Will you let me be your hero, not just today, but for the rest of our lives?"
              value={details.closingMessage}
              onChange={(e) => updateField("closingMessage", e.target.value)}
              className="bg-background/80 leading-relaxed text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Appears immediately before your signature on Page 3.
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
              <h3 className="font-semibold text-sm text-foreground">Live Experience Preview</h3>
            </div>
            <div className="flex bg-muted/60 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("welcome")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewTab === "welcome"
                    ? "bg-white text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Page 1 Greeting
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("proposal")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  previewTab === "proposal"
                    ? "bg-white text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Page 3 Letter
              </button>
            </div>
          </div>

          {previewTab === "welcome" ? (
            <div className="mt-4 p-4 rounded-xl bg-amber-50/40 border border-amber-100 flex flex-col items-center text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-800/80 mb-3">
                Page 1 — Mochi Dialogue ({welcomeStep + 1} of {previewDialogue.length})
              </div>
              <div className="scale-85 origin-center my-1">
                <Mochi expression={currentDialogue.expression} reactKey={welcomeStep} />
              </div>
              <div className="w-full max-w-sm mt-3">
                <DialogueBubble text={currentDialogue.text} visible={true} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWelcomeStep((s) => (s + 1) % previewDialogue.length)}
                  className="rounded-full text-xs"
                >
                  Next Line ♡
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-5 rounded-xl bg-[#FFFDF8] border border-amber-200/80 text-left shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-700/80 mb-3 border-b border-rose-100 pb-2">
                <BookOpen className="w-3.5 h-3.5" />
                Page 3 — The Proposal Parchment
              </div>
              <h4 className="font-hand text-xl text-cocoa font-bold text-center mb-3">
                {previewLetter.heading}
              </h4>
              <div className="space-y-2.5 text-xs font-serif italic text-muted-foreground leading-relaxed">
                <p>{previewLetter.paragraphs[0]}</p>
                <p>{previewLetter.paragraphs[3]}</p>
                <p className="font-semibold text-rose-600 text-center not-italic font-hand text-base my-2">
                  "{previewLetter.question}"
                </p>
                {previewLetter.closing.map((line, i) => (
                  <p key={i} className="text-foreground/90 font-sans text-xs not-italic">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Changes update automatically across all chapters in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
