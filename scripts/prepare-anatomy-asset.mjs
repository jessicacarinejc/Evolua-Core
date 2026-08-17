import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const targetDir = path.join(root, 'apps/mobile/assets/anatomy');
const target = path.join(targetDir, 'muscles-front-back.png');
const distDir = path.join(root, 'dist');
const sourceUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Muscles_front_and_back.svg/960px-Muscles_front_and_back.svg.png';
const sourcePageUrl = 'https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg';

await mkdir(targetDir, { recursive: true });
await mkdir(distDir, { recursive: true });

const response = await fetch(sourceUrl, {
  redirect: 'follow',
  headers: { 'user-agent': 'Evolua-Core-Homologation-Build/1.0 (anatomy asset preparation)' },
});
if (!response.ok) throw new Error(`Falha ao baixar anatomia (${response.status}) ${sourceUrl}`);

const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length < 20_000) throw new Error(`Arquivo anatômico inválido ou muito pequeno: ${bytes.length} bytes.`);
await writeFile(target, bytes);

const report = {
  generatedAt: new Date().toISOString(),
  asset: 'muscles-front-back.png',
  sourceUrl,
  sourcePageUrl,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  license: 'CC BY-SA 4.0',
  attribution: 'OpenStax; Tomáš Kebert; umimeto.org — Muscles front and back, via Wikimedia Commons',
  usage: 'Imagem anatômica exibida sem substituir a estimativa funcional calculada pelo Evolua Core.',
};

await writeFile(path.join(distDir, 'anatomy-asset.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[anatomy] anatomia frontal/posterior pronta: ${bytes.length} bytes.`);
