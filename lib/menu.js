async function menuCommand(sock, msg) {
  const text = `
🤖 *KLW Ranking Bot*

🏆 Commands
.menu
.ranking
.daily
.weekly
.rank

👑 Owner: 94778430626
`;

  await sock.sendMessage(msg.key.remoteJid, { text });
}

module.exports = { menuCommand };
