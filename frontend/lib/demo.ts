// Eulogy demo seed — Tomas / Wren / quiet-theme. Lifted verbatim from
// docs/design/hifi/screens-1.jsx. Stub routes in `app/api/*` slice this;
// sprint-2 backend swaps the bodies for real Sonnet/Haiku calls without
// changing the request/response shape components consume.

export interface DemoInterviewTurn {
  q: string;
  a: string;
  mood: "listening" | "curious" | "moved" | "sad" | "hopeful" | "silence";
}

export interface DemoSpineCandidate {
  text: string;
  source_turn_id: string;
  source_label: string;
}

export interface DemoStructureMovement {
  label: string;
  sub: string;
}

export interface DemoDraftLine {
  text: string;
  verified: boolean;
  src: string | null;
  flag?: "cliche";
}

export interface DemoScript {
  recipient: string;
  occasion: string;
  form: "letter" | "poem";
  guide_id: string;
  mascot_id: "wren" | "pip" | "cassio";
  theme: "cute" | "warm" | "quiet" | "noir" | "gothic";
  interview: DemoInterviewTurn[];
  spineCandidates: DemoSpineCandidate[];
  structure: DemoStructureMovement[];
  draft: DemoDraftLine[];
}

export const SCRIPT: DemoScript = {
  recipient: "my grandfather, Tomas",
  occasion: "eulogy",
  form: "letter",
  guide_id: "documentarian",
  mascot_id: "wren",
  theme: "quiet",

  interview: [
    {
      q: "What did he always say when he answered the phone?",
      a: "He'd say 'Pronto, who's calling my house?' — like he was offended you'd dare. He wasn't.",
      mood: "curious",
    },
    {
      q: "What's a thing he did that nobody else would have done?",
      a: "He kept a notebook in his coat pocket. Wrote down strangers' names on the bus so he could greet them next time.",
      mood: "moved",
    },
    {
      q: "When you picture his hands — what are they doing?",
      a: "Fixing the radio. Always the same radio. Tuning the dial like it was a violin string.",
      mood: "listening",
    },
    {
      q: "Was there a phrase only he used?",
      a: "'The world is wide and the kitchen is small.' He'd say it before any meal that took effort.",
      mood: "moved",
    },
    {
      q: "What didn't you get to say?",
      a: "That I learned the radio thing. I tune the dial the same way now. I never told him.",
      mood: "sad",
    },
  ],

  spineCandidates: [
    {
      text: "tuning the dial like it was a violin string",
      source_turn_id: "q3",
      source_label: "q3 · his hands",
    },
    {
      text: "the world is wide and the kitchen is small",
      source_turn_id: "q4",
      source_label: "q4 · his phrase",
    },
    {
      text: "I tune the dial the same way now",
      source_turn_id: "q5",
      source_label: "q5 · what you didn't say",
    },
  ],

  structure: [
    { label: "memory", sub: "the radio, his hands" },
    { label: "phrase", sub: '"world is wide…"' },
    { label: "inheritance", sub: "the dial · the silence · what wasn't said" },
  ],

  draft: [
    {
      text: "Tomas kept a notebook in his coat pocket.",
      verified: true,
      src: "q2",
    },
    {
      text: "He wrote down strangers' names so he could greet them next time.",
      verified: true,
      src: "q2",
    },
    {
      text: "His hands tuned the radio dial like it was a violin string.",
      verified: true,
      src: "q3",
    },
    {
      text: "He used to say: the world is wide and the kitchen is small.",
      verified: true,
      src: "q4",
    },
    {
      text: "He was forever in our hearts.",
      verified: false,
      src: null,
      flag: "cliche",
    },
    {
      text: "I tune the dial the same way now.",
      verified: true,
      src: "q5",
    },
    {
      text: "I never told him.",
      verified: true,
      src: "q5",
    },
  ],
};
