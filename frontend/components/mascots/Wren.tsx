import { Eyes } from "./Eyes";
import { Mouth } from "./Mouth";
import { ink } from "./_shared";
import type { Emotion } from "./types";

interface WrenProps {
  emotion?: Emotion;
  size?: number;
}

// Documentarian's mascot — feathered creature, single-stroke body.
export function Wren({ emotion = "listening", size = 96 }: WrenProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      className="anim-mascot"
      role="img"
      aria-label={`Wren mascot, ${emotion}`}
    >
      <path
        d="M 12 50 Q 8 32, 22 18 Q 38 8, 54 22 Q 60 36, 50 50 Q 48 56, 40 56 Q 22 58, 12 50 Z"
        {...ink({ strokeWidth: 1.6 })}
      />
      <path
        d="M 18 46 Q 26 40, 34 46"
        {...ink({ strokeWidth: 0.9 })}
        opacity={0.55}
      />
      <path
        d="M 22 50 Q 30 46, 40 50"
        {...ink({ strokeWidth: 0.9 })}
        opacity={0.5}
      />
      <path
        d="M 50 28 l 6 2 l -5 3 z"
        {...ink({ strokeWidth: 1.2 })}
        fill="var(--t-paper)"
      />
      <Eyes emotion={emotion} x1={28} x2={42} y={28} />
      <Mouth emotion={emotion} cx={36} cy={38} />
    </svg>
  );
}
