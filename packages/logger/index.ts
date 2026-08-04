import pino from "pino";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";

const logPath = resolve(
  __dirname,
  "../../logs",
  `${new Date().toISOString().substring(0, 10)}.log`
);
mkdirSync(dirname(logPath), { recursive: true });

const _logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
}, pino.destination(logPath));

const access = _logger.child({ module: "access" });
const auth = _logger.child({ module: "auth" });

export const logger = {
  ..._logger,
  access,
  auth,
}

export type Logger = typeof _logger;
