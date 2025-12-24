// assets/logger.js
// Lightweight logger with config-driven verbosity.

export function createLogger({ verbose = false } = {}) {
  const noop = () => {};

  return {
    debug: verbose ? console.debug.bind(console) : noop,
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
}

