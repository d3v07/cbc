import { ACCENT, STROKE, ink } from "./_shared";
import type { Emotion } from "./types";

interface EyesProps {
  emotion: Emotion;
  x1?: number;
  x2?: number;
  y?: number;
}

export function Eyes({ emotion, x1 = 26, x2 = 42, y = 30 }: EyesProps) {
  if (emotion === "listening") {
    return (
      <g>
        <circle cx={x1} cy={y} r={1.4} fill={STROKE} />
        <circle cx={x2} cy={y} r={1.4} fill={STROKE} />
      </g>
    );
  }
  if (emotion === "curious") {
    return (
      <g>
        <path d={`M ${x1 - 3} ${y - 3} q 3 -2 6 0`} {...ink()} />
        <circle cx={x1} cy={y} r={1.4} fill={STROKE} />
        <circle cx={x2} cy={y} r={1.4} fill={STROKE} />
      </g>
    );
  }
  if (emotion === "moved") {
    return (
      <g>
        <path d={`M ${x1 - 3} ${y} q 3 2 6 0`} {...ink()} />
        <path d={`M ${x2 - 3} ${y} q 3 2 6 0`} {...ink()} />
      </g>
    );
  }
  if (emotion === "sad") {
    return (
      <g>
        <path d={`M ${x1 - 3} ${y + 2} q 3 -3 6 0`} {...ink()} />
        <path d={`M ${x2 - 3} ${y + 2} q 3 -3 6 0`} {...ink()} />
        <path
          d={`M ${x2 + 1} ${y + 4} q 1 4 0 6`}
          {...ink({ stroke: ACCENT, strokeWidth: 1 })}
        />
      </g>
    );
  }
  if (emotion === "hopeful") {
    return (
      <g>
        <circle cx={x1 + 1} cy={y - 1.5} r={1.4} fill={STROKE} />
        <circle cx={x2 + 1} cy={y - 1.5} r={1.4} fill={STROKE} />
      </g>
    );
  }
  if (emotion === "silence") {
    return (
      <g>
        <path d={`M ${x1 - 3} ${y} h 6`} {...ink()} />
        <path d={`M ${x2 - 3} ${y} h 6`} {...ink()} />
      </g>
    );
  }
  return null;
}
