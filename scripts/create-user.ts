/**
 * Alta manual de usuarios (NO hay registro público).
 *
 * Uso:
 *   pnpm user:create <email> <password>           -> D1 local
 *   pnpm user:create <email> <password> --remote   -> D1 de producción
 *
 * Corre en Node (no en el Worker), pero reutiliza el MISMO hashPassword del
 * servidor (crypto.subtle existe también en Node 20+), así el hash que se guarda
 * es idéntico al que verificará el login. Si duplicáramos la lógica y se
 * desincronizara, los hashes no validarían.
 */
import { execFileSync } from 'node:child_process';
import { hashPassword } from '../server/utils/password';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const [email, password] = args.filter(a => a !== '--remote');

if (!email || !password) {
  console.error('Uso: pnpm user:create <email> <password> [--remote]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

// Normalizamos el email a minúsculas: el login también lo hace (Zod .toLowerCase()),
// así que ambos lados tienen que coincidir o nunca se encontraría al usuario.
const normalizedEmail = email.toLowerCase();

const { hash, salt } = await hashPassword(password);

// Escapamos comillas simples para el INSERT (script de dev, input controlado).
// hash y salt son hex => seguros; el email es el único campo con texto libre.
const safeEmail = normalizedEmail.replace(/'/g, "''");

const sql = `INSERT INTO users (email, password_hash, salt) VALUES ('${safeEmail}', '${hash}', '${salt}');`;

const target = remote ? '--remote' : '--local';

console.log(`Creando usuario "${normalizedEmail}" en D1 (${remote ? 'remote' : 'local'})...`);

try {
  execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'execute', 'analytics', target, '--command', sql],
    { stdio: 'inherit' }
  );
  console.log(`✅ Usuario "${normalizedEmail}" creado.`);
} catch {
  // wrangler ya imprime el detalle (p.ej. UNIQUE constraint si el email ya existe).
  console.error('❌ No se pudo crear el usuario (¿email ya registrado?).');
  process.exit(1);
}
