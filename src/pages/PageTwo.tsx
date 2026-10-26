import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MochiGuide } from "@/components/story/MochiGuide";
import { DarkRoom } from "@/components/story/DarkRoom";
import { ObjectArtwork } from "@/components/story/ObjectArtwork";
import { MagicalPopupSparkles } from "@/components/story/MagicalPopupSparkles";
import { ScrollRevealLetter } from "@/components/story/ScrollRevealLetter";
import {
  speakMochiGuidance,
  stopMochiVoice,
  speakMochiDialogue,
  stopMochiSpeech,
  MOCHI_LETTER_GUIDANCE,
} from "@/lib/mochi-voice";
import {
  OBJECTS,
  SWITCH_POSITION,
  NEXT_PAGE_ROUTE,
  exploreObject,
  passageUnlocked,
  type ObjectId,
} from "@/components/story/adventure";
import { useProposalConfig } from "@/hooks/use-proposal-config";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SoundToggle } from "@/components/SoundToggle";
import {
  playContinue,
  playDoorOpen,
  playLightSwitch,
  playSparkle,
  playTransition,
  playUnlock,
  preloadSoundEffects,
} from "@/lib/sounds";
import hallway from "@/assets/story/door-hallway.jpg";
import room from "@/assets/story/secret-room.jpg";
import vintageCoupleImg from "@/assets/story/vintage-couple-vignette.jpg";
import missionRoom from "@/assets/story/mission-control.jpg";
import "./PageTwo.css";

const DARK_LINES = [
  "Umm... it's a little dark in here! Hehe... don't worry, I'm right here with you. ♡",
  "Oh! I think I remember something! There should be a light switch somewhere in this room...",
  "Try moving your little light around and see if you can find it! I'll wait right here. ✨",
];
const LIGHT_LINES = [
  "YAYYY! You found it! I knew you could do it! ♡",
  "Look at all these little things! I wonder if someone left us some clues...",
  "Hehe... this adventure is just getting started. Let's look around! ✨",
];

