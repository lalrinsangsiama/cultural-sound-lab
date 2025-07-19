import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    service: 'cultural-sound-lab-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pino({
  ...logger.bindings(),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers,
    }),
    err: pino.stdSerializers.err,
  },
});

export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error({ err: error, ...context }, 'Error occurred');
}

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info(context, message);
}

export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug(context, message);
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn(context, message);
}