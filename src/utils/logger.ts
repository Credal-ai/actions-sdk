export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const ORDER: readonly LogLevel[] = ["silent", "error", "warn", "info", "debug"];

const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "string" && (ORDER as readonly string[]).includes(value);

const envLevel = process.env.CREDAL_ACTIONS_LOG_LEVEL;
let activeLevel: LogLevel = isLogLevel(envLevel) ? envLevel : "error";

export function setLogLevel(level: LogLevel): void {
  activeLevel = level;
}

export function getLogLevel(): LogLevel {
  return activeLevel;
}

const enabled = (callLevel: Exclude<LogLevel, "silent">): boolean =>
  ORDER.indexOf(callLevel) <= ORDER.indexOf(activeLevel);

export const log = {
  error: (...args: unknown[]): void => {
    if (enabled("error")) console.error(...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled("warn")) console.warn(...args);
  },
  info: (...args: unknown[]): void => {
    if (enabled("info")) console.info(...args);
  },
  debug: (...args: unknown[]): void => {
    if (enabled("debug")) console.debug(...args);
  },
};
