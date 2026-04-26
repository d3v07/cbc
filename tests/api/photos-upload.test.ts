import { beforeEach, describe, expect, it, vi } from "vitest";

// Stub env + Anthropic client BEFORE the route is imported.
vi.mock("@/lib/env", () => ({
  env: () => ({ ANTHROPIC_API_KEY: "test-key", NODE_ENV: "test" }),
}));

const uploadMock = vi.fn();
vi.mock("@/lib/anthropic", () => ({
  anthropic: () => ({ beta: { files: { upload: uploadMock } } }),
}));

import { POST } from "@/app/api/photos/upload/route";

function makeRequest(body: BodyInit | null, init: RequestInit = {}): Request {
  return new Request("http://localhost/api/photos/upload", {
    method: "POST",
    body,
    ...init,
  });
}

describe("POST /api/photos/upload", () => {
  beforeEach(() => uploadMock.mockReset());

  it("rejects non-multipart bodies with 400", async () => {
    const res = await POST(makeRequest("not-a-form") as never);
    expect(res.status).toBe(400);
  });

  it("rejects when 'file' field is missing", async () => {
    const fd = new FormData();
    fd.set("other", "x");
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(400);
  });

  it("rejects unsupported content types with 415", async () => {
    const fd = new FormData();
    fd.set("file", new File(["abc"], "x.txt", { type: "text/plain" }));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(415);
  });

  it("forwards a JPEG to Anthropic Files API and returns file_id", async () => {
    uploadMock.mockResolvedValueOnce({ id: "file_abc123" });
    const fd = new FormData();
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff])], "p.jpg", { type: "image/jpeg" });
    fd.set("file", jpeg);

    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { file_id: string; mime: string; size: number };
    expect(body.file_id).toBe("file_abc123");
    expect(body.mime).toBe("image/jpeg");
    expect(uploadMock).toHaveBeenCalledOnce();
  });

  it("returns upstream status when Anthropic rejects the upload", async () => {
    uploadMock.mockRejectedValueOnce(Object.assign(new Error("nope"), { status: 401 }));
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([1])], "p.png", { type: "image/png" }));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(401);
  });
});
