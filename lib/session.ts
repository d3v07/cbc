const SESSION_KEY = "mean_it_session";

export interface Session {
  recipient: string;
  occasion: string;
  form: "poem" | "letter";
  guide_id: string;
  vibe: number; // 0=Soft/Cute, 100=Bold/Gothic
}

const DEFAULT_SESSION: Session = {
  recipient: "",
  occasion: "",
  form: "letter",
  guide_id: "",
  vibe: 70,
};

export function getSession(): Session {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return DEFAULT_SESSION;
    return { ...DEFAULT_SESSION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SESSION;
  }
}

export function saveSession(session: Partial<Session>): void {
  if (typeof window === "undefined") return;
  const current = getSession();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...session }));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
