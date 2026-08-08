-- Ejecutar esto en Supabase: Project -> SQL Editor -> New query -> Run

create table if not exists reaction_roles (
  id bigserial primary key,
  guild_id text not null,
  channel_id text not null,
  message_id text not null,
  emoji text not null,
  role_id text not null,
  created_at timestamptz default now(),
  unique (message_id, emoji)
);

create index if not exists idx_reaction_roles_message on reaction_roles (message_id);
