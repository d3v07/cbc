"use client";

interface FloatingDecorationProps {
  vibe: number;
}

export function FloatingDecoration({ vibe }: FloatingDecorationProps) {
  return (
    <>
      {/* Large corner decorative elements */}
      <div
        className="fixed top-8 left-8 transition-all duration-1000 pointer-events-none z-20"
        style={{
          fontSize: vibe < 50 ? "72px" : "64px",
          opacity: 0.8,
          transform: `rotate(${vibe < 50 ? "0deg" : "15deg"})`,
        }}
      >
        {vibe < 50 ? "🌸" : "🦇"}
      </div>

      <div
        className="fixed top-8 right-8 transition-all duration-1000 pointer-events-none z-20"
        style={{
          fontSize: vibe < 50 ? "72px" : "64px",
          opacity: 0.8,
          transform: `rotate(${vibe < 50 ? "0deg" : "-15deg"})`,
        }}
      >
        {vibe < 50 ? "🦋" : "🌙"}
      </div>

      <div
        className="fixed bottom-32 left-12 transition-all duration-1000 pointer-events-none z-20"
        style={{
          fontSize: vibe < 50 ? "64px" : "56px",
          opacity: 0.7,
        }}
      >
        {vibe < 50 ? "🎀" : "🕯️"}
      </div>

      <div
        className="fixed bottom-32 right-12 transition-all duration-1000 pointer-events-none z-20"
        style={{
          fontSize: vibe < 50 ? "64px" : "56px",
          opacity: 0.7,
        }}
      >
        {vibe < 50 ? "🌈" : "🔮"}
      </div>
    </>
  );
}
