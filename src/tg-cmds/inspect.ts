import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextIncludeCaptionCommandCallback } from '@/command-util';
import { tgUnhandleError } from '@/utils/tg-macro';


const log = new Logger({
  parentHierarchy: ['cmd', 'inspect'],
});

export function applyBotCommandInspect(ctx: KyushBot): void {
  log.info('Applying inspect command (cmd: inspect)');

  ctx.registerHelpMsg('inspect',
    `\`/inspect@${ctx.botId}\`\n\\- Display details of the current message`
  );
  applyTextIncludeCaptionCommandCallback(ctx, 'inspect', false, (msg, cmd, _argstr) => {
    try {
      let text = `*Inspect details*

Message ID: \`${msg.message_id}\`
Chat ID: \`${msg.chat.id}\``;
      if (msg.from) {
        text += `\nUser ID: \`${msg.from.id}\``;
        text += `\nUser First Name: \`${msg.from.first_name}\``;
        if (msg.from.last_name) {
          text += `\nUser Last Name: \`${msg.from.last_name}\``;
        }
        if (msg.from.username) {
          text += `\nUser Username: \`${msg.from.username}\``;
        }
      }
      if (msg.reply_to_message) {
        text += `\nReply to Message ID: \`${msg.reply_to_message.message_id}\``;
        if (msg.reply_to_message.from) {
          text += `\nReply to User ID: \`${msg.reply_to_message.from.id}\``;
          text += `\nReply to User First Name: \`${msg.reply_to_message.from.first_name}\``;
          if (msg.reply_to_message.from.last_name) {
            text += `\nReply to User Last Name: \`${msg.reply_to_message.from.last_name}\``;
          }
          if (msg.reply_to_message.from.username) {
            text += `\nReply to User Username: \`${msg.reply_to_message.from.username}\``;
          }
        }
      }
      ctx.bot.sendMessage(msg.chat.id, text, { parse_mode: 'MarkdownV2' });
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });
}