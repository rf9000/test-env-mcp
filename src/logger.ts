/**
 * Simple logger for test discovery modules
 */
export class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const output = `[${timestamp}] [${level}] [${this.name}] ${message}`;

    if (level === 'error') {
      console.error(output, data ? data : '');
    } else if (level === 'warn') {
      console.warn(output, data ? data : '');
    } else if (process.env.LOG_LEVEL === 'debug' || level === 'info') {
      console.log(output, data ? data : '');
    }
  }

  debug(message: string, data?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, data);
    }
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }
}