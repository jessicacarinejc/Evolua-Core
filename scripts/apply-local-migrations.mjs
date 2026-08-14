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

for (const migration of migrations) {
  const sql = readFileSync(join(databaseDir, migration), 'utf8');
  console.log(`[Evolua Core] Aplicando ${migration}...`);
  execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'evolua', '-d', 'evolua_core'],
    { cwd: root, stdio: ['pipe', 'inherit', 'inherit'], input: sql },
  );
}

console.log(`[Evolua Core] ${migrations.length} migrações aplicadas com sucesso.`);
