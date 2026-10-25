import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MochiGuide } from "@/components/story/MochiGuide";
import { DarkRoom } from "@/components/story/DarkRoom";
import { ObjectArtwork } from "@/components/story/ObjectArtwork";
import { MagicalPopupSparkles } from "@/components/story/MagicalPopupSparkles";
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
} from "@/lib/sounds";
import hallway from "@/assets/story/door-hallway.jpg";
import room from "@/assets/story/secret-room.jpg";
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
  const [passage, setPassage] = useState(false);
  const [exitAcknowledged, setExitAcknowledged] = useState(false);
  const unlocked = passageUnlocked(visited);
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
    setObjectOpen(true);
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
                : { action: "What's behind it?", onAction: () => setDoorReady(true) })}
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
                onClick={() => {
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
        }}
      >
        {currentObject && activeObject && (
          <DialogContent className="clue-dialog">
            <MagicalPopupSparkles active={objectOpen} />
            <DialogTitle className="font-hand">{currentObject.title}</DialogTitle>
            <div className="opened-object">
              <ObjectArtwork kind={activeObject} />
            </div>
            <blockquote className="handwritten-note">{currentObject.clue}</blockquote>
            <DialogDescription className="clue-dialogue">
              {currentObject.dialogue}
            </DialogDescription>
            <Button className="story-action" onClick={() => setObjectOpen(false)}>
              Close
            </Button>
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
          <Button asChild className="story-action">
            <Link
              to={nextPageRoute}
              onClick={() => playContinue()}
              {...(preview ? { search: () => ({ preview: "true" }) } : {})}
            >
              Continue the adventure ♡
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
