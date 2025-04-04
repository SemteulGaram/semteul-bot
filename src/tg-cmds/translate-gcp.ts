import { v2 } from '@google-cloud/translate';
import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import { tgReplyText, tgSendHelp, tgUnhandleError } from '@/utils/tg-macro';

const log = new Logger({
  parentHierarchy: ['cmd', 'translate-gcp'],
});

function applyGCPTranslateCommand(
  ctx: KyushBot,
  cmd: string,
  to: string,
  transFunction: (text: string, opt: v2.TranslateRequest) => Promise<string>,
): void {
  log.info(`Applying GCP Translate command (cmd: ${cmd}, destLang: ${to})`);

  // Direct translate command with text
  applyTextCommandCallback(ctx, cmd, false, async (msg, cmd, argstr): Promise<void> => {
    try {
      let replyId: number | undefined;
      let targetText: string | undefined;
      
      if (!argstr) {
        // If no argument is provided, check if it's a reply
        if (msg.reply_to_message) {
          replyId = msg.reply_to_message.message_id;
          targetText = msg.reply_to_message.text;
          if (!targetText) return tgReplyText(ctx.bot, msg, 'Only text messages can be translated');
        } else {
          // No argument and no reply, show usage
          return tgSendHelp(ctx, msg, cmd);
        }
      } else {
        replyId = msg.message_id;
        targetText = String(argstr);
      }
      if (!targetText) return tgSendHelp(ctx, msg, cmd);
      const text = await transFunction(targetText, { to });
      log.iH([cmd], `Translated: ${targetText} -> ${text}`);
      ctx.bot.sendMessage(msg.chat.id, text, { reply_to_message_id: replyId });
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });
}

export async function applyBotCommandTranslateGCP(ctx: KyushBot): Promise<void> {
  // Check GCP service is valid 
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    log.warn('GOOGLE_APPLICATION_CREDENTIALS is not set. TranslateGCP disabled.');
    ctx.registerHelpMsg('INVALID_TRANSLATE_GCP',
      `GCP Translate commands are disabled due to missing API key\\.`
    )
    return;
  }

  const translate = new v2.Translate();
  async function translateText(
    text: string,
    opt: v2.TranslateRequest,
  ): Promise<string> {
    const [translations] = await translate.translate(text, opt);
    return translations;
  }
  // GCP Translate commands
  ctx.registerHelpMsg('gcpen',
    `\`/gcpen@${ctx.botId} [text]\`\n\\- Translate to English using GCP Translate`
  );
  applyGCPTranslateCommand(ctx, 'gcpen', 'en', translateText);
  ctx.registerHelpMsg('gcpko',
    `\`/gcpko@${ctx.botId} [text]\`\n\\- Translate to Korean using GCP Translate`
  );
  applyGCPTranslateCommand(ctx, 'gcpko', 'ko', translateText);
  ctx.registerHelpMsg('gcpes',
    `\`/gcpes@${ctx.botId} [text]\`\n\\- Translate to Spanish using GCP Translate`
  );
  applyGCPTranslateCommand(ctx, 'gcpes', 'es', translateText);
  ctx.registerHelpMsg('gcpja',
    `\`/gcpja@${ctx.botId} [text]\`\n\\- Translate to Japanese using GCP Translate`
  );
  applyGCPTranslateCommand(ctx, 'gcpja', 'ja', translateText);
}
