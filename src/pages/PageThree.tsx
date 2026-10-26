import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mochi } from "@/components/Mochi";
import { MochiGuide } from "@/components/story/MochiGuide";
import {
  AI_MESSAGES,
  PROPOSAL_LETTER,
  proposalVideoSrc,
  type ProposalScene,
} from "@/components/story/proposal";
import { useProposalConfig } from "@/hooks/use-proposal-config";
import { getPersonalizedProposalLetter } from "@/lib/proposal-config";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SoundToggle } from "@/components/SoundToggle";
import { PartyCelebration } from "@/components/story/PartyCelebration";
import { EnchantedVideoFrame } from "@/components/story/EnchantedVideoFrame";
import {
  playContinue,
  playCelebration,
  playHeartbeat,
  playTransition,
  playTransmission,
} from "@/lib/sounds";
import { stopMochiSpeech } from "@/lib/mochi-voice";
import missionRoom from "@/assets/story/mission-control.jpg";
import "./PageThree.css";

const INTRO_LINES = [
  "Whoa... this room looks super important!",
  "Umm... I think that giant screen is trying to tell us something. Let's take a look! ♡",
] as const;
const AI_CELEBRATION_LINES = [
  "TRANSMISSION ACCEPTED.",
  "THE HERO HAS RECEIVED YOUR ANSWER.",
  "INTERDIMENSIONAL ARRIVAL CONFIRMED.",
] as const;
const MOCHI_CELEBRATION_LINES = [
  "YAYYYYY! YOU DID IT! ♡",
  "You saved your world... and made someone's entire universe happier!",
  "Your hero will meet you very soon. I have one last little surprise for you! ✨",
] as const;
const TABLET_LINES = [
  "Oh! Wait, wait! I almost forgot something!",
  "Your hero left you a little message... just for you. ♡",
  "Here! It's on this tablet. I think you'll want to watch this one...",
] as const;

