let Promise = require("bluebird");
let debug = require("debug")("stgr-bot:main");
let chalk = require("chalk");
let uuid = require("uuid");
let fs = require("fs");
Promise.promisifyAll(fs);
let phantom = require("phantom");
let TelegramBot = require("node-telegram-bot-api");

let enkoConverter = require("./external/enkoConverter.js");

let token = "293512843:AAGYEsnZeE-3zZFCzlUSUEmZxNg_wQKYsvo";
let options = {
  polling: true
};
let pinstance;

let bot = new TelegramBot(token, options);

bot.on("message", function(msg) {
  debug(msg);
});

bot.on("text", function(msg) {
  console.log(chalk.cyan("[CHAT]") + chalk.green(msg.chat.title || getFullName(msg.chat)) + chalk.yellow("<" + getFullName(msg.from) + ">") + msg.text);
});

bot.onText(/^\/enko .*/, function(msg, match) {
  let cmd = msg.text.substring(6, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/영한 .*/, function(msg, match) {
  let cmd = msg.text.substring(4, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/koen .*/, function(msg, match) {
  let cmd = msg.text.substring(6, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/한영 .*/, function(msg, match) {
  let cmd = msg.text.substring(4, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "한영: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
    reply_to_message_id: msg.message_id
  });
});


bot.onText(/^\/render .*/, function(msg, match) {
  let cmd = msg.text.substring(8, msg.text.length);
  render(msg, cmd, {width: 800, height: 600});
});

bot.onText(/^\/hdrender .*/, function(msg, match) {
  let cmd = msg.text.substring(10, msg.text.length);
  render(msg, cmd, {width: 1920, height: 1080});
});

function render(msg, cmd, size) {
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  if(!cmd.match(/^http(s)?:\/\//)) {
    cmd = "http://" + cmd;
  }

  let cid = msg.chat.id;
  let mid, smsg, ppage, filename;
  bot.sendMessage(cid, "`[=....]` Browser Initialize...", {
    reply_to_message_id: msg.message_id,
    parse_mode: "Markdown"
  })
  .then(sent => {
    mid = sent.message_id;
    smsg = {
      chat_id: cid,
      message_id: mid,
      parse_mode: "Markdown"
    };
    if(!pinstance)
      return phantom.create();
    return null;
  })
  .then(instance => {
    if(instance) pinstance = instance;
    return pinstance.createPage();
  })
  .then(page => {
    ppage = page;
    return page.property("viewportSize", size);
  })
  .then(() => {
    bot.editMessageText("`[==...]` Connect to <" + cmd + ">...", smsg);
    return ppage.open(cmd);
  })
  .then(status => {
    if(status === "fail") {
      bot.editMessageText("`[=x...]` Connection fail", smsg);
      throw {type: "CUSTOM", case: 1};
    }
    bot.editMessageText("`[===..]` Rendering [" + cmd + "]...", smsg);
    filename = "./" + uuid.v4() + ".jpeg";
    return ppage.render(filename, {format: 'jpeg', quality: '100'});
  })
  .then(() => {
    if(!fs.existsSync(filename)) {
      bot.editMessageText("`[==x..]` Rendering fail (maybe not HTML)", smsg);
      throw {type: "CUSTOM", case: 2};
    }
    bot.editMessageText("`[====.]` Sending photo...", smsg);
    return bot.sendPhoto(cid, filename);
  })
  .then(sentPhoto => {
    bot.editMessageText("`[=====]` Done", smsg);
    ppage.close();
    fs.unlinkAsync(filename);
  })
  .catch(err => {
    if(err.type !== "CUSTOM") {
      console.log(chalk.red("[ERROR]"));
      console.log(err);
      bot.editMessageText("Unknown internal error occured", smsg);
    }
    ppage.close();
  });
}

function getFullName(user) {
  if(!user) return "UNKNOWN";
  if(user.last_name) return user.first_name + " " + user.last_name;
  return user.first_name;
}
