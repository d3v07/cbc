import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub localStorage for the client tests. lib/byo-key.ts checks
// `typeof window` so we synthesize a minimal window object.

const store = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
  vi.stubGlobal("window", { localStorage: localStorageStub });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("byo-key client helpers", () => {
  it("getKey returns null when nothing is stored", async () => {
    const { getKey } = await import("@/lib/byo-key");
    expect(getKey()).toBeNull();
  });

  it("setKey then getKey round-trips", async () => {
    const { setKey, getKey } = await import("@/lib/byo-key");
    setKey("sk-ant-secret-key-1234");
    expect(getKey()).toBe("sk-ant-secret-key-1234");
  });

  it("setKey trims whitespace", async () => {
    const { setKey, getKey } = await import("@/lib/byo-key");
    setKey("  sk-ant-padded  \n");
    expect(getKey()).toBe("sk-ant-padded");
  });

  it("setKey with empty string clears the slot", async () => {
    const { setKey, getKey } = await import("@/lib/byo-key");
    setKey("sk-ant-real");
    setKey("   ");
    expect(getKey()).toBeNull();
  });

  it("clearKey removes the stored value", async () => {
    const { setKey, clearKey, getKey } = await import("@/lib/byo-key");
    setKey("sk-ant-temp");
    clearKey();
    expect(getKey()).toBeNull();
  });

  it("maskKey reveals only last 4 chars with sk-… prefix", async () => {
    const { maskKey } = await import("@/lib/byo-key");
    expect(maskKey("sk-ant-api03-abcdefghij1234")).toBe("sk-…1234");
    expect(maskKey(null)).toBe("");
    expect(maskKey(undefined)).toBe("");
    expect(maskKey("abc")).toBe("sk-…"); // too short to safely show
  });

  it("withKeyHeader patches a plain object with the header when key is present", async () => {
    const { setKey, withKeyHeader, ANTHROPIC_KEY_HEADER } = await import("@/lib/byo-key");
    setKey("sk-ant-real");
    const headers = withKeyHeader({ "Content-Type": "application/json" }) as Record<string, string>;
    expect(headers[ANTHROPIC_KEY_HEADER]).toBe("sk-ant-real");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("withKeyHeader leaves Headers instances intact when no key is set", async () => {
    const { withKeyHeader, ANTHROPIC_KEY_HEADER } = await import("@/lib/byo-key");
    const original = new Headers({ "Content-Type": "application/json" });
    const out = withKeyHeader(original) as Headers;
    expect(out.get(ANTHROPIC_KEY_HEADER)).toBeNull();
    expect(out.get("Content-Type")).toBe("application/json");
  });

  it("withKeyHeader patches a Headers instance when key is set", async () => {
    const { setKey, withKeyHeader, ANTHROPIC_KEY_HEADER } = await import("@/lib/byo-key");
    setKey("sk-ant-real");
    const original = new Headers({ "Content-Type": "application/json" });
    const out = withKeyHeader(original) as Headers;
    expect(out.get(ANTHROPIC_KEY_HEADER)).toBe("sk-ant-real");
  });
});

describe("byo-key/server reader", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function fakeRequest(headers: Record<string, string>) {
    const map = new Map<string, string>(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    return { headers: { get: (n: string) => map.get(n.toLowerCase()) ?? null } };
  }

  it("readKey returns the X-Anthropic-Key header when present", async () => {
    vi.doMock("@/lib/env", () => ({ env: () => ({ ANTHROPIC_API_KEY: "sk-env-fallback" }) }));
    const { readKey } = await import("@/lib/byo-key/server");
    const k = readKey(fakeRequest({ "X-Anthropic-Key": "sk-byo-from-header" }) as never);
    expect(k).toBe("sk-byo-from-header");
  });

  it("readKey falls back to env() when header is missing", async () => {
    vi.doMock("@/lib/env", () => ({ env: () => ({ ANTHROPIC_API_KEY: "sk-env-fallback" }) }));
    const { readKey } = await import("@/lib/byo-key/server");
    const k = readKey(fakeRequest({}) as never);
    expect(k).toBe("sk-env-fallback");
  });

  it("readKey returns null when neither header nor env is set", async () => {
    vi.doMock("@/lib/env", () => ({
      env: () => {
        throw new Error("no env");
      },
    }));
    const { readKey } = await import("@/lib/byo-key/server");
    const k = readKey(fakeRequest({}) as never);
    expect(k).toBeNull();
  });

  it("keyOriginTag distinguishes byo / env / missing", async () => {
    vi.doMock("@/lib/env", () => ({ env: () => ({ ANTHROPIC_API_KEY: "sk-env" }) }));
    const { keyOriginTag } = await import("@/lib/byo-key/server");
    expect(keyOriginTag(fakeRequest({ "X-Anthropic-Key": "sk-byo" }) as never)).toBe("byo");
    expect(keyOriginTag(fakeRequest({}) as never)).toBe("env");

    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      env: () => {
        throw new Error("missing");
      },
    }));
    const { keyOriginTag: tagAgain } = await import("@/lib/byo-key/server");
    expect(tagAgain(fakeRequest({}) as never)).toBe("missing");
  });
});
