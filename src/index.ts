import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as setupCmd from "./commands/setup";
import * as reactionRoleCmd from "./commands/reactionrole";
import { addBinding, getBinding } from "./db";
import { parseOptionsBlock } from "./parse";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

interface Command {
  data: { name: string };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Collection<string, Command>();
commands.set(setupCmd.data.name, setupCmd as unknown as Command);
commands.set(reactionRoleCmd.data.name, reactionRoleCmd as unknown as Command);

client.once(Events.ClientReady, (c) => {
  console.log(`「夜桜」Raikō conectado como ${c.user.tag}`);
  c.user.setActivity("/setup");
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (!interaction.customId.startsWith("raiko_setup__")) return;
      await handleSetupModal(interaction);
      return;
    }
  } catch (err) {
    console.error(err);
    const msg = "Se rompió algo. Revisá los logs del bot.";
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true });
      } else {
        await interaction.reply({ content: msg, ephemeral: true });
      }
    }
  }
});

async function handleSetupModal(interaction: import("discord.js").ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const channelId = interaction.customId.replace("raiko_setup__", "");
  const titulo = interaction.fields.getTextInputValue("titulo");
  const opcionesRaw = interaction.fields.getTextInputValue("opciones");

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("Esto solo funciona dentro de un servidor.");
    return;
  }

  const channel = await guild.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply("No encontré ese canal o no es de texto.");
    return;
  }

  const parsed = parseOptionsBlock(opcionesRaw);
  const errores = parsed.filter((p) => !p.ok);
  const validos = parsed.filter((p) => p.ok);

  // Validar que los roles existan en el server
  const rolesInvalidos: string[] = [];
  for (const opt of validos) {
    const role = await guild.roles.fetch(opt.roleId).catch(() => null);
    if (!role) rolesInvalidos.push(opt.raw);
  }
  const finales = validos.filter((v) => !rolesInvalidos.includes(v.raw));

  if (finales.length === 0) {
    await interaction.editReply(
      `No pude armar el panel, ninguna línea es válida.\n${[...errores.map((e) => e.error), ...rolesInvalidos.map((r) => `Rol inexistente en: "${r}"`)].join("\n")}`
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(
      finales
        .map((f) => {
          const emojiDisplay = /^\d+$/.test(f.reactArg) ? `<:e:${f.reactArg}>` : f.reactArg;
          return `${emojiDisplay} -> <@&${f.roleId}>`;
        })
        .join("\n")
    )
    .setColor(0x8b0000)
    .setFooter({ text: "「夜桜」Raikō" });

  const message = await (channel as import("discord.js").TextChannel).send({
    embeds: [embed],
  });

  const fallosReact: string[] = [];
  for (const f of finales) {
    try {
      await message.react(f.reactArg);
      await addBinding({
        guild_id: guild.id,
        channel_id: channel.id,
        message_id: message.id,
        emoji: f.emojiKey,
        role_id: f.roleId,
      });
    } catch (e) {
      fallosReact.push(f.raw);
    }
  }

  let resumen = `Panel publicado en <#${channel.id}>. Roles configurados: ${finales.length - fallosReact.length}/${finales.length}.`;
  if (errores.length > 0) resumen += `\n\nLíneas con error de formato:\n${errores.map((e) => e.error).join("\n")}`;
  if (rolesInvalidos.length > 0) resumen += `\n\nRoles que no existen:\n${rolesInvalidos.join("\n")}`;
  if (fallosReact.length > 0) resumen += `\n\nNo pude reaccionar con:\n${fallosReact.join("\n")}`;

  await interaction.editReply(resumen);
}

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch {
    return;
  }

  const key = reaction.emoji.id ?? reaction.emoji.name;
  if (!key) return;

  const binding = await getBinding(reaction.message.id, key);
  if (!binding) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.add(binding.role_id).catch((e) => console.error("No pude agregar rol:", e));
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch {
    return;
  }

  const key = reaction.emoji.id ?? reaction.emoji.name;
  if (!key) return;

  const binding = await getBinding(reaction.message.id, key);
  if (!binding) return;

  const guild = reaction.message.guild;
  if (!guild) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  await member.roles.remove(binding.role_id).catch((e) => console.error("No pude sacar rol:", e));
});

client.login(process.env.DISCORD_TOKEN);
