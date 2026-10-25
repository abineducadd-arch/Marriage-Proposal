import React from "react";
import "./EnchantedVideoFrame.css";

interface EnchantedVideoFrameProps {
  videoSrc: string | null;
  senderName?: string;
}

const PARTICLES = [
  { id: "tl-star", symbol: "✦", className: "particle-star particle-tl-1" },
  { id: "tl-sparkle", symbol: "✨", className: "particle-sparkle particle-tl-2" },
  { id: "tr-star", symbol: "✦", className: "particle-star particle-tr-1" },
  { id: "tr-sparkle", symbol: "✧", className: "particle-sparkle particle-tr-2" },
  { id: "bl-star", symbol: "✧", className: "particle-star particle-bl-1" },
  { id: "bl-sparkle", symbol: "⋆", className: "particle-sparkle particle-bl-2" },
  { id: "br-star", symbol: "✦", className: "particle-star particle-br-1" },
  { id: "br-sparkle", symbol: "✨", className: "particle-sparkle particle-br-2" },
  { id: "mote-l", symbol: "•", className: "particle-mote particle-mote-l" },
  { id: "mote-r", symbol: "•", className: "particle-mote particle-mote-r" },
] as const;

function EnchantedCornerOrnament({ className }: { className: string }) {
  return (
    <svg
      className={`enchanted-corner-svg ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer royal corner arch */}
      <path
        d="M 3 56 V 26 C 3 13.3 13.3 3 26 3 H 56"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Inner delicate filigree arch */}
      <path
        d="M 9 52 V 28 C 9 17.5 17.5 9 28 9 H 52"
        stroke="url(#enchanted-champagne-grad)"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      {/* Corner inner flourish */}
      <path
        d="M 16 46 C 16 29.4 29.4 16 46 16"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Elegant scroll curls at ends */}
      <path
        d="M 3 56 C 1 60 6 62 8 58 C 10 54 6 52 3 56 Z"
        fill="url(#enchanted-gold-cyan-grad)"
      />
      <path
        d="M 56 3 C 60 1 62 6 58 8 C 54 10 52 6 56 3 Z"
        fill="url(#enchanted-gold-cyan-grad)"
      />
      {/* Corner royal star / diamond gem */}
      <polygon
        points="18,5 21,14 30,17 21,20 18,29 15,20 6,17 15,14"
        fill="url(#enchanted-star-grad)"
        filter="url(#enchanted-corner-glow)"
      />
      {/* Inner gemstone core */}
      <circle cx="18" cy="17" r="2.5" fill="#67e8f9" />
      <circle cx="17.2" cy="16.2" r="0.8" fill="#ffffff" />
      {/* Subtle fantasy starlight accents along filigree */}
      <circle cx="36" cy="6" r="1.5" fill="#fde047" />
      <circle cx="6" cy="36" r="1.5" fill="#fde047" />
      <circle cx="46" cy="9" r="1" fill="#c084fc" />
      <circle cx="9" cy="46" r="1" fill="#c084fc" />
    </svg>
  );
}

function EnchantedTopCrest() {
  return (
    <svg
      className="enchanted-crest enchanted-crest-top"
      viewBox="0 0 100 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Winged horizontal flourishes */}
      <path
        d="M 6 14 C 20 14 30 18 42 14"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 94 14 C 80 14 70 18 58 14"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 14 11 C 26 11 34 8 44 12"
        stroke="url(#enchanted-champagne-grad)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 86 11 C 74 11 66 8 56 12"
        stroke="url(#enchanted-champagne-grad)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Center Royal Crown/Star Gem */}
      <polygon
        points="50,2 53,10 61,14 53,18 50,26 47,18 39,14 47,10"
        fill="url(#enchanted-star-grad)"
        filter="url(#enchanted-corner-glow)"
      />
      <circle cx="50" cy="14" r="2.2" fill="#67e8f9" />
      <circle cx="49.3" cy="13.3" r="0.7" fill="#ffffff" />
      {/* Flanking jewels */}
      <circle cx="34" cy="14" r="1.5" fill="#fde047" />
      <circle cx="66" cy="14" r="1.5" fill="#fde047" />
      <circle cx="22" cy="13" r="1" fill="#c084fc" />
      <circle cx="78" cy="13" r="1" fill="#c084fc" />
    </svg>
  );
}

function EnchantedBottomCrest() {
  return (
    <svg
      className="enchanted-crest enchanted-crest-bottom"
      viewBox="0 0 80 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 10 10 C 22 10 30 6 36 10"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 70 10 C 58 10 50 6 44 10"
        stroke="url(#enchanted-gold-cyan-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polygon
        points="40,3 42.5,8.5 48,10 42.5,11.5 40,17 37.5,11.5 32,10 37.5,8.5"
        fill="url(#enchanted-star-grad)"
      />
      <circle cx="40" cy="10" r="1.6" fill="#67e8f9" />
    </svg>
  );
}

function EnchantedSvgDefs() {
  return (
    <svg
      className="enchanted-svg-defs"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id="enchanted-gold-cyan-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d77f" />
          <stop offset="35%" stopColor="#fff2df" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="enchanted-champagne-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#fff2df" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <linearGradient id="enchanted-star-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff9e6" />
          <stop offset="45%" stopColor="#fde047" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="enchanted-corner-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

export function EnchantedVideoFrame({ videoSrc, senderName }: EnchantedVideoFrameProps) {
  return (
    <div className="enchanted-video-presentation" data-testid="enchanted-video-frame">
      {/* Shared SVG Gradients and Filters */}
      <EnchantedSvgDefs />

      {/* Elegant Header Section */}
      <div className="enchanted-video-header">
        <div className="enchanted-video-heading-wrap">
          <span className="enchanted-heading-star" aria-hidden="true">
            ✦
          </span>
          <h2 className="enchanted-video-heading">A Little Message From My Heart ❤️</h2>
          <span className="enchanted-heading-star" aria-hidden="true">
            ✦
          </span>
        </div>
        <div className="enchanted-video-badge" role="status">
          <span className="enchanted-badge-sparkle" aria-hidden="true">
            ✨
          </span>
          <span>Made with love, just for you</span>
          <span className="enchanted-badge-sparkle" aria-hidden="true">
            ✨
          </span>
        </div>
      </div>

      {/* Enchanted Holographic Frame Outer Wrapper */}
      <div className="enchanted-frame-wrapper">
        {/* Fantasy Corner Ornaments */}
        <div className="enchanted-corner enchanted-corner-tl" aria-hidden="true">
          <EnchantedCornerOrnament className="corner-svg-tl" />
        </div>
        <div className="enchanted-corner enchanted-corner-tr" aria-hidden="true">
          <EnchantedCornerOrnament className="corner-svg-tr" />
        </div>
        <div className="enchanted-corner enchanted-corner-bl" aria-hidden="true">
          <EnchantedCornerOrnament className="corner-svg-bl" />
        </div>
        <div className="enchanted-corner enchanted-corner-br" aria-hidden="true">
          <EnchantedCornerOrnament className="corner-svg-br" />
        </div>

        {/* Center Crests */}
        <EnchantedTopCrest />
        <EnchantedBottomCrest />

        {/* Ambient Twinkling Stars & Particles */}
        {PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className={`enchanted-particle ${particle.className}`}
            aria-hidden="true"
          >
            {particle.symbol}
          </span>
        ))}

        {/* Double-Layer Decorative Border Container */}
        <div className="enchanted-frame-outer">
          {/* Animated Light Sweep Beam */}
          <div className="enchanted-sweep-beam" aria-hidden="true" />

          {/* Inner Bezel Container */}
          <div className="enchanted-frame-inner">
            {/* Screen Viewport with 16:9 ratio */}
            <div className="enchanted-screen-container">
              {videoSrc ? (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  src={videoSrc}
                  className="enchanted-video-player"
                  aria-label="A personal message from your hero"
                />
              ) : (
                <div className="video-placeholder enchanted-placeholder">
                  <div className="enchanted-play-portal" aria-hidden="true">
                    <span className="portal-ring portal-ring-outer" />
                    <span className="portal-ring portal-ring-inner" />
                    <span className="video-play-icon">▶</span>
                  </div>
                  <p className="placeholder-title">A little message just for you ♡</p>
                  <span className="placeholder-subtitle">Your special video will appear here.</span>
                  <div className="placeholder-ambient-stars" aria-hidden="true">
                    <span className="ambient-star ambient-star-1">✦</span>
                    <span className="ambient-star ambient-star-2">✧</span>
                    <span className="ambient-star ambient-star-3">✦</span>
                  </div>
                </div>
              )}

              {/* Holographic Subtle Glass Reflection Sheen */}
              <div className="enchanted-holographic-sheen" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Dedication Message */}
      <div className="enchanted-video-footer">
        <p className="video-dedication">
          {senderName
            ? `Made with all my love, just for you — ${senderName}. ♡`
            : "Made with all my love, just for you. ♡"}
        </p>
      </div>
    </div>
  );
}
