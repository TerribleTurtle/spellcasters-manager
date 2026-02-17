import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for local dev: "HH:mm:ss [LEVEL]: message"
const devFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction 
    ? json() // JSON for structured logging in prod
    : combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        devFormat
      ),
  transports: [
    new winston.transports.Console()
  ],
});
