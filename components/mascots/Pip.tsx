import { Eyes } from "./Eyes";
import { Mouth } from "./Mouth";
import { ink } from "./_shared";
import type { Emotion } from "./types";

interface PipProps {
  emotion?: Emotion;
  size?: number;
}

// Poet of Small Things mascot — round petal-bodied creature.
export function Pip({ emotion = "curious", size = 96 }: PipProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      className="anim-mascot"
      role="img"
      aria-label={`Pip mascot, ${emotion}`}
    >
      <path
        d="M 14 30 q -6 -10 4 -16 q 8 -3 12 6"
        {...ink({ strokeWidth: 1 })}
        opacity={0.55}
      />
      <path
        d="M 54 30 q 6 -10 -4 -16 q -8 -3 -12 6"
        {...ink({ strokeWidth: 1 })}
        opacity={0.55}
      />
      <path
        d="M 16 36 Q 16 18, 34 16 Q 52 18, 52 36 Q 52 54, 34 56 Q 16 54, 16 36 Z"
        {...ink({ strokeWidth: 1.6 })}
      />
      <path d="M 34 16 q 0 -4 3 -6" {...ink({ strokeWidth: 1 })} />
      <Eyes emotion={emotion} x1={28} x2={42} y={32} />
      <Mouth emotion={emotion} cx={34} cy={42} />
    </svg>
  );
}
