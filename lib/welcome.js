async function welcome(sock, jid, user) {
  await sock.sendMessage(jid, {
    text: `👋 Welcome @${user.split("@")[0]}`,
    mentions: [user]
  });
}

module.exports = { welcome };