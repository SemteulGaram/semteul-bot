import chalk from 'chalk';
import TelegramBot from 'node-telegram-bot-api';

import { botFileFetch } from '../bot-file-fetch';
import { Logger } from '../logger';

const log = new Logger({
  parentHierarchy: ['bot', 'dl-sticker'],
});

// FIXME: 텔레그램 파일 첨부가 아닌 이미지로 전송됨
export function applyBotDlSticker(bot: TelegramBot) {
  bot.onText(/^\/dlsticker/i, async (msg: TelegramBot.Message) => {
    try {
      // Download sticker when message is reply to a sticker, otherwise print help
      if (!msg.reply_to_message) {
        log.info(
          chalk.greenBright('CMD(dlsticker)>'),
          chalk.gray('Not a reply_to_message'),
        );
        await bot.sendMessage(
          msg.chat.id,
          'Reply to a sticker to download it',
          {
            reply_to_message_id: msg.message_id,
          },
        );
        return;
      }
      if (!msg.reply_to_message.sticker) {
        log.info(
          chalk.greenBright('CMD(dlsticker)>'),
          chalk.gray('Not a sticker'),
        );
        await bot.sendMessage(msg.chat.id, 'Only stickers can be downloaded', {
          reply_to_message_id: msg.message_id,
        });
        return;
      }
      log.info(
        chalk.greenBright('CMD(dlsticker)>'),
        chalk.gray(
          `Animated: ${msg.reply_to_message.sticker.is_animated}, <${msg.reply_to_message.sticker.file_id}>`,
        ),
      );
      const file = await bot.getFile(msg.reply_to_message.sticker.file_id);
      if (!file.file_path) {
        log.info(
          chalk.greenBright('CMD(dlsticker)>'),
          chalk.gray('No file_path'),
        );
        await bot.sendMessage(
          msg.chat.id,
          "Can't download this sticker. (No file_path) Might be too big size",
          {
            reply_to_message_id: msg.reply_to_message.message_id,
          },
        );
        return;
      }
      log.trace(
        chalk.greenBright('CMD(dlsticker)>'),
        chalk.gray(`File path: ${file.file_path}`),
      );
      const res = await botFileFetch(file.file_path);
      await bot.sendDocument(
        msg.chat.id,
        res,
        {
          reply_to_message_id: msg.message_id,
        },
        {
          filename: 'test',
          contentType: 'image/webp',
        },
      );
    } catch (err) {
      log.error(err);
    }
  });
  log.info('Loaded');
}
