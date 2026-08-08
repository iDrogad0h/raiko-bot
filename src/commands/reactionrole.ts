import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { listBindings, removeBinding } from "../db";

export const data = new SlashCommandBuilder()
  .setName("reactionrole")
  .setDescription("「夜桜」Raikō - Gestionar reaction roles existentes")
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("Lista los roles configurados en un mensaje")
      .addStringOption((opt) =>
        opt
          .setName("message_id")
          .setDescription("ID del mensaje del panel")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Elimina un binding emoji -> rol de un mensaje")
      .addStringOption((opt) =>
        opt
          .setName("message_id")
          .setDescription("ID del mensaje del panel")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("emoji")
          .setDescription("Emoji (o ID del emoji custom) a eliminar")
          .setRequired(true)
      )
  )
  .setDMPermission(false)
  .setDefaultMemberPermissions(0x20); // Manage Roles

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const messageId = interaction.options.getString("message_id", true);

  if (sub === "list") {
    const bindings = await listBindings(messageId);
    if (bindings.length === 0) {
      await interaction.reply({
        content: "No hay reaction roles configurados para ese mensaje.",
        ephemeral: true,
      });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle("Reaction roles configurados")
      .setDescription(
        bindings
          .map((b) => `\`${b.emoji}\` -> <@&${b.role_id}>`)
          .join("\n")
      )
      .setColor(0x8b0000);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (sub === "remove") {
    const emoji = interaction.options.getString("emoji", true);
    await removeBinding(messageId, emoji);
    await interaction.reply({
      content: `Listo, saqué el binding \`${emoji}\` de ese mensaje. (La reacción del bot en el mensaje no se borra automáticamente, si querés sacala a mano.)`,
      ephemeral: true,
    });
  }
}
