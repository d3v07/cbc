import { ink } from "./_shared";
import type { Emotion } from "./types";

interface MouthProps {
  emotion: Emotion;
  cx?: number;
  cy?: number;
}

export function Mouth({ emotion, cx = 34, cy = 40 }: MouthProps) {
  if (emotion === "listening") {
    return <path d={`M ${cx - 3} ${cy} h 6`} {...ink()} />;
  }
  if (emotion === "curious") {
    return <path d={`M ${cx - 3} ${cy - 1} q 3 3 6 0`} {...ink()} />;
  }
  if (emotion === "moved") {
    return <path d={`M ${cx - 3} ${cy - 1} q 3 2 6 -1`} {...ink()} />;
  }
  if (emotion === "sad") {
    return <path d={`M ${cx - 4} ${cy + 1} q 4 -3 8 0`} {...ink()} />;
  }
  if (emotion === "hopeful") {
    return <path d={`M ${cx - 3} ${cy - 1} q 3 4 6 0`} {...ink()} />;
  }
  if (emotion === "silence") {
    return <path d={`M ${cx - 2} ${cy} h 4`} {...ink({ strokeWidth: 1.2 })} />;
  }
  return null;
}
