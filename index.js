const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
  ActivityType
} = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const prefix = 'b!';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'b!help', type: ActivityType.Listening }],
    status: 'online'
  });
});

// Welcome embed when added to a server
client.on('guildCreate', guild => {
  const defaultChannel = guild.systemChannel || guild.channels.cache.find(c =>
    c.isTextBased() && c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
  );
  if (defaultChannel) {
    const embed = new EmbedBuilder()
      .setTitle('Thank You!')
      .setDescription('Hi! Thank you for adding the best Iranian bot for moderation.\n\n**Note:** The command prefix is `b!`')
      .setColor('Green');
    defaultChannel.send({ embeds: [embed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply('❌ You must be an admin to use bot commands.');
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // === BASIC MODERATION ===
  if (command === 'warn') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Mention a user to warn.');
    member.send(`⚠️ You have been warned in **${message.guild.name}**.`).catch(() => {});
    message.channel.send(`✅ Warned ${member.user.tag}`);
  }

  if (command === 'kick') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Mention a user to kick.');
    try {
      await member.kick();
      member.send(`🚫 You were kicked from **${message.guild.name}**.`).catch(() => {});
      message.channel.send(`✅ Kicked ${member.user.tag}`);
    } catch {
      message.reply('❌ I do not have permission to kick this user.');
    }
  }

  if (command === 'ban') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Mention a user to ban.');
    try {
      await member.ban();
      member.send(`⛔ You were banned from **${message.guild.name}**.`).catch(() => {});
      message.channel.send(`✅ Banned ${member.user.tag}`);
    } catch {
      message.reply('❌ I do not have permission to ban this user.');
    }
  }

  if (command === 'mute') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Mention a user to mute.');
    try {
      await member.timeout(60_000); // 1 min
      member.send(`🔇 You were muted in **${message.guild.name}**.`).catch(() => {});
      message.channel.send(`✅ Muted ${member.user.tag}`);
    } catch {
      message.reply('❌ I could not mute the user.');
    }
  }

  if (command === 'unmute') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Mention a user to unmute.');
    try {
      await member.timeout(null);
      message.channel.send(`✅ Unmuted ${member.user.tag}`);
    } catch {
      message.reply('❌ I could not unmute the user.');
    }
  }

  // === LOCK / UNLOCK ===
  if (command === 'lock') {
    const channel = message.channel;
    const everyone = message.guild.roles.everyone;
    const perms = channel.permissionsFor(everyone);
    const locked = perms.has(PermissionsBitField.Flags.SendMessages) === false;

    try {
      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: locked
      });
      message.channel.send(locked ? '🔓 Channel unlocked.' : '🔒 Channel locked.');
    } catch {
      message.reply('❌ I could not update channel permissions.');
    }
  }

  // === SLOWMODE ===
  if (command === 'slowmode') {
    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) return message.reply('❌ Enter a number between 0-21600.');
    message.channel.setRateLimitPerUser(seconds);
    message.channel.send(`🐢 Slowmode set to ${seconds} seconds.`);
  }

  // === DELETE MESSAGES ===
  if (command === 'delete') {
    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 100) return message.reply('❌ Enter a number between 1-100.');
    await message.channel.bulkDelete(count + 1, true).catch(() => {});
    message.channel.send(`🧹 Deleted ${count} messages.`).then(msg => setTimeout(() => msg.delete(), 3000));
  }

  // === ROLE GIVE / REMOVE ===
  if (command === 'role') {
    const member = message.mentions.members.first();
    const role = message.guild.roles.cache.get(args[1]);
    if (!member || !role) return message.reply('❌ Usage: b!role @user ROLE_ID');
    await member.roles.add(role);
    message.channel.send(`✅ Role added to ${member.user.tag}`);
  }

  if (command === 'role_remove') {
    const member = message.mentions.members.first();
    const role = message.guild.roles.cache.get(args[1]);
    if (!member || !role) return message.reply('❌ Usage: b!role_remove @user ROLE_ID');
    await member.roles.remove(role);
    message.channel.send(`✅ Role removed from ${member.user.tag}`);
  }

  // === VOICE COMMANDS ===
  if (command === 'join') {
    const voiceId = args[0];
    const channel = message.guild.channels.cache.get(voiceId);
    if (!channel || channel.type !== 2) return message.reply('❌ Invalid voice channel ID.');
    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
      message.channel.send(`✅ Joined voice channel: **${channel.name}**`);
    } catch {
      message.reply('❌ Failed to join the voice channel.');
    }
  }

  if (command === 'voice') {
    const sub = args[0];
    const members = message.guild.members.cache.filter(m => m.voice.channel && !m.user.bot);
    if (sub === 'mute-all') {
      members.forEach(m => m.voice.setMute(true).catch(() => {}));
      message.channel.send('🔇 All users muted.');
    } else if (sub === 'unmute-all') {
      members.forEach(m => m.voice.setMute(false).catch(() => {}));
      message.channel.send('🔊 All users unmuted.');
    } else if (sub === 'deafen-all') {
      members.forEach(m => m.voice.setDeaf(true).catch(() => {}));
      message.channel.send('🤫 All users deafened.');
    } else if (sub === 'undeafen-all') {
      members.forEach(m => m.voice.setDeaf(false).catch(() => {}));
      message.channel.send('👂 All users undeafened.');
    } else if (sub === 'dc-all') {
      members.forEach(m => m.voice.disconnect().catch(() => {}));
      message.channel.send('📤 All users disconnected.');
    } else {
      message.reply('❌ Usage: b!voice [mute-all|unmute-all|deafen-all|undeafen-all|dc-all]');
    }
  }

  // === HELP ===
  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📘 Bot Help')
      .setColor('Blue')
      .addFields(
        { name: '📢 Channel Commands', value: '`b!warn`, `b!kick`, `b!ban`, `b!mute`, `b!unmute`, `b!lock`, `b!slowmode`, `b!delete`, `b!role`, `b!role_remove`' },
        { name: '🎤 Voice Commands', value: '`b!join [channel_id]`, `b!voice mute-all`, `unmute-all`, `deafen-all`, `undeafen-all`, `dc-all`' }
      )
      .setFooter({ text: 'Made by Yurqozy' });
    message.channel.send({ embeds: [embed] });
  }
});

client.login('YOUR_BOT_TOKEN'); // Replace this with your token securely
