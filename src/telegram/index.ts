import TelegramBot from 'node-telegram-bot-api';

import { Logger } from '../logger';
import enkoConverter from '../../external/enkoConverter.js';
import chalk from 'chalk';
import { applyBotTranslate } from './translate';
import { applyBotDlSticker } from './dl-sticker';

const log = new Logger({
  parentHierarchy: ['bot'],
});
export const bot = new TelegramBot(process.env.TOKEN, {
  polling: true,
});

bot.on('message', function (msg: TelegramBot.Message) {
  log.trace(msg);
});

bot.on('text', function (msg: TelegramBot.Message) {
  log.info(
    chalk.greenBright('CHAT>') +
      chalk.yellow(`${msg.chat.title || getFullname(msg.chat)}>`) +
      chalk.yellowBright(`${getFullname(msg.from)}>`),
    msg.text,
  );
});

bot.onText(
  /^\/enko .*/i,
  function (msg: TelegramBot.Message, match: RegExpExecArray) {
    const cmd = msg.text.substring(6, msg.text.length);
    log.info(chalk.cyan('[CMD]') + 'render: ' + cmd);
    bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
      reply_to_message_id: msg.message_id,
    });
  },
);

bot.onText(
  /^\/영한 .*/i,
  function (msg: TelegramBot.Message, match: RegExpExecArray) {
    const cmd = msg.text.substring(4, msg.text.length);
    log.info(chalk.cyan('[CMD]') + 'render: ' + cmd);
    bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
      reply_to_message_id: msg.message_id,
    });
  },
);

bot.onText(
  /^\/koen .*/i,
  function (msg: TelegramBot.Message, match: RegExpExecArray) {
    const cmd = msg.text.substring(6, msg.text.length);
    log.info(chalk.cyan('[CMD]') + 'render: ' + cmd);
    bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
      reply_to_message_id: msg.message_id,
    });
  },
);

bot.onText(
  /^\/한영 .*/i,
  function (msg: TelegramBot.Message, match: RegExpExecArray) {
    const cmd = msg.text.substring(4, msg.text.length);
    log.info(chalk.cyan('[CMD]') + '한영: ' + cmd);
    bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
      reply_to_message_id: msg.message_id,
    });
  },
);

function getFullname(userOrChat: TelegramBot.User | TelegramBot.Chat) {
  if (!userOrChat) return 'UNKNOWN';
  if (userOrChat.last_name)
    return userOrChat.first_name + ' ' + userOrChat.last_name;
  return userOrChat.first_name;
}

applyBotTranslate(bot);
applyBotDlSticker(bot);
