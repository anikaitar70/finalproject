type LogLevel = "info" | "warn" | "error" | "fatal";

type LogPayload = Record<string, unknown>;

function writeLog(level: LogLevel, event: string, payload: LogPayload = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    service: "credranknet",
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (level === "error" || level === "fatal") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, payload?: LogPayload) {
  writeLog("info", event, payload);
}

export function logWarn(event: string, payload?: LogPayload) {
  writeLog("warn", event, payload);
}

export function logError(event: string, payload?: LogPayload) {
  writeLog("error", event, payload);
}

export function logFatal(event: string, payload?: LogPayload) {
  writeLog("fatal", event, payload);
}

export function getRequestId(headers: Headers): string {
  return headers.get("x-request-id") ?? crypto.randomUUID();
}
