import googleTranslateApi from '@vitalets/google-translate-api';
import { v2 } from '@google-cloud/translate';
import chalk from 'chalk';
import TelegramBot from 'node-telegram-bot-api';

import { Logger } from '../logger';

const translate = new v2.Translate();
const log = new Logger('bot>translate');

async function translateText(
  text: string,
  opt: v2.TranslateRequest,
): Promise<string> {
  const [translations] = await translate.translate(text, opt);
  return translations;
}

function generateBotGCPTranslateFunction(
  bot: TelegramBot,
  cmd: string,
  to: string,
): void {
  log.info(
    `Auto Generate GCP Translate function (cmd: ${cmd}@${process.env.BOT_ID}, destLang: ${to})`,
  );

  // Direct translate command
  bot.onText(
    new RegExp(`^/${cmd}(?:@${process.env.BOT_ID})? ([\w\W]+)$`, 'i'),
    async (msg, match) => {
      try {
        const targetText = match[1];

        if (!targetText) {
          return bot.sendMessage(
            msg.chat.id,
            'Only text message can translate',
            {
              reply_to_message_id: msg.message_id,
            },
          );
        }
        const text = await translateText(targetText, { to });
        log.info(
          chalk.greenBright(`CMD(${cmd} direct)>`),
          chalk.gray(`${targetText}`) + ` -> ${text}`,
        );
        bot.sendMessage(msg.chat.id, text);
      } catch (err) {
        log.error(err);
      }
    },
  );

  // Help & reply translate command
  bot.onText(
    new RegExp(`^/${cmd}(?:@${process.env.BOT_ID})?$`, 'i'),
    async (msg) => {
      try {
        // Translate when message is reply from another, otherwise print help
        if (msg.reply_to_message) {
          const targetText = msg.reply_to_message.text;
          if (!targetText) {
            return bot.sendMessage(
              msg.chat.id,
              'Only text message can translate',
              {
                reply_to_message_id: msg.message_id,
              },
            );
          } else {
            const text = await translateText(targetText, { to: 'ko' });
            log.info(
              chalk.greenBright(`CMD(${cmd} reply)>`),
              chalk.gray(`${targetText}`) + ` -> ${text}`,
            );
            bot.sendMessage(msg.chat.id, text, {
              reply_to_message_id: msg.reply_to_message.message_id,
            });
          }
        } else {
          log.info(
            chalk.greenBright(`CMD(${cmd} reply)>`),
            chalk.gray('send usage message'),
          );
          bot.sendMessage(
            msg.chat.id,
            `Usage: Reply to another message, or use "/${cmd} [text]" format`,
            {
              reply_to_message_id: msg.message_id,
            },
          );
        }
      } catch (err) {
        log.error(err);
      }
    },
  );
}

function generateBotGoogleFreeTranslateFunction(
  bot: TelegramBot,
  cmd: string,
  to: string,
): void {
  log.info(
    `Auto Generate Google Free Translate function (cmd: ${cmd}@${process.env.BOT_ID}, destLang: ${to})`,
  );

  // Direct translate command
  bot.onText(
    new RegExp(`^/${cmd}(?:@${process.env.BOT_ID})? ([\w\W]+)$`, 'i'),
    async (msg, match) => {
      try {
        const targetText = match[1];

        if (!targetText) {
          return bot.sendMessage(
            msg.chat.id,
            'Only text message can translate',
            {
              reply_to_message_id: msg.message_id,
            },
          );
        }
        const text = (await googleTranslateApi(targetText, { to })).text;
        log.info(
          chalk.greenBright(`CMD(${cmd} direct)>`),
          chalk.gray(`${targetText}`) + ` -> ${text}`,
        );
        bot.sendMessage(msg.chat.id, text);
      } catch (err) {
        log.error(err);
      }
    },
  );

  // Help & reply translate command
  bot.onText(
    new RegExp(`^/${cmd}(?:@${process.env.BOT_ID})?$`, 'i'),
    async (msg) => {
      try {
        // Translate when message is reply from another, otherwise print help
        if (msg.reply_to_message) {
          const targetText = msg.reply_to_message.text;
          if (!targetText) {
            return bot.sendMessage(
              msg.chat.id,
              'Only text message can translate',
              {
                reply_to_message_id: msg.message_id,
              },
            );
          } else {
            const text = (await googleTranslateApi(targetText, { to: 'ko' }))
              .text;
            log.info(
              chalk.greenBright(`CMD(${cmd} reply)>`),
              chalk.gray(`${targetText}`) + ` -> ${text}`,
            );
            bot.sendMessage(msg.chat.id, text, {
              reply_to_message_id: msg.reply_to_message.message_id,
            });
          }
        } else {
          log.info(
            chalk.greenBright(`CMD(${cmd} reply)>`),
            chalk.gray('send usage message'),
          );
          bot.sendMessage(
            msg.chat.id,
            `Usage: Reply to another message, or use "/${cmd} [text]" format`,
            {
              reply_to_message_id: msg.message_id,
            },
          );
        }
      } catch (err) {
        log.error(err);
      }
    },
  );
}

export function applyBotTranslate(bot: TelegramBot) {
  generateBotGCPTranslateFunction(bot, 'toen', 'en');
  generateBotGCPTranslateFunction(bot, 'toes', 'es');
  generateBotGCPTranslateFunction(bot, 'toko', 'ko');
  generateBotGoogleFreeTranslateFunction(bot, 'ftoen', 'en');
  generateBotGoogleFreeTranslateFunction(bot, 'ftoes', 'es');
  generateBotGoogleFreeTranslateFunction(bot, 'ftoko', 'ko');
}
