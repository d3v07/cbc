"use client";

import { useEffect, useState } from "react";

interface MagicalBackgroundProps {
  vibe: number;
}

interface FloatingElement {
  x: number;
  y: number;
  size: number;
  delay: number;
  rotation: number;
  speed: number;
}

// Cute characters — show when vibe is low
const CUTE_EMOJIS = [
  "🧸", "🦋", "🌸", "🌺", "💖", "🌈", "🦄", "🎀",
  "🍓", "🌻", "🐰", "🎈", "💝", "🌷", "🦢", "🐝", "🍭", "⭐",
];

// Gothic characters — show when vibe is high
const GOTHIC_EMOJIS = [
  "🦇", "💀", "🕷️", "🕸️", "🌙", "⚰️", "🔮", "🗝️",
  "🕯️", "🏰", "👻", "🖤", "⚡", "🌑", "🦉", "🥀", "⛓️", "🗡️",
];

// Generate position arrays for consistent grid coverage
function generatePositions() {
  const rows = [
    // Top row
    { top: "12", offsets: ["5%", "15%", "25%", "35%", "45%", "55%", "65%", "75%", "85%", "95%"] },
    // Upper middle
    { top: "20%", offsets: ["8%", "18%", "28%", "40%", "52%", "62%", "72%", "82%", "92%"] },
    // Middle
    { top: "40%", offsets: ["6%", "16%", "26%", "38%", "50%", "60%", "70%", "80%", "90%"] },
    // Lower middle
    { top: "60%", offsets: ["10%", "20%", "30%", "42%", "54%", "64%", "74%", "84%", "94%"] },
    // Bottom row (uses bottom instead of top)
    { top: "bottom", offsets: ["7%", "17%", "27%", "39%", "51%", "61%", "71%", "81%", "91%"] },
  ];
  return rows;
}

const ROWS = generatePositions();

export function MagicalBackground({ vibe }: MagicalBackgroundProps) {
  const [sparkles, setSparkles] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const newSparkles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 0.5 + 0.7,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
      speed: Math.random() * 3 + 3,
    }));
    setSparkles(newSparkles);
  }, []);

  const cuteColors = ["#FFE5EC", "#FFF5E1", "#F0E6FF", "#E5F4FF"];
  const gothicColors = ["#1A0B2E", "#2D1B4E", "#1E0A3C", "#0F0520"];

  const backgroundColor =
    vibe < 50
      ? `linear-gradient(135deg, ${cuteColors[0]} 0%, ${cuteColors[1]} 50%, ${cuteColors[2]} 100%)`
      : `linear-gradient(135deg, ${gothicColors[0]} 0%, ${gothicColors[1]} 50%, ${gothicColors[2]} 100%)`;

  const cuteOpacity = Math.max(0, 1 - vibe / 50);
  const gothicOpacity = Math.min(1, vibe / 50 - 1);

  // Helper to render a grid of emojis
  function renderEmojiGrid(
    emojis: string[],
    animClass: string,
    opacity: number
  ) {
    let emojiIdx = 0;
    const sizes = ["text-4xl", "text-5xl", "text-6xl"];
    const durations = [3, 3.2, 3.5, 3.7, 3.8, 4, 4.2, 4.3, 4.5, 4.7, 4.8, 5];
    const delays = [0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.3];

    return (
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity }}
      >
        {ROWS.map((row, ri) =>
          row.offsets.map((left, ci) => {
            const emoji = emojis[emojiIdx % emojis.length];
            const size = sizes[(emojiIdx + ri) % sizes.length];
            const dur = durations[(emojiIdx + ci) % durations.length];
            const del = delays[(emojiIdx + ri + ci) % delays.length];
            emojiIdx++;
            const posStyle: React.CSSProperties =
              row.top === "bottom"
                ? { bottom: `${10 + ci * 2}%`, left }
                : row.top === "12"
                  ? { top: `${12 + ci * 2}px`, left }
                  : { top: row.top, left };

            return (
              <div
                key={`${ri}-${ci}`}
                className={`absolute ${size} ${animClass}`}
                style={{
                  ...posStyle,
                  animationDuration: `${dur}s`,
                  animationDelay: `${del}s`,
                }}
              >
                {emoji}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: backgroundColor }}
      />

      {/* Background sparkle dots */}
      <div className="absolute inset-0">
        {sparkles.map((el, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: "3px",
              height: "3px",
              backgroundColor:
                vibe < 50
                  ? "rgba(255, 215, 0, 0.4)"
                  : "rgba(167, 139, 250, 0.4)",
              animationDelay: `${el.delay}s`,
              animationDuration: `${el.speed}s`,
            }}
          />
        ))}
      </div>

      {/* Cute emoji layer */}
      {renderEmojiGrid(CUTE_EMOJIS, "animate-bounce", cuteOpacity)}

      {/* Gothic emoji layer */}
      {renderEmojiGrid(GOTHIC_EMOJIS, "animate-pulse", gothicOpacity)}
    </div>
  );
}