export function PageTwo({
  switchPosition = SWITCH_POSITION,
  nextPageRoute = NEXT_PAGE_ROUTE,
}: {
  switchPosition?: { x: number; y: number };
  nextPageRoute?: typeof NEXT_PAGE_ROUTE;
}) {
  const { config, preview } = useProposalConfig();
  const [scene, setScene] = useState<"door" | "opening" | "dark" | "lit">("door");
  const [doorReady, setDoorReady] = useState(false);
  const [guideReady, setGuideReady] = useState(false);
  const [darkLine, setDarkLine] = useState(0);
  const [lightLine, setLightLine] = useState(0);
  const [hint, setHint] = useState(false);
  const hinted = useRef(false);
  const [visited, setVisited] = useState<ObjectId[]>([]);
  const [activeObject, setActiveObject] = useState<ObjectId | null>(null);
  const [objectOpen, setObjectOpen] = useState(false);
  const [letterCompleted, setLetterCompleted] = useState(false);
  const [passage, setPassage] = useState(false);
  const [exitAcknowledged, setExitAcknowledged] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const unlocked = passageUnlocked(visited);

  useEffect(() => {
    return () => {
      stopMochiVoice();
    };
  }, []);

  // Preload Page 3 essential visual and sound assets while exploring Page 2
  useEffect(() => {
    if (scene === "lit" || unlocked) {
      try {
        const img = new Image();
        img.src = missionRoom;
        preloadSoundEffects();
      } catch {
        // Safe fallback in test or headless environments
      }
    }
  }, [scene, unlocked]);

  // Preload Page 3 component chunk when passage unlocks
  useEffect(() => {
    if (unlocked) {
      import("@/pages/PageThree").catch(() => {});
    }
  }, [unlocked]);


  useEffect(() => {
    if (passage) {
      speakMochiDialogue("Ooooh... I think our next adventure is hiding behind this one!");
    }
  }, [passage]);
  useEffect(() => {
    if (scene !== "opening" && scene !== "dark") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(
      () => (scene === "opening" ? setScene("dark") : setGuideReady(true)),
      scene === "opening" ? (reduced ? 100 : 1800) : reduced ? 100 : 900,
    );
    return () => window.clearTimeout(id);
  }, [scene]);
  // Track whether unlock chime has fired so it only plays once
  const unlockedRef = useRef(false);

  const openObject = (id: ObjectId) => {
    playSparkle();
    setActiveObject(id);
    setLetterCompleted(false);
    setObjectOpen(true);
    speakMochiGuidance(MOCHI_LETTER_GUIDANCE);
    const next = exploreObject(visited, id);
    setVisited(next);
    // Fire unlock sound exactly once when all three are found
    if (!unlockedRef.current && passageUnlocked(next)) {
      unlockedRef.current = true;
      setTimeout(() => playUnlock(), 400);
    }
  };
  const roomScene = scene === "dark" || scene === "lit";
  const currentObject = activeObject
    ? {
        title: config.pageTwo[activeObject]?.title || OBJECTS[activeObject].title,
        clue: config.pageTwo[activeObject]?.clue || OBJECTS[activeObject].clue,
        dialogue: OBJECTS[activeObject].dialogue,
      }
    : null;
  return (
    <main className={`page-two scene-${scene}`}>
      <PreviewBanner preview={preview} />
      <SoundToggle />
      {!roomScene ? (
        <>
          <img
            className="scene-image hallway-image"
            src={hallway}
            alt="An old carved wooden door in a moonlit storybook hallway"
            width={1536}
            height={1024}
          />
          <header className="chapter-heading">
            <p>Chapter two</p>
            <h1>The Mysterious Door</h1>
            <span>A little curiosity opens wonderful things.</span>
          </header>
          <Button
            variant="ghost"
            className={`mysterious-door ${doorReady ? "door-ready" : ""}`}
            aria-label="Open the mysterious door"
            disabled={!doorReady || scene === "opening"}
            onClick={() => {
              playDoorOpen();
              setScene("opening");
            }}
          >
            <span className="door-shadow" />
            <span className="door-handle" />
          </Button>
          {doorReady && scene === "door" && (
            <p className="door-instruction font-hand">Tap the door to open it ♡</p>
          )}
          {scene === "door" && (
            <MochiGuide
              expression={doorReady ? "curious" : "happy"}
              text={
                doorReady
                  ? "Hmm... there's only one way to find out! Go on, give the door a little knock!"
                  : "Ohhh! Look what we found! A mysterious door! ♡"
              }
              {...(doorReady
                ? {}
                : {
                    action: "What's behind it?",
                    onAction: () => {
                      playContinue();
                      setDoorReady(true);
                    },
                  })}
            />
          )}
          {scene === "opening" && <div className="expanding-darkness" aria-hidden="true" />}
        </>
      ) : (
        <>
          <DarkRoom
            position={switchPosition}
            lit={scene === "lit"}
            onActivate={() => {
              playLightSwitch();
              setScene("lit");
              setHint(false);
            }}
            onFound={() => {
              if (darkLine >= DARK_LINES.length && !hinted.current) {
                hinted.current = true;
                setHint(true);
              }
            }}
          >
            <img
              className="scene-image room-image"
              src={room}
              alt="A secret room with fairy lights, flowers, a cozy rug and little treasures"
              width={1536}
              height={1024}
            />
            {scene === "lit" && (
              <header className="chapter-heading room-heading">
                <p>Chapter two</p>
                <h1>A Room Full of Little Secrets</h1>
              </header>
            )}
            <div className="room-treasures" aria-hidden={scene !== "lit"}>
              {(Object.keys(OBJECTS) as ObjectId[]).map((id) => (
                <Button
                  key={id}
                  variant="ghost"
                  className={`room-object object-${id} ${visited.includes(id) ? "object-visited" : ""}`}
                  aria-label={`Explore ${id === "chocolate" ? "chocolate box" : id === "gift" ? "wrapped gift" : "framed picture"}`}
                  disabled={scene !== "lit" || lightLine < LIGHT_LINES.length}
                  onClick={() => openObject(id)}
                >
                  <ObjectArtwork kind={id} />
                  <span className="object-caption">
                    {id === "chocolate"
                      ? "Chocolate box"
                      : id === "gift"
                        ? "A little gift"
                        : "A tiny picture"}
                  </span>
                </Button>
              ))}
            </div>
            {scene === "lit" && unlocked && (
              <Button
                variant="ghost"
                className="secret-passage"
                aria-label="Open the secret passage"
                disabled={isNavigating}
                onClick={() => {
                  if (isNavigating) return;
                  playDoorOpen();
                  setExitAcknowledged(true);
                  setPassage(true);
                }}
              >
                <span>✦</span>
                <span className="font-hand">A little door…</span>
              </Button>
            )}
          </DarkRoom>
          {scene === "dark" && guideReady && darkLine < DARK_LINES.length && (
            <MochiGuide
              dark
              expression={darkLine === 0 ? "curious" : "happy"}
              text={DARK_LINES[darkLine] ?? ""}
              action="Continue ♡"
              onAction={() => {
                playContinue();
                setDarkLine((n) => n + 1);
              }}
            />
          )}
          {scene === "dark" && hint && (
            <MochiGuide
              dark
              expression="curious"
              text="Wait... is that something on the wall? Take a closer look! 👀"
              action="I'll take a look ♡"
              onAction={() => setHint(false)}
            />
          )}
          {scene === "lit" && lightLine < LIGHT_LINES.length && (
            <MochiGuide
              expression={lightLine === 0 ? "laughing" : "happy"}
              text={LIGHT_LINES[lightLine] ?? ""}
              action={lightLine === LIGHT_LINES.length - 1 ? "Let's explore! ♡" : "Continue ♡"}
              onAction={() => {
                playContinue();
                setLightLine((n) => n + 1);
              }}
            />
          )}
          {scene === "lit" && unlocked && !objectOpen && !passage && !exitAcknowledged && (
            <MochiGuide
              expression="curious"
              text="Wait a second... was that little door there before? I think we've discovered something! ♡"
              action="Let's take a look ♡"
              onAction={() => {
                playDoorOpen();
                setExitAcknowledged(true);
                setPassage(true);
              }}
            />
          )}
          {scene === "lit" && <div className="warm-illumination" aria-hidden="true" />}
        </>
      )}
      <Dialog
        open={objectOpen}
        onOpenChange={(open) => {
          setObjectOpen(open);
          if (!open) {
            stopMochiVoice();
          }
        }}
      >
        {currentObject && activeObject && (
          <DialogContent className="clue-dialog vintage-parchment-note">
            <MagicalPopupSparkles active={objectOpen} />

            {/* Vintage Aged Parchment Frame Decor */}
            <div className="parchment-frame-decor" aria-hidden="true">
              {/* Botanical Corner Flourishes */}
              <svg
                className="botanical-corner botanical-tl"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M14,86 C14,46 36,24 86,14 M20,78 C26,52 48,30 78,20 M32,64 C36,48 50,34 66,28"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M44,24 C48,16 56,16 60,22 C64,28 56,34 48,30 Z M24,44 C18,48 18,56 24,60 C30,64 36,56 32,48 Z"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle cx="82" cy="16" r="2.5" fill="currentColor" opacity="0.65" />
                <circle cx="16" cy="82" r="2.5" fill="currentColor" opacity="0.65" />
              </svg>
              <svg
                className="botanical-corner botanical-tr"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M86,86 C86,46 64,24 14,14 M80,78 C74,52 52,30 22,20 M68,64 C64,48 50,34 34,28"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M56,24 C52,16 44,16 40,22 C36,28 44,34 52,30 Z M76,44 C82,48 82,56 76,60 C70,64 64,56 68,48 Z"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle cx="18" cy="16" r="2.5" fill="currentColor" opacity="0.65" />
                <circle cx="84" cy="82" r="2.5" fill="currentColor" opacity="0.65" />
              </svg>
              <svg
                className="botanical-corner botanical-br"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M86,14 C86,54 64,76 14,86 M80,22 C74,48 52,70 22,80 M68,36 C64,52 50,66 34,72"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M56,76 C52,84 44,84 40,78 C36,72 44,66 52,70 Z M76,56 C82,52 82,44 76,40 C70,36 64,44 68,52 Z"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle cx="18" cy="84" r="2.5" fill="currentColor" opacity="0.65" />
                <circle cx="84" cy="18" r="2.5" fill="currentColor" opacity="0.65" />
              </svg>

              {/* Romantic Vintage Embracing Couple Illustration in bottom-left */}
              <img
                src={vintageCoupleImg}
                alt=""
                className="vintage-embracing-couple-art"
                draggable={false}
              />
            </div>

            <div className="parchment-content-layer">
              <header className="parchment-header">
                <DialogTitle className="parchment-title font-display">
                  {currentObject.title}
                </DialogTitle>
                <div className="parchment-divider" aria-hidden="true">
                  <span className="divider-line" />
                  <span className="divider-motif">❧ ♡ ☙</span>
                  <span className="divider-line" />
                </div>
              </header>

              <div className="opened-object">
                <ObjectArtwork kind={activeObject} />
              </div>

              <ScrollRevealLetter
                key={activeObject}
                text={currentObject.clue}
                objectId={activeObject}
                onComplete={() => {
                  setLetterCompleted(true);
                  playSparkle();
                  if (currentObject?.dialogue) {
                    speakMochiDialogue(currentObject.dialogue);
                  }
                }}
              />

              <DialogDescription className="clue-dialogue parchment-dialogue">
                <span className="dialogue-icon" aria-hidden="true">
                  ✦
                </span>
                <span className="parchment-dialogue-content">
                  {letterCompleted ? (
                    <span className="mochi-completed-dialogue">{currentObject.dialogue}</span>
                  ) : (
                    <span className="mochi-guidance-instruction">{MOCHI_LETTER_GUIDANCE}</span>
                  )}
                </span>
              </DialogDescription>

              <div className="parchment-footer">
                <Button
                  className="story-action parchment-close-btn"
                  onClick={() => {
                    stopMochiVoice();
                    setObjectOpen(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={passage} onOpenChange={setPassage}>
        <DialogContent className="clue-dialog passage-dialog">
          <MagicalPopupSparkles active={passage} />
          <DialogTitle className="font-hand">Another little door…</DialogTitle>
          <DialogDescription>
            Ooooh... I think our next adventure is hiding behind this one!
          </DialogDescription>
          <Button asChild className="story-action" disabled={isNavigating}>
            <Link
              to={nextPageRoute}
              onClick={(e) => {
                if (isNavigating) {
                  e.preventDefault();
                  return;
                }
                setIsNavigating(true);
                stopMochiSpeech();
                playTransition();
              }}
              {...(preview ? { search: () => ({ preview: "true" }) } : {})}
            >
              {isNavigating ? "Opening door... ♡" : "Continue the adventure ♡"}
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
