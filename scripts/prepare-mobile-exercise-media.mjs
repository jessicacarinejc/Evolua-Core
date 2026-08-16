import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const assetsDir = path.join(root, 'apps/mobile/assets/exercises');
const manifestPath = path.join(assetsDir, 'media-manifest.json');
const generatedPath = path.join(root, 'apps/mobile/src/workouts/exercise-media.generated.ts');
const generatorPath = path.join(root, 'scripts/generate-original-exercise-clip.py');
const tempDir = path.join(root, '.tmp-exercise-media');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const ready = (manifest.exercises ?? []).filter((item) => item.status === 'ready');

await mkdir(assetsDir, { recursive: true });
await mkdir(tempDir, { recursive: true });

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', cwd: root });
}

function keyOf(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function runFfmpeg(input, output, item) {
  const args = ['-y'];
  if (Number.isFinite(item.clipStartSeconds)) args.push('-ss', String(item.clipStartSeconds));
  args.push('-i', input);
  if (Number.isFinite(item.clipDurationSeconds)) args.push('-t', String(item.clipDurationSeconds));
  args.push('-vf', 'scale=-2:480', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output);
  run('ffmpeg', args);
}

async function download(url, target) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Evolua-Core-Homologation-Build/1.0 (exercise media preparation)' },
  });
  if (!response.ok) throw new Error(`Falha ao baixar mídia (${response.status}) ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`Mídia muito pequena/possivelmente inválida: ${url}`);
  await writeFile(target, bytes);
}

const generatedEntries = [];
const generatedKeys = new Set();

function addGeneratedKey(key, sourceFile) {
  if (!key || generatedKeys.has(key)) return;
  generatedKeys.add(key);
  generatedEntries.push(`  ${JSON.stringify(key)}: require('../../assets/exercises/${sourceFile}'),`);
}

try {
  for (const item of ready) {
    const sourceFile = String(item.sourceFile ?? '').trim();
    const sourceKind = String(item.sourceKind ?? 'external').trim();
    if (!sourceFile) throw new Error(`${item.slug}: fonte pronta sem sourceFile.`);

    const target = path.join(assetsDir, sourceFile);
    if (!existsSync(target)) {
      if (sourceKind === 'original-animation') {
        console.log(`[exercise-media] gerando clipe original: ${item.name}...`);
        run('python', [generatorPath, '--slug', item.slug, '--name', item.name, '--output', target]);
      } else {
        const sourceUrl = String(item.sourceUrl ?? '').trim();
        if (!sourceUrl) throw new Error(`${item.slug}: mídia externa pronta sem sourceUrl.`);
        const source = path.join(tempDir, `${item.slug}.source`);
        console.log(`[exercise-media] baixando ${item.name}...`);
        await download(sourceUrl, source);
        console.log(`[exercise-media] convertendo ${item.name} para MP4 offline...`);
        runFfmpeg(source, target, item);
      }
    }

    addGeneratedKey(keyOf(item.slug), sourceFile);
    addGeneratedKey(keyOf(item.name), sourceFile);
    for (const alias of item.aliases ?? []) addGeneratedKey(keyOf(alias), sourceFile);
  }

  const generated = [
    '// Arquivo gerado durante o build Android por scripts/prepare-mobile-exercise-media.mjs.',
    '// Não editar manualmente no runner.',
    'declare const require: (path: string) => number;',
    'export const generatedLocalExerciseClips: Record<string, number> = {',
    ...generatedEntries,
    '};',
    '',
  ].join('\n');
  await writeFile(generatedPath, generated);
  console.log(`[exercise-media] ${ready.length} clipe(s) instrutivo(s) offline materializado(s); ${generatedKeys.size} chave(s) de resolução.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
