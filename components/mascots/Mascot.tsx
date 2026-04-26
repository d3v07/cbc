import { Cassio } from "./Cassio";
import { Pip } from "./Pip";
import { Wren } from "./Wren";
import type { Emotion, MascotId } from "./types";

interface MascotProps {
  id: MascotId;
  emotion?: Emotion;
  size?: number;
}

export function Mascot({ id, emotion, size }: MascotProps) {
  if (id === "wren") return <Wren emotion={emotion} size={size} />;
  if (id === "pip") return <Pip emotion={emotion} size={size} />;
  if (id === "cassio") return <Cassio emotion={emotion} size={size} />;
  return null;
}
