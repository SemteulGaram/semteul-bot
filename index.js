let debug = require("debug")("stgr-bot:main");
let chalk = require("chalk");
let uuid = require("uuid");
let fs = require("fs");
let TelegramBot = require("node-telegram-bot-api");

let enkoConverter = require("./external/enkoConverter.js");

let token = "293512843:AAGYEsnZeE-3zZFCzlUSUEmZxNg_wQKYsvo";
let options = {
  polling: true
};

let bot = new TelegramBot(token, options);

bot.on("message", function(msg) {
  debug(msg);
});

bot.onText(/^\/qusghks .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(true, msg.text.substring(8, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/변환 .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(false, msg.text.substring(4, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});
