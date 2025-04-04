import chalk from 'chalk';

// export class LogLevel {
//   static OFF = 0;
//   static ERROR = 1;
//   static WARN = 2;
//   static INFO = 3;
//   static LOG = 4;
//   static DEBUG = 5;
//   static TRACE = 6;
//   static ALL = 7;
// }

export enum LogLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  LOG = 4,
  DEBUG = 5,
  TRACE = 6,
  ALL = 7,
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

export const HierarchyColorFunction = [
  chalk.cyan,
  chalk.cyanBright,
  chalk.green,
  chalk.greenBright,
  chalk.yellow,
  chalk.yellowBright,
  chalk.magenta,
  chalk.magentaBright,
  chalk.blue,
  chalk.blueBright,
];

export type ILog = {
  level: LogLevel;
  timestamp: Date;
  hierarchy: string[];
  content: string;
};

export class LoggerOptions {
  logLevel?: LogLevel;
  parentHierarchy!: string[];
}

export class Logger {
  static loggers: Logger[] = [];
  static globalLogLevel = LogLevel.LOG;

  static DEFAULT_OPTIONS: LoggerOptions = {
    logLevel: undefined,
    parentHierarchy: [],
  };

  constructor(
    private _opt: Partial<LoggerOptions> = { ...Logger.DEFAULT_OPTIONS },
  ) {
    if (this._opt.logLevel === undefined) {
      this._opt.logLevel = Logger.DEFAULT_OPTIONS.logLevel;
    }
    if (this._opt.parentHierarchy === undefined) {
      this._opt.parentHierarchy = Logger.DEFAULT_OPTIONS.parentHierarchy.slice();
    }
    Logger.loggers.push(this);
  }

  public static _generateHierarchyStringWithColorFunction(
    hierarchy: string[],
  ): string {
    return hierarchy
      .map((h, i) => {
        return (HierarchyColorFunction[i] || ((v: string) => v))(h + '>');
      })
      .join('');
  }

  public clone(): Logger {
    return new Logger({ ...this._opt });
  }

  public subLogger(moreHierarchy: string[]|string): Logger {
    if (typeof moreHierarchy === 'string') {
      moreHierarchy = [moreHierarchy];
    }
    const newLogger = this.clone();
    newLogger._opt.parentHierarchy!.push(...moreHierarchy);
    return newLogger;
  }

  public base(
    logLevel: number = LogLevel.LOG,
    hierarchy: string[],
    args: any[],
  ): void {
    let cLogLevel = this._opt.logLevel;
    cLogLevel === undefined && (cLogLevel = Logger.globalLogLevel);
    if (cLogLevel >= logLevel) {
      // eslint-disable-next-line no-console
      console[logLevel > LogLevel.WARN ? 'log' : 'error'].apply(console, [
        VisualLogColorFunction[logLevel](`${VisualLogLevel[logLevel]}>`) +
          Logger._generateHierarchyStringWithColorFunction([
            ...(this._opt.parentHierarchy || []),
            ...hierarchy,
          ]),
        ...args,
      ]);
    }
  }

  public trace(...args: any[]): void {
    this.base(LogLevel.TRACE, [], args);
  }

  public debug(...args: any[]): void {
    this.base(LogLevel.DEBUG, [], args);
  }

  public log(...args: any[]): void {
    this.base(LogLevel.LOG, [], args);
  }

  public info(...args: any[]): void {
    this.base(LogLevel.INFO, [], args);
  }

  public warn(...args: any[]): void {
    this.base(LogLevel.WARN, [], args);
  }

  public error(...args: any[]): void {
    this.base(LogLevel.ERROR, [], args);
  }

  public t(...args: any[]): void {
    this.trace(...args);
  }

  public d(...args: any[]): void {
    this.debug(...args);
  }

  public l(...args: any[]): void {
    this.log(...args);
  }

  public i(...args: any[]): void {
    this.info(...args);
  }

  public w(...args: any[]): void {
    this.warn(...args);
  }

  public e(...args: any[]): void {
    this.error(...args);
  }

  public traceHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.TRACE, hierarchy, args);
  }

  public debugHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.DEBUG, hierarchy, args);
  }

  public logHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.LOG, hierarchy, args);
  }

  public infoHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.INFO, hierarchy, args);
  }

  public warnHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.WARN, hierarchy, args);
  }

  public errorHierarchy(hierarchy: string[], ...args: any[]): void {
    this.base(LogLevel.ERROR, hierarchy, args);
  }

  public tH(hierarchy: string[], ...args: any[]): void {
    this.traceHierarchy(hierarchy, ...args);
  }

  public dH(hierarchy: string[], ...args: any[]): void {
    this.debugHierarchy(hierarchy, ...args);
  }

  public lH(hierarchy: string[], ...args: any[]): void {
    this.logHierarchy(hierarchy, ...args);
  }

  public iH(hierarchy: string[], ...args: any[]): void {
    this.infoHierarchy(hierarchy, ...args);
  }

  public wH(hierarchy: string[], ...args: any[]): void {
    this.warnHierarchy(hierarchy, ...args);
  }

  public eH(hierarchy: string[], ...args: any[]): void {
    this.errorHierarchy(hierarchy, ...args);
  }

  public setLogLevel(logLevel: LogLevel): void {
    this._opt.logLevel = logLevel;
  }

  public useGlobalLogLevel(): void {
    this._opt.logLevel = undefined;
  }
}

export const defaultLogger = new Logger();
