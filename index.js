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

bot.onText(/^\/enko .*/i, function(msg, match) {
  let cmd = msg.text.substring(6, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/영한 .*/i, function(msg, match) {
  let cmd = msg.text.substring(4, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(true, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/koen .*/i, function(msg, match) {
  let cmd = msg.text.substring(6, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "render: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/한영 .*/i, function(msg, match) {
  let cmd = msg.text.substring(4, msg.text.length);
  console.log(chalk.cyan("[CMD]") + "한영: " + cmd);
  bot.sendMessage(msg.chat.id, enkoConverter(false, cmd), {
    reply_to_message_id: msg.message_id
  });
});

bot.onText(/^\/render(@SemteulBot)?$/i, function(msg, match) {
  bot.sendMessage(msg.chat.id, "Usage: /render [URL] [(JSON)options]\n"
    + "options:\n"
    + "- size: [{string} 'auto'|'sd'|'hd'|'uhd'] (default: 'sd')\n"
    + "- origin: [{bool} dontCompress] (default: false)\n"
    + "- delay: [{int} sec] (default: 2)", {
    reply_to_message_id: msg.message_id
  });
});


bot.onText(/^\/render(@SemteulBot)? .*/i, function(msg, match) {
  const cmd = msg.text.substring(msg.text.indexOf(" ")+1, msg.text.length);
  const spt = cmd.indexOf(" ");
  let url = spt !== -1 ? cmd.substring(0, spt) : cmd;
  let options = spt !== -1 ? cmd.substring(spt+1, cmd.length) : "{}";

  if(!url.match(/^http(s)?:\/\//)) {
    url = "http://" + url;
  }

  try {
    options = JSON.parse(options);
  }catch(err) {
    options = {err:err};
  }

  switch(options.size || "sd") {
    default: options.size = {width: 800, height: 600};
      options.err = new TypeError("Unknown size type: " + options.size);
    break; case "sd": options.size = {width: 800, height: 600};
    break; case "hd": options.size = {width: 1920, height: 1080};
    break; case "uhd": options.size = {width: 4096, height: 2160};
    break; case "auto": options.size = false;
  }

  options.delay = parseInt(options.delay) || 2;
  if(options.delay > 60 || options.delay < 0) {
    options.delay = 2;
    options.err = new Error("Delay must between value (0 ~ 60)");
  }

  render(msg, url, options);
});

function render(msg, url, options) {
  console.log(chalk.cyan("[CMD]") + "render: " + url);


  let cid = msg.chat.id;
  let mid, smsg, ppage, filename;

  bot.sendMessage(cid, "`[=.....]` Browser Initialize...", {
    reply_to_message_id: msg.message_id,
    parse_mode: "Markdown"
  })// message sent
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
  })// phantom instance create
  .then(instance => {
    if(instance) pinstance = instance;
    return pinstance.createPage();
  })// h=phantom page instance create
  .then(page => {
    ppage = page;
    if(options.size) {
      return ppage.property("viewportSize", options.size);
    }else return;
  })// set viewport size
  .then(() => {
    return //ppage.on("onError", function(msg) {console.log(msg)});
  })// phantom inner error handleing
  .then(() => {
    return bot.editMessageText("`[==....]` Connect to <" + url + ">...", smsg);
  })// message sent
  .then(() => {
    return ppage.open(url);
  })// page open
  .then(status => {
    if(status === "fail") {
      bot.editMessageText("`[=x....]` Connection fail", smsg);
      throw {type: "CUSTOM", case: 1};
    }
    return ppage.evaluate(function() {
      var hroot = document.querySelector("html");
      if(hroot.style.getPropertyValue("background-color") == null) {
        hroot.setAttribute("style", "background-color:#fff");
      }
    });
  })// set background-color white
  .then(() => {
    return new Promise(function(resolve) {
      if(options.delay) {
        bot.editMessageText("`[===...]` Delaying...", smsg)
        .then(() => {
          setTimeout(() => {resolve()} , options.delay * 1000);
        });
      }else {
        resolve();
      }
    });
  })// delaying
  .then(() => {
    filename = "./" + uuid() + ".jpeg";
    return bot.editMessageText("`[====..]` Rendering [" + url + "]...", smsg);
  })// message sent
  .then(() => {
    return ppage.render(filename, {format: 'jpeg', quality: '100'});
  })// rendering page
  .then(() => {
    if(!fs.existsSync(filename)) {
      bot.editMessageText("`[===x..]` Rendering fail (maybe not HTML)", smsg);
      throw {type: "CUSTOM", case: 2};
    }
    return bot.editMessageText("`[=====.]` Sending photo...", smsg);
  })// message sent
  .then(() => {
    if(options.origin) {
      return bot.sendDocument(cid, filename);
    }else {
      return bot.sendPhoto(cid, filename);
    }
  })// send photo
  .then(sentPhoto => {
    if(options.err) {
      bot.editMessageText("`[======]` Done. but has options error("+options.err.__proto__.name+": "+options.err.message+")", smsg);
    }else {
      bot.editMessageText("`[======]` Done", smsg);
    }
    ppage.close();
    fs.unlinkAsync(filename);
  })// page close, file delete
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
