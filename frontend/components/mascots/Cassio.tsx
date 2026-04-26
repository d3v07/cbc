import { Eyes } from "./Eyes";
import { Mouth } from "./Mouth";
import { ink } from "./_shared";
import type { Emotion } from "./types";

interface CassioProps {
  emotion?: Emotion;
  size?: number;
}

// Songwriter's mascot — long-form crescent.
export function Cassio({ emotion = "moved", size = 96 }: CassioProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      className="anim-mascot"
      role="img"
      aria-label={`Cassio mascot, ${emotion}`}
    >
      <path
        d="M 50 14 q -28 4 -28 22 q 0 18 28 22 q -16 -8 -16 -22 q 0 -14 16 -22 z"
        {...ink({ strokeWidth: 1.6 })}
      />
      <path
        d="M 16 56 q 4 -3 8 0 t 8 0"
        {...ink({ strokeWidth: 0.9 })}
        opacity={0.5}
      />
      <Eyes emotion={emotion} x1={30} x2={42} y={32} />
      <Mouth emotion={emotion} cx={36} cy={42} />
    </svg>
  );
}
