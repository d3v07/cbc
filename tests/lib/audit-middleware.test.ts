import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAudit } from "@/lib/interview/audit-middleware";
import type { Guide } from "@/lib/guides/schema";

const guide: Guide = {
  id: "test-guide",
  name: "The Tester",
  sensibility: "x",
  best_for: ["x"],
  voice_rules: ["x"],
  allowed: ["x"],
  forbidden: ["draft any line of the artifact"],
  question_bank: ["x?"],
  audit_flags: [
    {
      name: "drafted_line",
      description: "The message contains a draftable line.",
    },
  ],
  sample_meta_comments: [],
  description: "",
  source: "builtin",
};

interface MockClient {
  messages: {
    create: ReturnType<typeof vi.fn>;
  };
}

function makeClient(impl: (...args: unknown[]) => unknown): MockClient {
  return { messages: { create: vi.fn().mockImplementation(impl) } };
}

const auditResponse = (flags: string[], reason: string) => ({
  content: [
    {
      type: "tool_use",
      name: "record_audit",
      input: { flags_tripped: flags, reason },
    },
  ],
});

beforeEach(() => {
  delete process.env.AUDIT_BLOCK;
});
afterEach(() => {
  delete process.env.AUDIT_BLOCK;
});

describe("runAudit", () => {
  it("returns allow=true and empty flags on a clean message", async () => {
    const client = makeClient(async () => auditResponse([], ""));
    const result = await runAudit({
      message: "clean question?",
      guide,
      client: client as never,
    });
    expect(result.allow).toBe(true);
    expect(result.flags_tripped).toEqual([]);
  });

  it("default (log-only) mode: flags tripped but allow stays true", async () => {
    const client = makeClient(async () =>
      auditResponse(["drafted_line"], "draft detected"),
    );
    const result = await runAudit({
      message: "Tomas kept a notebook in his coat pocket.",
      guide,
      client: client as never,
    });
    expect(result.allow).toBe(true);
    expect(result.flags_tripped).toEqual(["drafted_line"]);
    expect(result.reason).toBe("draft detected");
  });

  it("AUDIT_BLOCK=1: flags tripped → allow=false", async () => {
    process.env.AUDIT_BLOCK = "1";
    const client = makeClient(async () =>
      auditResponse(["drafted_line"], "draft detected"),
    );
    const result = await runAudit({
      message: "drafty content",
      guide,
      client: client as never,
    });
    expect(result.allow).toBe(false);
    expect(result.flags_tripped).toEqual(["drafted_line"]);
  });

  it("AUDIT_BLOCK=1 but no flags tripped → allow=true", async () => {
    process.env.AUDIT_BLOCK = "1";
    const client = makeClient(async () => auditResponse([], ""));
    const result = await runAudit({
      message: "clean",
      guide,
      client: client as never,
    });
    expect(result.allow).toBe(true);
  });

  it("on Anthropic failure, allow=true (don't block on infra)", async () => {
    const client = makeClient(async () => {
      throw new Error("model unavailable");
    });
    const result = await runAudit({
      message: "anything",
      guide,
      client: client as never,
    });
    expect(result.allow).toBe(true);
    expect(result.flags_tripped).toEqual([]);
    expect(result.reason).toBe("");
  });
});
