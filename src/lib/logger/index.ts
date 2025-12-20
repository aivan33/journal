import pino from 'pino'
import { getLoggerConfig } from './config'

// Create the logger instance
export const logger = pino(getLoggerConfig())

/**
 * Create a child logger with additional context
 * @param context - Additional context to include in all logs
 * @example
 * const requestLogger = createLogger({ requestId: '123', userId: 'user-456' })
 * requestLogger.info('Processing request')
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}

/**
 * Log an error with context
 * @param err - Error object
 * @param message - Error message
 * @param context - Additional context
 */
export function logError(
  err: Error,
  message: string,
  context?: Record<string, any>
) {
  logger.error({ err, ...context }, message)
}

/**
 * Log info with context
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(context || {}, message)
}

/**
 * Log warning with context
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(context || {}, message)
}

/**
 * Log debug with context
 * @param message - Debug message
 * @param context - Additional context
 */
export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(context || {}, message)
}
