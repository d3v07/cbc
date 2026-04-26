import { describe, expect, it } from "vitest";
import {
  ArtifactSchema,
  AuditEntrySchema,
  CritiqueCardSchema,
  FormSchema,
  PhotoMetaSchema,
  ProvenanceLineSchema,
  SessionSchema,
  ThemeSchema,
  TurnSchema,
} from "@/lib/types/session";

describe("ThemeSchema", () => {
  it("accepts each valid theme", () => {
    for (const t of ["cute", "warm", "quiet", "noir", "gothic"] as const) {
      expect(ThemeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects unknown themes", () => {
    expect(() => ThemeSchema.parse("ugly")).toThrow();
  });
});

describe("FormSchema", () => {
  it("round-trips poem and letter", () => {
    expect(FormSchema.parse("poem")).toBe("poem");
    expect(FormSchema.parse("letter")).toBe("letter");
  });
});

describe("PhotoMetaSchema", () => {
  it("round-trips with all fields", () => {
    const obj = {
      file_id: "f_1",
      mime: "image/jpeg",
      size: 1024,
      subject: "grandma at the kitchen table",
      setting: "October kitchen",
      mood: "warm",
    };
    expect(PhotoMetaSchema.parse(obj)).toEqual(obj);
  });

  it("round-trips with only required fields", () => {
    const obj = { file_id: "f_1", mime: "image/jpeg", size: 1024 };
    expect(PhotoMetaSchema.parse(obj)).toEqual(obj);
  });

  it("rejects negative size", () => {
    expect(() =>
      PhotoMetaSchema.parse({ file_id: "f_1", mime: "image/jpeg", size: -1 }),
    ).toThrow();
  });
});

describe("AuditEntrySchema", () => {
  it("round-trips a tripped + blocked entry", () => {
    const obj = {
      ts: 1714123456789,
      message_id: "m_1",
      flags_tripped: ["drafted_line"],
      reason: "third sentence is a complete poetic line",
      blocked: true,
    };
    expect(AuditEntrySchema.parse(obj)).toEqual(obj);
  });

  it("blocked defaults to false (log-only mode)", () => {
    const obj = {
      ts: 1714123456789,
      message_id: "m_1",
      flags_tripped: ["register_drift"],
      reason: "drifted into letter prose",
    };
    expect(AuditEntrySchema.parse(obj).blocked).toBe(false);
  });

  it("requires at least one tripped flag", () => {
    expect(() =>
      AuditEntrySchema.parse({
        ts: 1,
        message_id: "m_1",
        flags_tripped: [],
        reason: "x",
      }),
    ).toThrow();
  });
});

describe("SessionSchema", () => {
  it("round-trips a full session", () => {
    const obj = {
      id: "s_1",
      recipient: "Grandma",
      occasion: "80th birthday",
      form: "poem" as const,
      guide_id: "documentarian",
      theme: "warm" as const,
      photos: [],
      audit: [],
      created_at: 1714123456789,
    };
    expect(SessionSchema.parse(obj)).toEqual(obj);
  });

  it("photos and audit default to empty arrays", () => {
    const obj = {
      id: "s_1",
      recipient: "G",
      occasion: "x",
      form: "letter",
      guide_id: "songwriter",
      theme: "quiet",
      created_at: 1,
    };
    const parsed = SessionSchema.parse(obj);
    expect(parsed.photos).toEqual([]);
    expect(parsed.audit).toEqual([]);
  });

  it("rejects invalid form", () => {
    expect(() =>
      SessionSchema.parse({
        id: "s_1",
        recipient: "x",
        occasion: "x",
        form: "song",
        guide_id: "x",
        theme: "warm",
        created_at: 1,
      }),
    ).toThrow();
  });
});

describe("TurnSchema", () => {
  it("round-trips with phrases_held", () => {
    const obj = {
      id: "t_1",
      session_id: "s_1",
      role: "user" as const,
      text: "Her hands always smelled like garlic and orange peel.",
      ts: 1,
      phrases_held: ["garlic and orange peel"],
    };
    expect(TurnSchema.parse(obj)).toEqual(obj);
  });

  it("round-trips without phrases_held", () => {
    const obj = {
      id: "t_1",
      session_id: "s_1",
      role: "guide" as const,
      text: "What did her hands actually do?",
      ts: 1,
    };
    expect(TurnSchema.parse(obj)).toEqual(obj);
  });
});

describe("ProvenanceLineSchema", () => {
  it("round-trips each match kind", () => {
    for (const match of ["exact", "fuzzy", "none"] as const) {
      const obj = {
        line: "her hands always smelled like garlic",
        source_turn_id: "t_1",
        source_text: "her hands always smelled like garlic and orange peel",
        match,
      };
      expect(ProvenanceLineSchema.parse(obj)).toEqual(obj);
    }
  });
});

describe("ArtifactSchema", () => {
  it("round-trips a poem artifact with provenance", () => {
    const obj = {
      session_id: "s_1",
      text: "her hands\nsmelled like garlic\nand orange peel",
      provenance: [
        {
          line: "her hands",
          source_turn_id: "t_1",
          source_text: "her hands always smelled like garlic and orange peel",
          match: "exact" as const,
        },
      ],
      byline_pct: 100,
      created_at: 1714123456789,
    };
    expect(ArtifactSchema.parse(obj)).toEqual(obj);
  });

  it("rejects byline_pct > 100", () => {
    expect(() =>
      ArtifactSchema.parse({
        session_id: "s_1",
        text: "x",
        provenance: [],
        byline_pct: 150,
        created_at: 1,
      }),
    ).toThrow();
  });

  it("rejects negative byline_pct", () => {
    expect(() =>
      ArtifactSchema.parse({
        session_id: "s_1",
        text: "x",
        provenance: [],
        byline_pct: -1,
        created_at: 1,
      }),
    ).toThrow();
  });
});

describe("CritiqueCardSchema", () => {
  it("round-trips each kind", () => {
    for (const kind of ["cliche", "question", "verified"] as const) {
      const obj = { kind, body: "..." };
      expect(CritiqueCardSchema.parse(obj)).toEqual(obj);
    }
  });

  it("round-trips with optional line_ref", () => {
    const obj = {
      kind: "verified" as const,
      line_ref: "line-3",
      body: "all words yours",
    };
    expect(CritiqueCardSchema.parse(obj)).toEqual(obj);
  });

  it("rejects empty body", () => {
    expect(() =>
      CritiqueCardSchema.parse({ kind: "cliche", body: "" }),
    ).toThrow();
  });
});
