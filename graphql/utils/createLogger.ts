import winston from "winston";

const customFormatForDev = winston.format.printf(
  ({ level, message, label, timestamp, ...args }) =>
    `  ${String(timestamp)} [${String(label)}] ${level}: ${String(message)} ${
      Object.keys(args).length === 0 ? "" : `\n     ${JSON.stringify(args)}`
    }`,
);

export default function createLogger(label: string) {
  return winston.createLogger({
    level: process.env.NODE_ENV !== "production" ? "debug" : "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label }),
      ...(process.env.NODE_ENV !== "production"
        ? [winston.format.colorize(), customFormatForDev]
        : [winston.format.json()]),
    ),
    transports: [new winston.transports.Console()],
  });
}
