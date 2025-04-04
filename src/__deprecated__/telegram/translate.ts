// import { translate as freeGoogleTranslateApi } from '@vitalets/google-translate-api';
// import { v2 } from '@google-cloud/translate';
// import chalk from 'chalk';
// import TelegramBot from 'node-telegram-bot-api';

// import { Logger } from '../logger';
// import {
//   KyuSqlite3Database,
//   LiveTranslateTable,
//   LiveTranslateEntity,
// } from '../database';

// const translate = new v2.Translate();
// const log = new Logger({
//   parentHierarchy: ['bot', 'translate'],
// });

// async function translateText(
//   text: string,
//   opt: v2.TranslateRequest,
// ): Promise<string> {
//   const [translations] = await translate.translate(text, opt);
//   return translations;
// }

// function generateBotGCPTranslateFunction(
//   bot: TelegramBot,
//   cmd: string,
//   to: string,
// ): void {
//   log.info(
//     `Auto Generate GCP Translate function (cmd: ${cmd}@${process.env.TELEGRAM_BOT_ID}, destLang: ${to})`,
//   );

//   // Direct translate command
//   bot.onText(
//     new RegExp(`^/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})? (.+)$`, 'is'),
//     async (msg, match) => {
//       try {
//         const targetText = match[1];

//         if (!targetText) {
//           return bot.sendMessage(
//             msg.chat.id,
//             'Only text message can translate',
//             {
//               reply_to_message_id: msg.message_id,
//             },
//           );
//         }
//         const text = await translateText(targetText, { to });
//         log.info(
//           chalk.greenBright(`CMD(${cmd} direct)>`),
//           chalk.gray(`${targetText}`) + ` -> ${text}`,
//         );
//         bot.sendMessage(msg.chat.id, text);
//       } catch (err) {
//         log.error(err);
//       }
//     },
//   );

//   // Help & reply translate command
//   bot.onText(
//     new RegExp(`^/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})?$`, 'i'),
//     async (msg) => {
//       try {
//         // Translate when message is reply from another, otherwise print help
//         if (msg.reply_to_message) {
//           const targetText = msg.reply_to_message.text;
//           if (!targetText) {
//             return bot.sendMessage(
//               msg.chat.id,
//               'Only text message can translate',
//               {
//                 reply_to_message_id: msg.message_id,
//               },
//             );
//           } else {
//             const text = await translateText(targetText, { to: 'ko' });
//             log.info(
//               chalk.greenBright(`CMD(${cmd} reply)>`),
//               chalk.gray(`${targetText}`) + ` -> ${text}`,
//             );
//             bot.sendMessage(msg.chat.id, text, {
//               reply_to_message_id: msg.reply_to_message.message_id,
//             });
//           }
//         } else {
//           log.info(
//             chalk.greenBright(`CMD(${cmd} reply)>`),
//             chalk.gray('send usage message'),
//           );
//           bot.sendMessage(
//             msg.chat.id,
//             `Usage: Reply to another message, or use "/${cmd} [text]" format`,
//             {
//               reply_to_message_id: msg.message_id,
//             },
//           );
//         }
//       } catch (err) {
//         log.error(err);
//       }
//     },
//   );
// }

// function generateBotGoogleFreeTranslateFunction(
//   bot: TelegramBot,
//   cmd: string,
//   to: string,
// ): void {
//   log.info(
//     `Auto Generate Google Free Translate function (cmd: ${cmd}@${process.env.TELEGRAM_BOT_ID}, destLang: ${to})`,
//   );

//   // Direct translate command
//   bot.onText(
//     new RegExp(`^/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})? (.+)$`, 'is'),
//     async (msg, match) => {
//       try {
//         const targetText = match[1];

//         if (!targetText) {
//           return bot.sendMessage(
//             msg.chat.id,
//             'Only text message can translate',
//             {
//               reply_to_message_id: msg.message_id,
//             },
//           );
//         }
//         const text = (await freeGoogleTranslateApi(targetText, { to })).text;
//         log.info(
//           chalk.greenBright(`CMD(${cmd} direct)>`),
//           chalk.gray(`${targetText}`) + ` -> ${text}`,
//         );
//         bot.sendMessage(msg.chat.id, text);
//       } catch (err) {
//         log.error(err);
//       }
//     },
//   );

