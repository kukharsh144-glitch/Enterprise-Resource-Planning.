// ===== LOGGING SERVICE =====

/**
 * Logger Service
 * Provides structured logging with different levels
 */
export class Logger {
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    if (level === "error") {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  info(message, data) {
    this.log("info", message, data);
  }

  error(message, error) {
    this.log("error", message, {
      error: error?.message || error,
      stack: error?.stack,
    });
  }

  warn(message, data) {
    this.log("warn", message, data);
  }
}

export const logger = new Logger();

export default logger;