export function PageThree() {
  const { config, preview, videoSrc } = useProposalConfig();
  const activeVideoSrc = videoSrc || proposalVideoSrc;
  const proposalLetter = getPersonalizedProposalLetter(config.personalDetails);

  const [scene, setScene] = useState<ProposalScene>("intro");
  const [introReady, setIntroReady] = useState(false);
  const [introLine, setIntroLine] = useState(0);
  const [briefingLine, setBriefingLine] = useState(0);
  const [noFlipped, setNoFlipped] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [celebrationLine, setCelebrationLine] = useState(0);
  const [tabletLine, setTabletLine] = useState(0);
  const celebrationStarted = useRef(false);

  useEffect(() => {
    return () => {
      stopMochiSpeech();
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setIntroReady(true), reduced ? 50 : 2400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSparkles) return;
    const timer = window.setTimeout(() => setShowSparkles(false), 1400);
    return () => window.clearTimeout(timer);
  }, [showSparkles]);

  useEffect(() => {
    if (scene !== "accepting") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 80 : noFlipped ? 2600 : 850;
    const timer = window.setTimeout(() => setScene("celebration"), delay);
    return () => window.clearTimeout(timer);
  }, [scene, noFlipped]);

  const acceptProposal = () => {
    if (celebrationStarted.current) return;
    celebrationStarted.current = true;
    playCelebration();
    setScene("accepting");
  };

  const clickNo = () => {
    if (noFlipped) return;
    setNoFlipped(true);
    setShowSparkles(true);
    acceptProposal();
  };

  const nextCelebration = () => {
    if (celebrationLine < AI_CELEBRATION_LINES.length + MOCHI_CELEBRATION_LINES.length - 1) {
      setCelebrationLine((line) => line + 1);
      return;
    }
    setScene("tablet");
  };

  const nextTabletLine = () => {
    if (tabletLine < TABLET_LINES.length - 1) {
      setTabletLine((line) => line + 1);
      return;
    }
    stopMochiSpeech();
    setScene("video");
  };

  return (
    <main className={`page-three page-three-${scene}`}>
      <PreviewBanner preview={preview} />
      <SoundToggle />
      <PartyCelebration active={scene === "accepting" || scene === "celebration"} />
      <img
        className="mission-room-art"
        src={missionRoom}
        alt="A cozy storybook mission-control room with a giant screen"
        width={1536}
        height={1024}
        fetchPriority="high"
      />
      <div className="mission-room-shade" aria-hidden="true" />
      <div className="mission-screen" aria-label="Interdimensional Mission Control">
        <header className="mission-screen-heading">
          <p>INTERDIMENSIONAL MISSION CONTROL</p>
          {scene === "intro" ? (
            <span>Incoming transmission detected...</span>
          ) : (
            <span className="signal-status">
              <i aria-hidden="true" /> SIGNAL CONNECTED
            </span>
          )}
        </header>

        {scene === "intro" && (
          <section className="screen-content intro-content" aria-live="polite">
            <div className="mission-emblem" aria-hidden="true">
              <span>♡</span>
            </div>
            <p className="mission-loading">
              <i aria-hidden="true" /> Establishing a little connection...
            </p>
            {introReady && introLine === 1 && (
              <Button
                className="mission-button"
                onClick={() => {
                  playTransmission();
                  setScene("briefing");
                }}
              >
                Activate the screen
              </Button>
            )}
            {!introReady && (
              <Button variant="ghost" className="skip-intro" onClick={() => setIntroReady(true)}>
                Skip intro
              </Button>
            )}
          </section>
        )}

        {scene === "briefing" && (
          <section className="screen-content briefing-content" aria-live="polite">
            <div className="ai-sigil" aria-hidden="true">
              <span>✦</span>
              <i />
              <i />
              <i />
            </div>
            <p className="ai-caption">FICTIONAL STORY TRANSMISSION</p>
            <p className="ai-message" key={briefingLine}>
              {AI_MESSAGES[briefingLine]}
            </p>
            <div
              className="transmission-progress"
              aria-label={`Transmission ${briefingLine + 1} of ${AI_MESSAGES.length}`}
            >
              {AI_MESSAGES.map((_, index) => (
                <span key={index} className={index <= briefingLine ? "progress-active" : ""} />
              ))}
            </div>
            <Button
              className="mission-button"
              onClick={() => {
                playTransmission();
                if (briefingLine < AI_MESSAGES.length - 1) {
                  setBriefingLine((line) => line + 1);
                } else {
                  setScene("incoming");
                }
              }}
            >
              {briefingLine < AI_MESSAGES.length - 1
                ? "Continue transmission"
                : "Check the incoming message"}
            </Button>
          </section>
        )}

        {scene === "incoming" && (
          <section className="screen-content incoming-content" aria-live="polite">
            <div className="message-alert" aria-hidden="true">
              <span>✉</span>
              <i />
            </div>
            <p className="incoming-label">INCOMING MESSAGE DETECTED</p>
            <p className="incoming-copy">
              A message is waiting. You can open it whenever you feel ready.
            </p>
            <Button
              className="mission-button"
              onClick={() => {
                playTransmission();
                playHeartbeat();
                setScene("proposal");
              }}
            >
              Open the message
            </Button>
            <p className="mochi-reaction">Wait... a message? I wonder who it's from! 👀</p>
          </section>
        )}

        {(scene === "proposal" || scene === "accepting") && (
          <section
            className={`screen-content proposal-content ${scene === "accepting" ? "proposal-accepted" : ""}`}
            aria-label="A message from your hero"
          >
            <p className="sender-label">
              <span aria-hidden="true">♡</span> A MESSAGE FROM YOUR HERO{" "}
              <span aria-hidden="true">♡</span>
            </p>
            <article className="proposal-letter" aria-label="Marriage proposal letter">
              <h1>{proposalLetter.heading}</h1>
              {proposalLetter.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <h2>{proposalLetter.question}</h2>
              {proposalLetter.closing.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
            <div className="proposal-actions">
              <Button
                className="yes-button"
                onClick={acceptProposal}
                disabled={scene === "accepting"}
                aria-label="Yes, I accept the proposal"
              >
                YES! ♡
              </Button>
              <div className="no-button-wrap">
                <button
                  type="button"
                  className={`btn-flip ${noFlipped ? "is-flipped" : ""}`}
                  data-front="No"
                  data-back="Yes! ❤️"
                  aria-label={noFlipped ? "Yes! ❤️" : "No"}
                  onClick={clickNo}
                  disabled={scene === "accepting" && !noFlipped}
                >
                  <span className="sr-only">{noFlipped ? "Yes! ❤️" : "No"}</span>
                </button>
                {showSparkles && (
                  <div className="no-button-sparkle-burst" aria-hidden="true">
                    <span className="sparkle-heart sparkle-heart-1">❤️</span>
                    <span className="sparkle-heart sparkle-heart-2">💖</span>
                    <span className="sparkle-star sparkle-star-1">✦</span>
                    <span className="sparkle-star sparkle-star-2">✨</span>
                    <span className="sparkle-star sparkle-star-3">✦</span>
                    <span className="sparkle-star sparkle-star-4">✧</span>
                    <span className="sparkle-ring" />
                  </div>
                )}
              </div>
            </div>
            {noFlipped && (
              <div className="no-flip-congrats" role="status" aria-live="polite">
                <span className="no-flip-congrats-star" aria-hidden="true">
                  ✦
                </span>
                <span>Surprise! You just said YES! ❤️</span>
                <span className="no-flip-congrats-star" aria-hidden="true">
                  ✦
                </span>
              </div>
            )}
          </section>
        )}

        {scene === "celebration" && (
          <section className="screen-content celebration-content" aria-live="polite">
            <div className="celebration-sparkles" aria-hidden="true">
              <i>♡</i>
              <i>✦</i>
              <i>♡</i>
              <i>✧</i>
              <i>✦</i>
            </div>
            <div className="celebration-badge" aria-hidden="true">
              <span>✦</span> MISSION ACCOMPLISHED <span>✦</span>
            </div>
            <h1 className="celebration-main-title">SHE SAID YES! ❤️</h1>
            <p className="celebration-sub-title font-hand">Our forever begins here...</p>
            {celebrationLine < AI_CELEBRATION_LINES.length ? (
              <>
                <p className="ai-caption">FICTIONAL STORY TRANSMISSION</p>
                <p
                  className={`celebration-message celebration-step-${celebrationLine}`}
                  key={celebrationLine}
                >
                  {AI_CELEBRATION_LINES[celebrationLine] ?? ""}
                </p>
              </>
            ) : celebrationLine ===
              AI_CELEBRATION_LINES.length + MOCHI_CELEBRATION_LINES.length - 1 ? (
              <p className="arrival-message">Your hero will meet you shortly... ♡</p>
            ) : null}
            <Button
              className="mission-button"
              onClick={() => {
                playTransmission();
                nextCelebration();
              }}
            >
              {celebrationLine < AI_CELEBRATION_LINES.length + MOCHI_CELEBRATION_LINES.length - 1
                ? "Continue ♡"
                : "Meet your little surprise"}
            </Button>
          </section>
        )}

        {(scene === "tablet" || scene === "video") && (
          <section
            className={`screen-content ${scene === "video" ? "video-content" : "tablet-content"}`}
            aria-live="polite"
          >
            {scene === "tablet" ? (
              <>
                <div className="tablet-scene">
                  <div className="tablet-device">
                    <div className="tablet-screen">
                      <div className="tablet-preview">
                        <span aria-hidden="true">♡</span>
                        <p>A message is waiting</p>
                      </div>
                    </div>
                    <span className="tablet-camera" aria-hidden="true" />
                  </div>
                  <div className="tablet-mochi">
                    <Mochi expression="happy" />
                  </div>
                </div>
                <p className="tablet-dialogue">{TABLET_LINES[tabletLine]}</p>
                <Button
                  className="mission-button"
                  onClick={() => {
                    playTransmission();
                    nextTabletLine();
                  }}
                >
                  {tabletLine < TABLET_LINES.length - 1 ? "Continue ♡" : "Watch your surprise ♡"}
                </Button>
              </>
            ) : (
              <EnchantedVideoFrame
                videoSrc={activeVideoSrc}
                senderName={config.personalDetails.senderName}
              />
            )}
          </section>
        )}
      </div>

      {(scene === "intro" ||
        scene === "incoming" ||
        scene === "proposal" ||
        (scene === "celebration" && celebrationLine >= AI_CELEBRATION_LINES.length) ||
        scene === "tablet") && (
        <div className={`mission-guide mission-guide-${scene}`}>
          <MochiGuide
            expression={
              scene === "incoming"
                ? "curious"
                : scene === "proposal"
                  ? noFlipped
                    ? "laughing"
                    : "curious"
                  : scene === "celebration"
                    ? "laughing"
                    : "happy"
            }
            text={
              scene === "intro"
                ? (INTRO_LINES[introLine] ?? "")
                : scene === "incoming"
                  ? "Wait... a message? I wonder who it's from! 👀"
                  : scene === "proposal"
                    ? noFlipped
                      ? "Hehe! I knew you'd say yes! ♡"
                      : "Take all the time you need, sweetheart. Whatever you decide is okay. ♡"
                    : scene === "celebration"
                      ? (MOCHI_CELEBRATION_LINES[celebrationLine - AI_CELEBRATION_LINES.length] ??
                        "")
                      : (TABLET_LINES[tabletLine] ?? "")
            }
            {...(scene === "intro" && introReady && introLine === 0
              ? {
                  action: "Continue ♡",
                  onAction: () => {
                    playContinue();
                    setIntroLine(1);
                  },
                }
              : { onAction: () => setIntroLine(1) })}
          />
        </div>
      )}

      {(scene === "accepting" || scene === "celebration") && (
        <div className="celebration-wash" aria-hidden="true" />
      )}
    </main>
  );
}
