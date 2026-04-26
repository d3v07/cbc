export interface Session {
  recipient: string;
  occasion: string;
  form: "poem" | "letter";
  guide_id: string;
  vibe: number; // 0=Soft/Cute, 100=Bold/Gothic
}

export interface GuideStub {
  id: string;
  name: string;
  description: string;
  best_for: string[];
  tone_tag: string;
}
