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

bot.onText(/^\/enko .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(true, msg.text.substring(6, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/영한 .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(true, msg.text.substring(4, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/koen .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(false, msg.text.substring(6, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/한영 .*/, function(msg, match) {
  bot.sendMessage(msg.chat.id, enkoConverter(false, msg.text.substring(4, msg.text.length)), {
    reply_to_message_id: msg.message_id
  });
});
