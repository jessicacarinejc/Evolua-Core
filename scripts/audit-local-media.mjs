import process from 'node:process';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://evolua:evolua@127.0.0.1:5432/evolua_core';

const client = new Client({ connectionString: DATABASE_URL });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await client.connect();

  const result = await client.query(`
    SELECT
      ev.id,
      e.slug,
      ev.url,
      ev.source_url,
      ev.license,
      ev.attribution,
      ev.usage_kind
    FROM exercise_videos ev
    JOIN exercises e ON e.id = ev.exercise_id
    ORDER BY e.slug, ev.is_primary DESC, ev.id
  `);

  assert(result.rowCount > 0, 'Nenhuma mídia de exercício cadastrada para auditoria.');

  const invalid = result.rows.filter((row) => {
    const url = String(row.url ?? '').trim();
    const sourceUrl = String(row.source_url ?? '').trim();
    const license = String(row.license ?? '').trim();
    const attribution = String(row.attribution ?? '').trim();
    const usageKind = String(row.usage_kind ?? '').trim();

    return !url
      || !sourceUrl
      || !license
      || !attribution
      || !usageKind
      || /\/wiki\/File:/i.test(url);
  });

  if (invalid.length) {
    console.error('[media-audit] mídias inválidas:');
    for (const row of invalid) {
      console.error(`- ${row.slug}: license=${row.license ?? 'null'} attribution=${row.attribution ?? 'null'} source=${row.source_url ?? 'null'} url=${row.url ?? 'null'}`);
    }
  }

  assert(
    invalid.length === 0,
    `${invalid.length} mídia(s) sem metadados obrigatórios ou com URL de página em vez de arquivo reproduzível.`,
  );

  const references = result.rows.filter((row) => row.usage_kind === 'reference').length;
  const production = result.rows.filter((row) => row.usage_kind === 'production').length;

  console.log(`[media-audit] ${result.rowCount} mídia(s) auditadas: ${production} produção, ${references} referência.`);
  console.log('[media-audit] licença, atribuição, origem e URL reproduzível: ok');
} finally {
  await client.end().catch(() => undefined);
}
