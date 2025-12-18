const fs = require("fs-extra");
const moment = require("moment-timezone");
const config = require("./config");

const rankingCache = {};
const groupsToSave = new Set();

function getDayKey() {
  return moment().tz(config.TIMEZONE).format("YYYY-MM-DD");
}
function getWeekKey() {
  return moment().tz(config.TIMEZONE).format("YYYY-WW");
}

// AUTO SAVE
setInterval(() => {
  for (const groupId of groupsToSave) {
    const file = `${config.RANKING_FOLDER}/${groupId}.json`;
    fs.ensureDirSync(config.RANKING_FOLDER);
    fs.writeJsonSync(file, rankingCache[groupId]);
  }
  groupsToSave.clear();
}, 60000);

async function listener(sock, msg) {
  try {
    if (!msg.key.remoteJid.endsWith("@g.us")) return;

    const groupId = msg.key.remoteJid;
    const senderId = msg.key.participant;

    const filePath = `${config.RANKING_FOLDER}/${groupId}.json`;

    if (!rankingCache[groupId]) {
      rankingCache[groupId] = fs.existsSync(filePath)
        ? fs.readJsonSync(filePath)
        : {};
    }

    const db = rankingCache[groupId];

    if (!db[senderId]) {
      db[senderId] = {
        global: 0,
        daily: { count: 0, dayKey: getDayKey() },
        weekly: { count: 0, weekKey: getWeekKey() }
      };
    }

    const u = db[senderId];
    u.global++;

    if (u.daily.dayKey !== getDayKey())
      u.daily = { count: 1, dayKey: getDayKey() };
    else u.daily.count++;

    if (u.weekly.weekKey !== getWeekKey())
      u.weekly = { count: 1, weekKey: getWeekKey() };
    else u.weekly.count++;

    groupsToSave.add(groupId);
  } catch (e) {
    console.error("Ranking Error:", e);
  }
}

async function command(sock, msg, command) {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant;

  if (!rankingCache[chatId]) return;

  const db = rankingCache[chatId];
  let mode = command;

  const today = getDayKey();
  const week = getWeekKey();

  const sorted = Object.entries(db)
    .map(([id, d]) => ({
      id,
      count:
        mode === "daily"
          ? d.daily?.dayKey === today
            ? d.daily.count
            : 0
          : mode === "weekly"
          ? d.weekly?.weekKey === week
            ? d.weekly.count
            : 0
          : d.global
    }))
    .filter(u => u.count > 0)
    .sort((a, b) => b.count - a.count);

  if (command === "rank" || command === "myrank") {
    const index = sorted.findIndex(u => u.id === sender);
    if (index === -1)
      return sock.sendMessage(chatId, { text: "📉 No rank yet." });

    return sock.sendMessage(chatId, {
      text: `👤 YOUR RANK\n🏆 #${index + 1}\n🌐 Messages: ${
        sorted[index].count
      }`,
      mentions: [sender]
    });
  }

  let text = `🏆 ${mode.toUpperCase()} RANKING\n\n`;
  sorted.slice(0, 10).forEach((u, i) => {
    text += `${i + 1}. @${u.id.split("@")[0]} - ${u.count}\n`;
  });

  await sock.sendMessage(chatId, {
    text,
    mentions: sorted.map(u => u.id)
  });
}

module.exports = { listener, command };