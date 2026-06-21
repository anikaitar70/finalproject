export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logFatal, logInfo } = await import("./lib/logger");

    logInfo("application.startup", {
      nodeEnv: process.env.NODE_ENV ?? "development",
      nodeVersion: process.version,
    });

    process.on("uncaughtException", (error) => {
      logFatal("process.uncaughtException", {
        message: error.message,
        stack: error.stack,
      });
    });

    process.on("unhandledRejection", (reason) => {
      logFatal("process.unhandledRejection", {
        reason:
          reason instanceof Error ? reason.message : String(reason),
      });
    });
  }
}
