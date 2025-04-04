import 'dotenv-defaults/config';
import TelegramBot from 'node-telegram-bot-api';
import chalk from 'chalk';
import { defaultLogger as log } from '@/logger';
import { 
  applyBotCommandInspect,
  applyBotCommandACL,
  applyBotCommandEnko,
  applyBotTranslateCommands,
  applyBotCommandTranslateGoogleFree,
  applyBotCommandTranslateGCP,
  applyBotCommandGoogleGenAI,
  applyBotCommandRateLimit,
  applyBotCommandHelp,
} from '@/tg-cmds';
import { ACLService } from '@/acl-service';
import { KyuSqlite3Database } from '@/database/base';
import { getFullname } from '@/utils/tg-macro';
import { TGUserService } from './tg-user-service';
import { RateLimitService } from './rate-limit-service';

// https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = 'true';

// Singleton
export class KyushBot {
  static instance: KyushBot;

  configDb: KyuSqlite3Database;
  cacheDb: KyuSqlite3Database;

  aclService: ACLService;
  tgUserService: TGUserService;
  rateLimitService: RateLimitService;

  botId: string;
  bot: TelegramBot;  
  helpMsgs: Record<string, string> = {};
  defaultAllowCmds: string[] = [
    'start',
    'help',
    'inspect',
  ];


  constructor() {
    const that = this;
    // Initialize the database and services
    this.configDb = KyuSqlite3Database.open('./data/config.db');
    this.cacheDb = KyuSqlite3Database.open('./data/cache.db');
    this.aclService = new ACLService(this, this.configDb);
    this.tgUserService = new TGUserService(this.cacheDb);
    this.rateLimitService = new RateLimitService(this, this.configDb, this.cacheDb);
    
    // Initialize the bot
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      log.error('TELEGRAM_BOT_TOKEN is not set');
      process.exit(1);
    }
    this.botId = process.env.TELEGRAM_BOT_ID || 'UNKNOWN_BOT';
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
      request: {
        url: 'https://api.telegram.org',
        agentOptions: {
          keepAlive: true,
          family: 4
        }
      }
    });

    // Log all messages
    this.bot.on('message', function (msg: TelegramBot.Message) {
      // Check User (sender)
      if (msg.from) that.tgUserService.checkUser(msg.from);
      // Check User (forward sender)
      if (msg.forward_from) that.tgUserService.checkUser(msg.forward_from);
      // Check User (reply sender)
      if (msg.reply_to_message && msg.reply_to_message.from) that.tgUserService.checkUser(msg.reply_to_message.from);
      log.trace(msg);
    });

    // Log text messages
    this.bot.on('text', function (msg: TelegramBot.Message) {
      log.info(
        chalk.greenBright('CHAT>') +
          chalk.yellow(`${msg.chat.title || getFullname(msg.chat)}>`) +
          chalk.yellowBright(`${getFullname(msg.from)}>`),
        msg.text,
      );
    });

    // Apply command modules
    applyBotCommandHelp(this);
    applyBotCommandInspect(this);
    applyBotCommandACL(this);
    applyBotCommandRateLimit(this);
    applyBotCommandEnko(this);
    applyBotCommandTranslateGoogleFree(this);
    applyBotCommandTranslateGCP(this);
    applyBotCommandGoogleGenAI(this);
    
    // TODO: Refactor
    applyBotTranslateCommands(this);

    log.info('Telegram bot started');
  }

  registerHelpMsg(command: string, msg: string): void {
    this.helpMsgs[command] = msg;
  }

  getHelpMsg(command: string): string | undefined {
    return this.helpMsgs[command];
  }

  getHelpFull(): string {
    return Object.entries(this.helpMsgs).map(([_command, msg]) => `${msg}`).join('\n');
  }

  getAllowedHelp(msg: TelegramBot.Message): string {
    return Object.entries(this.helpMsgs).map(([command, helpMsg]) => {
      if (this.aclService && msg.from) {
        const permissionResult = this.aclService.canExecute(command, String(msg.from.id), String(msg.chat.id));
        if (permissionResult.granted) {
          return helpMsg;
        }
      }
      return null;
    }).filter(Boolean).join('\n');
  }

  static getInstance(): KyushBot {
    if (!KyushBot.instance) {
      KyushBot.instance = new KyushBot();
    }
    return KyushBot.instance;
  }
}
