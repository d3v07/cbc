type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, fields: Record<string, unknown> = {}) {
  // Spread caller fields first; reserved keys below cannot be overwritten.
  const entry = {
    ...fields,
    level,
    message,
    service: "cbc",
    timestamp: new Date().toISOString(),
  };
  // Single allowed console call — structured JSON output.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const log = {
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};
