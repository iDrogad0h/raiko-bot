export interface ParsedOption {
  raw: string;
  emojiKey: string; // lo que se guarda en DB y se compara con reaction.emoji.id/name
  reactArg: string; // lo que se le pasa a message.react()
  roleId: string;
  ok: boolean;
  error?: string;
}

const CUSTOM_EMOJI_RE = /<a?:\w+:(\d+)>/;
const ID_RE = /\d{15,20}/;

/**
 * Cada línea del textarea debe tener el formato:
 *   emoji | rol
 * El "rol" puede ser una mención (<@&123...>) o el ID pelado.
 * El "emoji" puede ser un emoji unicode (😀) o uno custom (<:nombre:123...>).
 */
export function parseOptionsBlock(block: string): ParsedOption[] {
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => parseLine(line));
}

function parseLine(line: string): ParsedOption {
  const parts = line.split("|");
  if (parts.length < 2) {
    return {
      raw: line,
      emojiKey: "",
      reactArg: "",
      roleId: "",
      ok: false,
      error: `Formato inválido (falta "|"): "${line}"`,
    };
  }

  const emojiRaw = parts[0].trim();
  const roleRaw = parts.slice(1).join("|").trim();

  const roleMatch = roleRaw.match(ID_RE);
  if (!roleMatch) {
    return {
      raw: line,
      emojiKey: "",
      reactArg: "",
      roleId: "",
      ok: false,
      error: `No encontré un ID de rol válido en: "${line}"`,
    };
  }
  const roleId = roleMatch[0];

  const customMatch = emojiRaw.match(CUSTOM_EMOJI_RE);
  let emojiKey: string;
  let reactArg: string;
  if (customMatch) {
    emojiKey = customMatch[1];
    reactArg = customMatch[1];
  } else if (emojiRaw.length > 0) {
    emojiKey = emojiRaw;
    reactArg = emojiRaw;
  } else {
    return {
      raw: line,
      emojiKey: "",
      reactArg: "",
      roleId: "",
      ok: false,
      error: `No encontré un emoji válido en: "${line}"`,
    };
  }

  return { raw: line, emojiKey, reactArg, roleId, ok: true };
}
