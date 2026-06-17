#!/usr/bin/env bash
#
# deploy.sh — Despliegue "todo en uno" de app-analytics en Cloudflare Workers.
#
# Para alguien que no sabe nada: clona el repo, entra en la carpeta y ejecuta:
#
#     ./deploy.sh
#
# Necesitas: Node.js + pnpm instalados, y una cuenta (gratis) en Cloudflare.
# El script se encarga del resto: dependencias, base de datos D1, migraciones,
# secreto JWT, usuario admin y el deploy. Es re-ejecutable sin romper nada.

set -euo pipefail

# Ir siempre a la carpeta del script (la raíz del proyecto).
cd "$(dirname "$0")"

# --- Colores / helpers de salida -------------------------------------------
BOLD=$'\033[1m'; GREEN=$'\033[32m'; BLUE=$'\033[34m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'
step() { echo; echo "${BOLD}${BLUE}==> $*${RESET}"; }
ok()   { echo "${GREEN}✓ $*${RESET}"; }
warn() { echo "${YELLOW}! $*${RESET}"; }
die()  { echo "${RED}✗ $*${RESET}" >&2; exit 1; }

DB_NAME="analytics"

# --- 0. Prerrequisitos ------------------------------------------------------
step "Comprobando prerrequisitos"
command -v node >/dev/null 2>&1 || die "Falta Node.js. Instálalo desde https://nodejs.org"
command -v pnpm >/dev/null 2>&1 || die "Falta pnpm. Instálalo con: npm install -g pnpm  (o: corepack enable)"
[ -f wrangler.jsonc ] || die "No encuentro wrangler.jsonc. Ejecuta el script desde la raíz del proyecto."
ok "Node $(node -v) y pnpm $(pnpm -v) disponibles"

# Generador de secretos: openssl si está, si no /dev/urandom.
gen_secret() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -base64 48
  else head -c 48 /dev/urandom | base64; fi
}

# --- 1. Dependencias --------------------------------------------------------
step "Instalando dependencias (pnpm install)"
pnpm install
ok "Dependencias listas"

# --- 2. Login en Cloudflare -------------------------------------------------
step "Cuenta de Cloudflare"
if pnpm exec wrangler whoami >/dev/null 2>&1; then
  ok "Ya tienes sesión de Cloudflare iniciada"
else
  warn "Se abrirá el navegador para que inicies sesión en Cloudflare..."
  pnpm exec wrangler login
  pnpm exec wrangler whoami >/dev/null 2>&1 || die "No se pudo iniciar sesión en Cloudflare"
  ok "Sesión iniciada"
fi

# --- 3. Base de datos D1 ----------------------------------------------------
step "Base de datos D1 '$DB_NAME'"

# Intenta obtener el id de una D1 existente con ese nombre.
get_db_id() {
  pnpm exec wrangler d1 list --json 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const a=JSON.parse(s); const m=a.find(x=>x.name===process.argv[1]);
            process.stdout.write(m ? (m.uuid||m.database_id||"") : ""); } catch(e){}
    });' "$DB_NAME"
}

DB_ID="$(get_db_id || true)"
if [ -n "$DB_ID" ]; then
  ok "Reutilizando D1 existente: $DB_ID"
else
  warn "Creando una nueva D1..."
  pnpm exec wrangler d1 create "$DB_NAME" >/dev/null 2>&1 || true
  DB_ID="$(get_db_id || true)"
  [ -n "$DB_ID" ] || die "No pude crear/obtener la base de datos D1"
  ok "D1 creada: $DB_ID"
fi

# Inyecta el database_id en wrangler.jsonc (reemplaza el valor actual).
step "Escribiendo database_id en wrangler.jsonc"
node -e '
  const fs=require("fs"); const f="wrangler.jsonc";
  let t=fs.readFileSync(f,"utf8");
  t=t.replace(/("database_id":\s*")[^"]*(")/, `$1${process.argv[1]}$2`);
  fs.writeFileSync(f,t);
' "$DB_ID"
ok "wrangler.jsonc actualizado"

# --- 4. Migraciones (crea las tablas en la D1 remota) -----------------------
step "Aplicando migraciones en la base de datos remota"
pnpm exec wrangler d1 migrations apply "$DB_NAME" --remote
ok "Tablas creadas/actualizadas"

# --- 5. Secreto para firmar los JWT -----------------------------------------
step "Secreto JWT de producción"
if pnpm exec wrangler secret list 2>/dev/null | grep -q '"JWT_SECRET"'; then
  ok "JWT_SECRET ya está configurado (se conserva)"
else
  gen_secret | pnpm exec wrangler secret put JWT_SECRET
  ok "JWT_SECRET generado y subido"
fi

# --- 6. Usuario administrador ----------------------------------------------
step "Usuario para entrar al panel"
echo "Crea tu usuario (el login es por email; la contraseña: 8+ caracteres alfanuméricos)."
read -r -p "  Email: " ADMIN_EMAIL
while true; do
  read -r -s -p "  Contraseña: " ADMIN_PASS; echo
  if [ "${#ADMIN_PASS}" -ge 8 ] && [[ "$ADMIN_PASS" =~ ^[a-zA-Z0-9]+$ ]]; then break; fi
  warn "La contraseña debe tener 8+ caracteres y solo letras/números. Inténtalo de nuevo."
done

if pnpm user:create "$ADMIN_EMAIL" "$ADMIN_PASS" --remote 2>/dev/null; then
  ok "Usuario creado"
else
  warn "No se creó (¿ese email ya existía?). Continuamos."
fi

# --- 7. Deploy --------------------------------------------------------------
step "Desplegando en Cloudflare (build + deploy)"
DEPLOY_OUT="$(pnpm run deploy 2>&1)"
echo "$DEPLOY_OUT" | tail -n 5
URL="$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1 || true)"

echo
echo "${BOLD}${GREEN}========================================================${RESET}"
ok "¡Desplegado!"
[ -n "$URL" ] && echo "  ${BOLD}Tu panel:${RESET} $URL" || warn "Revisa arriba la URL de tu Worker."
echo "  Entra con el email y la contraseña que acabas de crear,"
echo "  añade un dominio y copia el snippet en tu web. ¡Listo!"
echo "${BOLD}${GREEN}========================================================${RESET}"
