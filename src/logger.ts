import chalk from 'chalk';

export class LogLevel {
  static OFF = 0;
  static ERROR = 1;
  static WARN = 2;
  static INFO = 3;
  static LOG = 4;
  static DEBUG = 5;
  static TRACE = 6;
  static ALL = 7;
}

export const VisualLogLevel = [
  'Off',
  'Error',
  'Warn',
  'Info',
  'Log',
  'Debug',
  'Trace',
  'All',
];

export const VisualLogColorFunction = [
  chalk.white,
  chalk.red,
  chalk.yellow,
  chalk.green,
  chalk.white,
  chalk.gray,
  chalk.gray,
  chalk.white,
];

export class LoggerOptions {
  logLevel: LogLevel;
}

export class Logger {
  // static loggers = [];
  constructor(
    private _loggerName: string,
    private _opt: LoggerOptions = {
      logLevel: LogLevel.DEBUG,
    },
  ) {
    // Logger.loggers.push(this);
  }

  public base(logLevel: number = LogLevel.LOG, ...args: any[]): void {
    if (this._opt.logLevel >= logLevel) {
      // eslint-disable-next-line no-console
      console[logLevel > LogLevel.WARN ? 'log' : 'error'].apply(console, [
        chalk.cyan(`${this._loggerName}>`) +
          VisualLogColorFunction[logLevel](`${VisualLogLevel[logLevel]}>`),
        ...args,
      ]);
    }
  }

  public trace(...args: any[]): void {
    this.base(LogLevel.TRACE, args);
  }

  public debug(...args: any[]): void {
    this.base(LogLevel.DEBUG, args);
  }

  public log(...args: any[]): void {
    this.base(LogLevel.LOG, args);
  }

  public info(...args: any[]): void {
    this.base(LogLevel.INFO, args);
  }

  public warn(...args: any[]): void {
    this.base(LogLevel.WARN, args);
  }

  public error(...args: any[]): void {
    this.base(LogLevel.ERROR, args);
  }

  public setLogLevel(logLevel: LogLevel): void {
    this._opt.logLevel = logLevel;
  }
}

export const defaultLogger = new Logger('Global', new LoggerOptions());
