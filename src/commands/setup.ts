import {
  SlashCommandBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChatInputCommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("「夜桜」Raikō - Crea un panel de reaction roles en un canal")
  .addChannelOption((opt) =>
    opt
      .setName("canal")
      .setDescription("Canal donde se va a publicar el panel")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  .setDMPermission(false)
  .setDefaultMemberPermissions(0x20); // Manage Roles

export async function execute(interaction: ChatInputCommandInteraction) {
  const canal = interaction.options.getChannel("canal", true);

  const modal = new ModalBuilder()
    .setCustomId(`raiko_setup__${canal.id}`)
    .setTitle("「夜桜」Raikō - Nuevo panel");

  const tituloInput = new TextInputBuilder()
    .setCustomId("titulo")
    .setLabel("Título del panel")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Reacciona a este mensaje para tener un rol de tu altura.")
    .setRequired(true)
    .setMaxLength(200);

  const opcionesInput = new TextInputBuilder()
    .setCustomId("opciones")
    .setLabel("Opciones: emoji | rol (una por línea)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      "1️⃣ | 123456789012345678\n2️⃣ | 123456789012345678\n<:AR:123...> | 123456789012345678"
    )
    .setRequired(true)
    .setMaxLength(4000);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(tituloInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(opcionesInput)
  );

  await interaction.showModal(modal);
}
