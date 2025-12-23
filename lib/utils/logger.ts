/**
 * ============================================================================
 * 📝 Logger Utility
 * ============================================================================
 *
 * A friendly, formatted logger for development and debugging.
 * Uses emojis and colors to make logs easy to scan!
 *
 * Features:
 * - Emoji prefixes for quick visual identification
 * - Timestamps for tracking when things happen
 * - Grouping for related log messages
 * - Structured data logging
 *
 * Usage:
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Failed to save', error)
 *   logger.success('Task completed!')
 *
 * ============================================================================
 */

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LogOptions {
  /** Additional data to log */
  data?: Record<string, unknown>;
  /** Group related logs together */
  group?: string;
}

/**
 * Format a timestamp for display
 */
function getTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Get emoji and style for each log level
 */
function getLevelConfig(level: LogLevel) {
  const configs = {
    debug: { emoji: '🔍', color: 'color: #888' },
    info: { emoji: '📘', color: 'color: #3b82f6' },
    success: { emoji: '✅', color: 'color: #22c55e' },
    warn: { emoji: '⚠️', color: 'color: #f59e0b' },
    error: { emoji: '❌', color: 'color: #ef4444' },
  };
  return configs[level];
}

/**
 * Internal log function
 */
function log(level: LogLevel, message: string, options?: LogOptions): void {
  // Skip debug logs in production
  if (level === 'debug' && process.env.NODE_ENV === 'production') {
    return;
  }

  const config = getLevelConfig(level);
  const timestamp = getTimestamp();
  const prefix = `${config.emoji} [${timestamp}]`;

  // Build the log message
  const formattedMessage = `${prefix} ${message}`;

  // Choose console method based on level
  const consoleMethods = {
    debug: console.debug,
    info: console.info,
    success: console.log,
    warn: console.warn,
    error: console.error,
  };

  const consoleMethod = consoleMethods[level];

  // Log with or without data
  if (options?.data) {
    consoleMethod(formattedMessage, '\n📦 Data:', options.data);
  } else {
    consoleMethod(formattedMessage);
  }
}

/**
 * Create a log group (collapsible in browser console)
 */
function group(label: string, fn: () => void): void {
  console.group(`📁 ${label}`);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
}

/**
 * Log app startup information
 */
function startup(appName: string, version?: string): void {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log(`║  🏠 ${appName.padEnd(53)} ║`);
  if (version) {
    console.log(`║  📦 Version: ${version.padEnd(45)} ║`);
  }
  console.log(`║  🕐 Started: ${new Date().toLocaleString().padEnd(45)} ║`);
  console.log(`║  🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(41)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

/**
 * Log a horizontal divider
 */
function divider(label?: string): void {
  if (label) {
    console.log(`\n━━━━━ ${label} ━━━━━\n`);
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

/**
 * The logger object with all methods
 */
export const logger = {
  /**
   * Debug level - for development troubleshooting
   * @example logger.debug('Checking auth state', { isLoggedIn: true })
   */
  debug: (message: string, data?: Record<string, unknown>) =>
    log('debug', message, { data }),

  /**
   * Info level - for general information
   * @example logger.info('User navigated to dashboard')
   */
  info: (message: string, data?: Record<string, unknown>) =>
    log('info', message, { data }),

  /**
   * Success level - for successful operations
   * @example logger.success('Task saved successfully!')
   */
  success: (message: string, data?: Record<string, unknown>) =>
    log('success', message, { data }),

  /**
   * Warning level - for potential issues
   * @example logger.warn('API rate limit approaching')
   */
  warn: (message: string, data?: Record<string, unknown>) =>
    log('warn', message, { data }),

  /**
   * Error level - for errors and failures
   * @example logger.error('Failed to load tasks', { error: err.message })
   */
  error: (message: string, data?: Record<string, unknown>) =>
    log('error', message, { data }),

  /**
   * Group related logs together
   * @example logger.group('Auth Flow', () => { ... })
   */
  group,

  /**
   * Log app startup banner
   * @example logger.startup('Fam', '1.0.0')
   */
  startup,

  /**
   * Log a divider line
   * @example logger.divider('Loading Tasks')
   */
  divider,

  /**
   * Log a table of data
   * @example logger.table([{ id: 1, name: 'Task 1' }])
   */
  table: (data: unknown[]) => console.table(data),
};

export default logger;
