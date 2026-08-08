# 「夜桜」Raikō — Bot de Reaction Roles

Bot de Discord en TypeScript que asigna/quita roles cuando alguien reacciona a un
mensaje. Se configura con un solo comando: `/setup`.

---

## 1. Crear la aplicación del bot en Discord

1. Andá a https://discord.com/developers/applications -> **New Application** -> nombralo `「夜桜」Raikō`.
2. En **Bot** -> **Reset Token** -> copiá el token (es tu `DISCORD_TOKEN`, no lo compartas).
3. En la misma página, activá **Server Members Intent** (lo necesita para asignar roles).
4. En **OAuth2 -> URL Generator**: scopes `bot` + `applications.commands`. Permisos:
   `Manage Roles`, `Send Messages`, `Embed Links`, `Add Reactions`, `Read Message History`.
   Abrí el link generado e invitalo a tu server.
5. Copiá el **Application ID** (es tu `CLIENT_ID`) desde **General Information**.
6. El **GUILD_ID** es el ID de tu servidor (click derecho al ícono del server con
   el modo desarrollador activado en Discord -> Copiar ID de servidor).

**Importante:** el rol del bot tiene que estar **más arriba** en la jerarquía que
todos los roles que va a asignar (altura, país, estilos, etc.), si no, Discord no
lo deja.

---

## 2. Crear la base en Supabase (gratis)

1. Creá cuenta/proyecto en https://supabase.com.
2. Andá a **SQL Editor** -> **New query**, pegá el contenido de `supabase.sql`
   (está en este proyecto) y ejecutalo. Esto crea la tabla `reaction_roles`.
3. En **Project Settings -> API** copiá:
   - `Project URL` -> `SUPABASE_URL`
   - `service_role` key (no la `anon`) -> `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Preparar tu VM de Oracle Cloud (la misma del server de Minecraft)

Conectate por SSH como siempre:

```bash
ssh usuario@ip-de-tu-vm
```

### 3.1 Instalar Node.js (si no lo tenés ya, Minecraft usa Java, no Node)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # debería mostrar v20.x
```

### 3.2 Instalar pm2 (mantiene el bot corriendo 24/7 y lo reinicia si crashea o si reinicia la VM)

```bash
sudo npm install -g pm2
```

### 3.3 Subir el proyecto

Lo más simple: subilo a un repo de GitHub (privado, ya que va a tener el `.env`
fuera del repo) y cloná ahí:

```bash
git clone https://github.com/iDrogad0h/raiko-bot.git
cd raiko-bot
npm install
```

Si preferís no usar GitHub, se puede subir por `scp` desde tu PC:

```bash
scp -r ./raiko-bot usuario@ip-de-tu-vm:~/raiko-bot
```

### 3.4 Configurar las variables de entorno

```bash
cd ~/raiko-bot
cp .env.example .env
nano .env
```

Completá con los valores reales (`DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Guardá con `Ctrl+O`, `Enter`,
`Ctrl+X`.

### 3.5 Compilar y registrar los slash commands

```bash
npm run build
npm run deploy-commands
```

Esto último registra `/setup` y `/reactionrole` en tu servidor (tarda unos
segundos en aparecer, a veces hasta 1 minuto).

### 3.6 Levantarlo con pm2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

El comando `pm2 startup` te va a tirar una línea para copiar y pegar (empieza
con `sudo env PATH=...`) — ejecutala tal cual te la muestra. Eso hace que el
bot se levante solo si la VM se reinicia.

Comandos útiles después:

```bash
pm2 logs raiko-bot     # ver logs en vivo
pm2 restart raiko-bot  # reiniciar (por ej. después de subir cambios)
pm2 stop raiko-bot
```

---

## 4. Cómo usar `/setup`

1. En el canal donde quieras el panel (o cualquier otro, elegís el canal como
   opción del comando), escribí `/setup canal:#nombre-del-canal`.
2. Se abre un formulario con dos campos:
   - **Título**: el texto de arriba del panel (ej. "Reacciona a este mensaje
     para tener un rol de tu altura.")
   - **Opciones**: una línea por cada emoji-rol, formato:
     ```
     emoji | id_del_rol
     ```
     Podés usar el ID pelado del rol o la mención `<@&id>` (si escribís `@` y
     seleccionás el rol en el campo, Discord te pone la mención sola).

     Para emojis custom del server (como las banderas de tus capturas): andá a
     cualquier canal y escribí `\:nombre_del_emoji:` (con la barra invertida
     adelante) y mandalo — Discord te va a mostrar el código real, algo como
     `<:AR:1234567890123456789>`. Copiá y pegá eso en el campo Opciones.

Ejemplo real para el panel de país:

```
🇦🇷 | 1111111111111111111
🇨🇱 | 2222222222222222222
🇨🇴 | 3333333333333333333
```

3. Al enviar el formulario, el bot publica el embed en el canal elegido,
   reacciona automáticamente con cada emoji y guarda todo en Supabase. Listo,
   ya funciona: cualquiera que reaccione recibe el rol, y si saca la reacción
   se lo saca.

### Gestionar paneles ya creados

- `/reactionrole list message_id:<id>` — te muestra qué roles están
  configurados en ese mensaje.
- `/reactionrole remove message_id:<id> emoji:<emoji_o_id>` — saca un binding
  puntual (la reacción del bot en el mensaje la sacás vos a mano si querés).

Para tus dos canales existentes (país y autoroles), como los mensajes **ya
están posteados**, no hace falta re-crearlos: podés usar `/setup` para
publicar un panel nuevo, o si preferís mantener los mensajes viejos tal cual
están, decime y armamos una variante de `/setup` que enlace roles a un
mensaje ya existente en vez de crear uno nuevo.

---

## 5. Estructura del proyecto

```
raiko-bot/
├── src/
│   ├── index.ts              # login, listeners de reacciones, modal handler
│   ├── deploy-commands.ts    # registra los slash commands
│   ├── db.ts                 # cliente Supabase
│   ├── parse.ts              # parsea el texto "emoji | rol"
│   └── commands/
│       ├── setup.ts
│       └── reactionrole.ts
├── supabase.sql
├── ecosystem.config.js       # config de pm2
├── .env.example
└── package.json
```
