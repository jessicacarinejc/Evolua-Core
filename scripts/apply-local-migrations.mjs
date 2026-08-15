import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const databaseDir = join(root, 'database');
const migrations = readdirSync(databaseDir)
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

if (migrations.length === 0) {
  throw new Error('Nenhuma migração SQL encontrada em database/.');
}

const databaseUrl = new URL(
  process.env.DATABASE_URL ?? 'postgresql://evolua:evolua@127.0.0.1:5432/evolua_core',
);
const databaseUser = decodeURIComponent(databaseUrl.username || 'evolua');
const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, '') || 'evolua_core');

const composeArgs = ['compose'];
const composeEnvFile = process.env.EVOLUA_COMPOSE_ENV_FILE?.trim();
const composeFile = process.env.EVOLUA_COMPOSE_FILE?.trim();
if (composeEnvFile) {
  composeArgs.push('--env-file', composeEnvFile);
}
if (composeFile) {
  composeArgs.push('-f', composeFile);
}

for (const migration of migrations) {
  const sql = readFileSync(join(databaseDir, migration), 'utf8');
  console.log(`[Evolua Core] Aplicando ${migration} em ${databaseName}...`);
  execFileSync(
    'docker',
    [
      ...composeArgs,
      'exec',
      '-T',
      'postgres',
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      databaseUser,
      '-d',
      databaseName,
    ],
    { cwd: root, stdio: ['pipe', 'inherit', 'inherit'], input: sql },
  );
}

console.log(`[Evolua Core] ${migrations.length} migrações aplicadas com sucesso.`);