//   // Help & reply translate command
//   bot.onText(
//     new RegExp(`^/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})?$`, 'i'),
//     async (msg) => {
//       try {
//         // Translate when message is reply from another, otherwise print help
//         if (msg.reply_to_message) {
//           const targetText = msg.reply_to_message.text;
//           if (!targetText) {
//             return bot.sendMessage(
//               msg.chat.id,
//               'Only text message can translate',
//               {
//                 reply_to_message_id: msg.message_id,
//               },
//             );
//           } else {
//             const text = (
//               await freeGoogleTranslateApi(targetText, { to: 'ko' })
//             ).text;
//             log.info(
//               chalk.greenBright(`CMD(${cmd} reply)>`),
//               chalk.gray(`${targetText}`) + ` -> ${text}`,
//             );
//             bot.sendMessage(msg.chat.id, text, {
//               reply_to_message_id: msg.reply_to_message.message_id,
//             });
//           }
//         } else {
//           log.info(
//             chalk.greenBright(`CMD(${cmd} reply)>`),
//             chalk.gray('send usage message'),
//           );
//           bot.sendMessage(
//             msg.chat.id,
//             `Usage: Reply to another message, or use "/${cmd} [text]" format`,
//             {
//               reply_to_message_id: msg.message_id,
//             },
//           );
//         }
//       } catch (err) {
//         log.error(err);
//       }
//     },
//   );
// }

// async function generateBotLiveTranslateFunction(
//   bot: TelegramBot,
//   db: KyuSqlite3Database,
//   lttable: LiveTranslateTable,
//   cmd: string,
//   availableLang: string[],
// ): Promise<void> {
//   bot.onText(
//     new RegExp(
//       `^/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})?(?:\x20(.+)(\x20(.+))?)?$`,
//       'i',
//     ),
//     async (msg: TelegramBot.Message, match: RegExpExecArray): Promise<void> => {
//       // Check if message is not reply from another, print help
//       if (!msg.reply_to_message) {
//         log.info(
//           chalk.greenBright(`CMD(${cmd} help)>`),
//           chalk.gray('send help message'),
//         );
//         bot.sendMessage(
//           msg.chat.id,
//           `Usage: Use it by replying to a message from someone who wants real-time translation.
// Format: /${cmd} [${availableLang.join(
//             ', ',
//           )}](default en) [freegoogle, googlecloud](default freegoogle)`,
//           {
//             reply_to_message_id: msg.message_id,
//           },
//         );
//         return;
//       }
//       const roomid = '' + msg.chat.id;
//       const userid = '' + msg.reply_to_message.from.id;

//       let opt1 = match.length >= 1 ? match[1] : '';
//       opt1 = (opt1 || '').toLowerCase();
//       let opt2 = match.length >= 2 ? match[2] : '';
//       opt2 = (opt2 || '').toLowerCase();

//       // Check lang option
//       let lang = 'en';
//       if (availableLang.includes(opt1) && availableLang.includes(opt2)) {
//         log.info(
//           chalk.greenBright(`CMD(${cmd})>`),
//           chalk.gray('double lang set warning'),
//         );
//         bot.sendMessage(
//           msg.chat.id,
//           'Warning: Only one target language can be set',
//           {
//             reply_to_message_id: msg.message_id,
//           },
//         );
//         return;
//       } else if (availableLang.includes(opt1)) {
//         lang = opt1;
//       } else if (availableLang.includes(opt2)) {
//         lang = opt2;
//       }

