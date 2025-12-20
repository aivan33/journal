import type { LoggerOptions } from 'pino'

export function getLoggerConfig(): LoggerOptions {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  // Check if we're running in Next.js runtime (avoid worker threads)
  const isNextJSRuntime = typeof globalThis !== 'undefined' &&
    (globalThis as any).__next_set_public_dir__

  return {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

    // Disable logging in test environment unless explicitly enabled
    enabled: isTest ? process.env.ENABLE_LOGS === 'true' : true,

    // Only use pino-pretty transport in development AND not in Next.js runtime
    // (worker threads don't work in Next.js)
    ...(isDevelopment && !isNextJSRuntime && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    }),

    formatters: {
      level: (label) => ({ level: label }),
    },

    serializers: {
      err: (err) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
      }),
    },
  }
}
