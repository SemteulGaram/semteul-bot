import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextIncludeCaptionCommandCallback } from '@/command-util';
import { fileToBase64, getLargePhotoSize, tgReplyText, tgSendHelp, tgUnhandleError } from '@/utils/tg-macro';

const log = new Logger({
  parentHierarchy: ['cmd', 'google-genai'],
});

/**
 * Apply Google Gemini AI image generation command to the bot
 * @param ctx KyushBot instance
 */
export function applyBotCommandGoogleGenAI(ctx: KyushBot): void {
  // Check if API key is available
  if (!process.env.GOOGLE_GENAI_APIKEY) {
    log.w('GOOGLE_GENAI_APIKEY is not set. Google GenAI commands disabled.');
    ctx.registerHelpMsg('INVALID_GENAI',
      `Google GenAI commands are disabled due to missing API key\\.`
    );
    return;
  }
  log.i('Applying Google GenAI commands');
  
  // Create temp directory for image downloads if it doesn't exist
  const generateDir = path.join('.', 'data', 'google-genai-generate');
  if (!fs.existsSync(generateDir)) {
    fs.mkdirSync(generateDir, { recursive: true });
  }

  // Initialize Google Gemini AI
  const googleGenai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_APIKEY });

  // Command to generate an image using Google Gemini AI
  ctx.registerHelpMsg('genai',
    `\`/genai@${ctx.botId} [PROMPT]\`
\\- _GOOGLE GENAI EXPERIMENTAL FEATURE: WILL BE REMOVED IN ANY TIME_
\\- Provide a image \\& text prompt or reply to a message with an image and add a text prompt
\\- Generate text and image using \`gemini-2.0-flash-exp-image-generation\` model`
  );
  applyTextIncludeCaptionCommandCallback(ctx, 'genai', false, async (msg, cmd, argstr): Promise<void> => {
    try {
      if (!argstr) tgSendHelp(ctx, msg, cmd);
      // Multiple upload detect
      if (
        (msg.photo && msg.media_group_id)
        || (msg.reply_to_message && msg.reply_to_message.photo && msg.reply_to_message.media_group_id)
      ) {
        return tgReplyText(ctx.bot, msg,
          'Only one image is allowed.'
        );
      }
      // Unsupported type detect
      if (msg.document) {
        return tgReplyText(ctx.bot, msg,
          'Only compressed image files are supported. Anyway, Google\'s GenAI compresses large images before processing them.'
        );
      }

      // Send a "processing" message
      const processingMsg = await ctx.bot.sendMessage(msg.chat.id, '(...)', {
        reply_to_message_id: msg.message_id,
      });

      const contents: any[] = [];
      // Add text prompt
      contents.push({ text: argstr });

      // Get Photo info
      const photoSize = getLargePhotoSize(msg.photo || msg.reply_to_message?.photo || []);
      let inputImageBase64: string | null = null;
      if (photoSize) {
        // Update processing message
        await ctx.bot.editMessageText('(Download image...)', {
          chat_id: processingMsg.chat.id,
          message_id: processingMsg.message_id,
        });
        try {
          inputImageBase64 = await fileToBase64(ctx.bot, photoSize.file_id, 1024 * 1024 * 10); // 1MB
        } catch (err) {
          log.eH([cmd], 'Failed to download image:', err);
          await ctx.bot.editMessageText('Failed to download image', {
            chat_id: processingMsg.chat.id,
            message_id: processingMsg.message_id,
          });
          return;
        }
        // Add image to contents
        contents.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: inputImageBase64,
          },
        });
      }

      // Generate content with Gemini
      try {
        await ctx.bot.editMessageText('(Generating...)', {
          chat_id: processingMsg.chat.id,
          message_id: processingMsg.message_id,
        });
        const response = await googleGenai.models.generateContent({
          model: "gemini-2.0-flash-exp-image-generation",
          contents: contents,
          config: {
            responseModalities: ["Text", "Image"],
          },
        });

        // Process the response
        let textResponse = '';
        let imageGenerated = false;
        
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              textResponse += part.text + '\n';
            } else if (part.inlineData && part.inlineData.data) {
              // Save the generated image
              const generatedImageData = part.inlineData.data;
              const buffer = Buffer.from(generatedImageData, 'base64');
              const tempImagePath = path.join(generateDir, `genai_${Date.now()}.png`);
              fs.writeFileSync(tempImagePath, buffer);
              
              // Send the image back to the user
              await ctx.bot.sendPhoto(msg.chat.id, buffer, {
                caption: textResponse || undefined,
                reply_to_message_id: msg.message_id,
              });
              
              // // Delete the temporary file
              // fs.unlinkSync(tempImagePath);
              imageGenerated = true;
            }
          }
          
          // If there was text but no image, send the text response
          if (textResponse && !imageGenerated) {
            await ctx.bot.sendMessage(msg.chat.id, textResponse, {
              reply_to_message_id: msg.message_id,
            });
          }
        } else {
          await ctx.bot.editMessageText('No content was generated. Please try again with a different prompt.', {
            chat_id: processingMsg.chat.id,
            message_id: processingMsg.message_id,
          });
          return;
        }
        
        // Delete the processing message
        await ctx.bot.deleteMessage(processingMsg.chat.id, processingMsg.message_id);
      } catch (apiError: any) {
        log.e('Gemini API error:', apiError);
        await ctx.bot.editMessageText(`Error generating content: ${apiError?.message || 'Unknown error'}`, {
          chat_id: processingMsg.chat.id,
          message_id: processingMsg.message_id,
        });
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, 'genai', unhandledErr, log);
    }
  });
}