//       // Check Translator option
//       let trEngine = 'freegoogle';
//       const availableEngine = ['freegoogle', 'googlecloud'];
//       if (availableEngine.includes(opt1) && availableEngine.includes(opt2)) {
//         log.info(
//           chalk.greenBright(`CMD(${cmd})>`),
//           chalk.gray('double engine set warning'),
//         );
//         bot.sendMessage(
//           msg.chat.id,
//           'Warning: Only one target engine can be set',
//           {
//             reply_to_message_id: msg.message_id,
//           },
//         );
//         return;
//       } else if (availableEngine.includes(opt1)) {
//         trEngine = opt1;
//       } else if (availableEngine.includes(opt2)) {
//         trEngine = opt2;
//       }

//       // Check entity exists
//       const existsEnt = lttable.query(roomid, userid);
//       if (existsEnt) {
//         // remove it
//         const success = lttable.remove(roomid, userid);
//         if (success) {
//           log.info(
//             chalk.greenBright(`CMD(${cmd})>`),
//             `Remove (${roomid}, ${userid})`,
//           );
//           bot.sendMessage(
//             msg.chat.id,
//             `Turn off live translate user @${msg.from.first_name}`,
//             {
//               reply_to_message_id: msg.message_id,
//             },
//           );
//         } else {
//           log.error(
//             chalk.greenBright(`CMD(${cmd})>`),
//             `Remove failed (${roomid}, ${userid})`,
//           );
//           bot.sendMessage(msg.chat.id, 'Turn off live translate failed.', {
//             reply_to_message_id: msg.message_id,
//           });
//         }
//       } else {
//         const ent = new LiveTranslateEntity();
//         ent.roomid = roomid;
//         ent.userid = userid;
//         ent.engine = trEngine;
//         ent.targetlang = lang;
//         try {
//           await lttable.create(ent);
//         } catch (err) {
//           log.error(err);
//         }
//         log.info(
//           chalk.greenBright(`CMD(${cmd})>`),
//           `Create (${roomid}, ${userid}, ${trEngine}, ${lang})`,
//         );
//         bot.sendMessage(
//           msg.chat.id,
//           `Turn on live translate user @${msg.from.first_name} (to ${lang})`,
//           {
//             reply_to_message_id: msg.message_id,
//           },
//         );
//       }
//     },
//   );

//   bot.on(
//     'text',
//     async (
//       msg: TelegramBot.Message,
//       meta: TelegramBot.Metadata,
//     ): Promise<void> => {
//       if (!msg.text || msg.text.startsWith('/')) return;
//       const roomid = '' + msg.chat.id;
//       const userid = '' + msg.from.id;
//       const ent = lttable.query(roomid, userid);
//       if (!ent) return;
//       const targetText = '' + msg.text;

//       const translatedResult = await freeGoogleTranslateApi(targetText, {
//         to: ent.targetlang,
//       });

//       // log.debug(
//       //   chalk.greenBright('TEXT>'),
//       //   `Create (${roomid}, ${userid}, ${trEngine}, ${lang})`,
//       // );
//       bot.sendMessage(
//         msg.chat.id,
//         translatedResult.text,
//         // {
//         //   reply_to_message_id: msg.message_id,
//         // },
//       );
//     },
//   );
// }

// export async function applyBotTranslate(bot: TelegramBot) {
//   generateBotGCPTranslateFunction(bot, 'toen', 'en');
//   generateBotGCPTranslateFunction(bot, 'toko', 'ko');
//   generateBotGCPTranslateFunction(bot, 'toes', 'es');
//   generateBotGCPTranslateFunction(bot, 'toja', 'ja');
//   generateBotGoogleFreeTranslateFunction(bot, 'ftoen', 'en');
//   generateBotGoogleFreeTranslateFunction(bot, 'ftoko', 'ko');
//   generateBotGoogleFreeTranslateFunction(bot, 'ftoes', 'es');
//   generateBotGoogleFreeTranslateFunction(bot, 'ftoja', 'ja');

//   const sbdb = KyuSqlite3Database.open('live_translate.db');
//   const lttable = LiveTranslateTable.open(sbdb, 'live_translate');
//   generateBotLiveTranslateFunction(bot, sbdb, lttable, 'livetr', [
//     'en',
//     'ko',
//     'es',
//     'ja',
//   ]);
// }
