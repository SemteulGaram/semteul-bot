
import { translate as freeGoogleTranslateApi } from '@vitalets/google-translate-api';
import chalk from 'chalk';
import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import {
  KyuSqlite3Database,
} from '@/database/base';
import { LiveTranslateEntity, LiveTranslateTable } from '@/database/livetranslate';
import TelegramBot from 'node-telegram-bot-api';

const log = new Logger({
  parentHierarchy: ['cmd', 'translate'],
});

function applyLiveTranslateCommand(
  ctx: KyushBot,
  db: KyuSqlite3Database,
  lttable: LiveTranslateTable,
  cmd: string,
  availableLang: string[],
): void {
  applyTextCommandCallback(ctx, cmd, false, async (msg, argstr) => {
    // Check if message is not reply from another, print help
    if (!msg.reply_to_message) {
      log.info(
        chalk.greenBright(`CMD(${cmd} help)>`),
        chalk.gray('send help message'),
      );
      ctx.bot.sendMessage(
        msg.chat.id,
        `Usage: Use it by replying to a message from someone who wants real-time translation.
Format: /${cmd} [${availableLang.join(
          ', ',
        )}](default en) [freegoogle, googlecloud](default freegoogle)`,
        {
          reply_to_message_id: msg.message_id,
        },
      );
      return;
    }
    
    const roomid = '' + msg.chat.id;
    const userid = '' + msg.reply_to_message.from?.id;

    // Parse options from argument string
    let opt1 = '';
    let opt2 = '';
    
    if (argstr) {
      const args = argstr.toLowerCase().split(/\s+/);
      if (args.length >= 1) opt1 = args[0];
      if (args.length >= 2) opt2 = args[1];
    }

    // Check lang option
    let lang = 'en';
    if (availableLang.includes(opt1) && availableLang.includes(opt2)) {
      log.info(
        chalk.greenBright(`CMD(${cmd})>`),
        chalk.gray('double lang set warning'),
      );
      ctx.bot.sendMessage(
        msg.chat.id,
        'Warning: Only one target language can be set',
        {
          reply_to_message_id: msg.message_id,
        },
      );
      return;
    } else if (availableLang.includes(opt1)) {
      lang = opt1;
    } else if (availableLang.includes(opt2)) {
      lang = opt2;
    }

    // Check Translator option
    let trEngine = 'freegoogle';
    const availableEngine = ['freegoogle', 'googlecloud'];
    if (availableEngine.includes(opt1) && availableEngine.includes(opt2)) {
      log.info(
        chalk.greenBright(`CMD(${cmd})>`),
        chalk.gray('double engine set warning'),
      );
      ctx.bot.sendMessage(
        msg.chat.id,
        'Warning: Only one target engine can be set',
        {
          reply_to_message_id: msg.message_id,
        },
      );
      return;
    } else if (availableEngine.includes(opt1)) {
      trEngine = opt1;
    } else if (availableEngine.includes(opt2)) {
      trEngine = opt2;
    }

    // Check entity exists
    const existsEnt = lttable.query(roomid, userid);
    if (existsEnt) {
      // remove it
      const success = lttable.remove(roomid, userid);
      if (success) {
        log.info(
          chalk.greenBright(`CMD(${cmd})>`),
          `Remove (${roomid}, ${userid})`,
        );
        ctx.bot.sendMessage(
          msg.chat.id,
          `Turn off live translate user @${msg.from?.first_name}`,
          {
            reply_to_message_id: msg.message_id,
          },
        );
      } else {
        log.error(
          chalk.greenBright(`CMD(${cmd})>`),
          `Remove failed (${roomid}, ${userid})`,
        );
        ctx.bot.sendMessage(msg.chat.id, 'Turn off live translate failed.', {
          reply_to_message_id: msg.message_id,
        });
      }
    } else {
      const ent = new LiveTranslateEntity();
      ent.roomid = roomid;
      ent.userid = userid;
      ent.engine = trEngine;
      ent.targetlang = lang;
      try {
        lttable.create(ent);
      } catch (err) {
        log.error(err);
      }
      log.info(
        chalk.greenBright(`CMD(${cmd})>`),
        `Create (${roomid}, ${userid}, ${trEngine}, ${lang})`,
      );
      ctx.bot.sendMessage(
        msg.chat.id,
        `Turn on live translate user @${msg.from?.first_name} (to ${lang})`,
        {
          reply_to_message_id: msg.message_id,
        },
      );
    }
  });

  // Handle text messages for live translation
  ctx.bot.on(
    'text',
    async (
      msg: TelegramBot.Message,
      meta: TelegramBot.Metadata,
    ): Promise<void> => {
      if (!msg.text || msg.text.startsWith('/')) return;
      const roomid = '' + msg.chat.id;
      const userid = '' + msg.from?.id;
      const ent = lttable.query(roomid, userid);
      if (!ent) return;
      const targetText = '' + msg.text;

      const translatedResult = await freeGoogleTranslateApi(targetText, {
        to: ent.targetlang,
      });

      ctx.bot.sendMessage(
        msg.chat.id,
        translatedResult.text,
      );
    },
  );
}

export function applyBotTranslateCommands(ctx: KyushBot): void {
  

  // Live translate command
  const sbdb = KyuSqlite3Database.open('live_translate.db');
  const lttable = LiveTranslateTable.open(sbdb);
  applyLiveTranslateCommand(ctx, sbdb, lttable, 'livetr', [
    'en',
    'ko',
    'es',
    'ja',
  ]);
}
