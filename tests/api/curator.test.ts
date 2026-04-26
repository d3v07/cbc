import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ ANTHROPIC_API_KEY: "test-key", NODE_ENV: "test" }),
}));

const createMock = vi.fn();
vi.mock("@/lib/anthropic", () => ({
  anthropic: () => ({ messages: { create: createMock } }),
}));

import { POST } from "@/app/api/curator/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/curator", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validInput = {
  poem: "Her hands always smelled like garlic and orange peel.",
  photos: [
    { file_id: "file_1", subject: "grandmother", setting: "kitchen", mood: "warm" },
    { file_id: "file_2", subject: "candle", setting: "windowsill", mood: "still" },
  ],
  voice_lines: [
    { line: "Her hands always smelled.", start: 0, end: 2 },
    { line: "Like garlic and orange peel.", start: 2, end: 4 },
  ],
};

function storyboard(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    content: [
      {
        type: "tool_use",
        name: "build_storyboard",
        input: {
          theme: "warm",
          total_duration_ms: 4000,
          caption_preset: "serif-italic",
          clips: [
            {
              file_id: "file_1",
              start_ms: 0,
              duration_ms: 2000,
              caption: "Her hands always smelled.",
              ken_burns: { start: { x: 0.4, y: 0.5, scale: 1.1 }, end: { x: 0.5, y: 0.5, scale: 1.2 } },
            },
            {
              file_id: "file_2",
              start_ms: 2000,
              duration_ms: 2000,
              caption: "Like garlic and orange peel.",
              ken_burns: { start: { x: 0.5, y: 0.5, scale: 1.0 }, end: { x: 0.5, y: 0.5, scale: 1.1 } },
            },
          ],
          ...overrides,
        },
      },
    ],
  };
}

describe("POST /api/curator", () => {
  beforeEach(() => createMock.mockReset());

  it("rejects missing poem with 400", async () => {
    const res = await POST(makeRequest({ ...validInput, poem: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects empty photos array", async () => {
    const res = await POST(makeRequest({ ...validInput, photos: [] }) as never);
    expect(res.status).toBe(400);
  });

  it("returns a valid storyboard with default theme=warm", async () => {
    createMock.mockResolvedValueOnce(storyboard());
    // validInput intentionally omits `theme` so the schema default kicks in.
    const res = await POST(makeRequest(validInput) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { storyboard: { theme: string; clips: unknown[] } };
    expect(body.storyboard.theme).toBe("warm");
    expect(body.storyboard.clips).toHaveLength(2);
  });

  it("threads theme parameter through to the storyboard", async () => {
    createMock.mockResolvedValueOnce(
      storyboard({ theme: "gothic", caption_preset: "serif-italic" }),
    );
    const res = await POST(makeRequest({ ...validInput, theme: "gothic" }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { storyboard: { theme: string } };
    expect(body.storyboard.theme).toBe("gothic");
  });

  it("rejects clips that reference unknown file_ids (502)", async () => {
    createMock.mockResolvedValueOnce(
      storyboard({
        clips: [
          {
            file_id: "file_unknown",
            start_ms: 0,
            duration_ms: 4000,
            caption: "x",
            ken_burns: {
              start: { x: 0.5, y: 0.5, scale: 1.0 },
              end: { x: 0.5, y: 0.5, scale: 1.1 },
            },
          },
        ],
      }),
    );
    const res = await POST(makeRequest(validInput) as never);
    expect(res.status).toBe(502);
  });

  it("rejects clips that exceed total_duration_ms (502)", async () => {
    createMock.mockResolvedValueOnce(
      storyboard({
        total_duration_ms: 1000,
        clips: [
          {
            file_id: "file_1",
            start_ms: 0,
            duration_ms: 5000,
            ken_burns: {
              start: { x: 0.5, y: 0.5, scale: 1.0 },
              end: { x: 0.5, y: 0.5, scale: 1.1 },
            },
          },
        ],
      }),
    );
    const res = await POST(makeRequest(validInput) as never);
    expect(res.status).toBe(502);
  });

  it("returns 502 if the model omits the tool call", async () => {
    createMock.mockResolvedValueOnce({ content: [{ type: "text", text: "no tool" }] });
    const res = await POST(makeRequest(validInput) as never);
    expect(res.status).toBe(502);
  });
});
