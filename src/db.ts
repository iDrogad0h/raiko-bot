import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export interface ReactionRoleBinding {
  id?: number;
  guild_id: string;
  channel_id: string;
  message_id: string;
  emoji: string; // id del emoji custom, o el caracter unicode
  role_id: string;
}

export async function addBinding(binding: ReactionRoleBinding) {
  const { error } = await supabase.from("reaction_roles").upsert(binding, {
    onConflict: "message_id,emoji",
  });
  if (error) throw error;
}

export async function getBinding(messageId: string, emoji: string) {
  const { data, error } = await supabase
    .from("reaction_roles")
    .select("*")
    .eq("message_id", messageId)
    .eq("emoji", emoji)
    .maybeSingle();
  if (error) throw error;
  return data as ReactionRoleBinding | null;
}

export async function listBindings(messageId: string) {
  const { data, error } = await supabase
    .from("reaction_roles")
    .select("*")
    .eq("message_id", messageId);
  if (error) throw error;
  return (data ?? []) as ReactionRoleBinding[];
}

export async function removeBinding(messageId: string, emoji: string) {
  const { error } = await supabase
    .from("reaction_roles")
    .delete()
    .eq("message_id", messageId)
    .eq("emoji", emoji);
  if (error) throw error;
}
