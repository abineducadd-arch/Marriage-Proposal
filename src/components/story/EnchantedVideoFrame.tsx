import React from "react";
import "./EnchantedVideoFrame.css";

interface EnchantedVideoFrameProps {
  videoSrc: string | null;
  senderName?: string;
}

function EngravedCornerDetail({ className }: { className: string }) {
  return (
    <svg
      className={`enchanted-corner-svg ${className}`}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer antique gold corner bracket */}
      <path
        d="M 2 24 V 8 C 2 4.7 4.7 2 8 2 H 24"
        stroke="#8A6A3D"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Outer terminal engraved ticks */}
      <path d="M 2 24 H 4" stroke="#8A6A3D" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M 24 2 V 4" stroke="#8A6A3D" strokeWidth="1.25" strokeLinecap="round" />

      {/* Inner champagne gold concentric line */}
      <path
        d="M 7 22 V 12 C 7 9.2 9.2 7 12 7 H 22"
        stroke="#C9A45C"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Diagonal engraved ray */}
      <path d="M 4.5 4.5 L 8.5 8.5" stroke="#E5CC91" strokeWidth="1" strokeLinecap="round" />

      {/* Compact royal engraved diamond accent */}
      <polygon
        points="12,9.5 14.5,12 12,14.5 9.5,12"
        fill="#C9A45C"
        stroke="#8A6A3D"
        strokeWidth="0.5"
      />
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
        <linearGradient id="minimal-gold-antique" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8A6A3D" />
          <stop offset="50%" stopColor="#C9A45C" />
          <stop offset="100%" stopColor="#8A6A3D" />
        </linearGradient>
        <linearGradient id="minimal-gold-champagne" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C9A45C" />
          <stop offset="50%" stopColor="#E5CC91" />
          <stop offset="100%" stopColor="#C9A45C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EnchantedVideoFrame({ videoSrc, senderName }: EnchantedVideoFrameProps) {
  return (
    <div className="enchanted-video-presentation" data-testid="enchanted-video-frame">
      {/* Shared SVG Gradients */}
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

      {/* Minimal Double Gold Frame Outer Wrapper */}
      <div className="enchanted-frame-wrapper">
        {/* Small Engraved Corner Details */}
        <div className="enchanted-corner enchanted-corner-tl" aria-hidden="true">
          <EngravedCornerDetail className="corner-svg-tl" />
        </div>
        <div className="enchanted-corner enchanted-corner-tr" aria-hidden="true">
          <EngravedCornerDetail className="corner-svg-tr" />
        </div>
        <div className="enchanted-corner enchanted-corner-bl" aria-hidden="true">
          <EngravedCornerDetail className="corner-svg-bl" />
        </div>
        <div className="enchanted-corner enchanted-corner-br" aria-hidden="true">
          <EngravedCornerDetail className="corner-svg-br" />
        </div>

        {/* Double-Layer Decorative Border Container */}
        <div className="enchanted-frame-outer">
          {/* Subtle slow border light reflection */}
          <div className="enchanted-border-sheen" aria-hidden="true" />

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

              {/* Delicate Warm Glass Reflection Sheen */}
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
