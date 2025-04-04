import { KyushBot } from '@/kyushbot';
import TelegramBot from 'node-telegram-bot-api';
import { ReplyableError } from './replyable-error';
import { Logger } from '@/logger';

export function tgReplyText(bot: TelegramBot, msg: TelegramBot.Message, text: string, options?: TelegramBot.SendMessageOptions): void {
  bot.sendMessage(msg.chat.id, text, { reply_to_message_id: msg.message_id, ...options });
}

export function tgSendHelp(ctx: KyushBot, msg: TelegramBot.Message, command: string): void {
  const helpMsg = ctx.getHelpMsg(command);
  if (helpMsg) {
    tgReplyText(ctx.bot, msg, `Usage: ${helpMsg}`, { parse_mode: 'MarkdownV2' });
  } else {
    tgReplyText(ctx.bot, msg, 'No help message available for this command.');
  }
}

export function tgUnhandleError(ctx: KyushBot, msg: TelegramBot.Message, command: string, err: unknown, log: Logger): void {
  if (err instanceof ReplyableError) {
    tgReplyText(ctx.bot, msg, err.message);
  } else {
    log.eH([command], err);
    tgReplyText(ctx.bot, msg,
      'An error occurred while processing your request.',
    );
  }
}

export function getFullname(userOrChat?: TelegramBot.User | TelegramBot.Chat): string | undefined {
  if (!userOrChat) return undefined;
  if (userOrChat.last_name)
    return userOrChat.first_name + ' ' + userOrChat.last_name;
  return userOrChat.first_name;
}

export function getUserIdentifyName(userOrChat: TelegramBot.User): string {
  if (userOrChat.username) return `@${userOrChat.username}`;
  if (userOrChat.last_name) return userOrChat.first_name + ' ' + userOrChat.last_name;
  return userOrChat.first_name;
}

export function getLargePhotoSize(msgPhoto: TelegramBot.PhotoSize[]): TelegramBot.PhotoSize | undefined {
  if (!msgPhoto || msgPhoto.length === 0) return undefined;
  let cMax = msgPhoto[0];
  for (const photo of msgPhoto) {
    if (photo.width > cMax.width) {
      cMax = photo;
    }
  }
  return cMax;
}

export function fileToBase64(bot: TelegramBot, fileId: string, maxChunkSize?: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalSize = 0;
    const stream = bot.getFileStream(fileId);
    stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
      totalSize += chunk.length;
      
      if (maxChunkSize && totalSize > maxChunkSize) {
        stream.destroy();
        reject(new ReplyableError(`File size exceeds maximum allowed size of ${maxChunkSize} bytes`));
      }
    });
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const base64String = buffer.toString('base64');
      resolve(base64String);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
}