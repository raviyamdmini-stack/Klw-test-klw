const config = require("./config");
const ranking = require("./ranking");
const { menuCommand } = require("./lib/menu");

async function handleMessage(sock, msg) {
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  if (!text.startsWith(config.PREFIX)) {
    await ranking.listener(sock, msg); // ranking counter
    return;
  }

  const args = text.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case "menu":
      return menuCommand(sock, msg);

    case "ranking":
    case "global":
    case "daily":
    case "weekly":
    case "rank":
    case "myrank":
      return ranking.command(sock, msg, command, args);
  }
}

module.exports = { handleMessage };