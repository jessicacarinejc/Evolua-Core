import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const assetsDir = path.join(root, 'apps/mobile/assets/exercises');
const manifestPath = path.join(assetsDir, 'media-manifest.json');
const generatedPath = path.join(root, 'apps/mobile/src/workouts/exercise-media.generated.ts');
const tempDir = path.join(root, '.tmp-exercise-media');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const ready = (manifest.exercises ?? []).filter((item) => item.status === 'ready');

await mkdir(assetsDir, { recursive: true });
await mkdir(tempDir, { recursive: true });

function runFfmpeg(input, output, item) {
  const args = ['-y'];
  if (Number.isFinite(item.clipStartSeconds)) args.push('-ss', String(item.clipStartSeconds));
  args.push('-i', input);
  if (Number.isFinite(item.clipDurationSeconds)) args.push('-t', String(item.clipDurationSeconds));
  args.push(
    '-vf', 'scale=-2:480',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    output,
  );
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
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

try {
  for (const item of ready) {
    const sourceUrl = String(item.sourceUrl ?? '').trim();
    const sourceFile = String(item.sourceFile ?? '').trim();
    if (!sourceUrl || !sourceFile) throw new Error(`${item.slug}: fonte pronta sem sourceUrl/sourceFile.`);

    const target = path.join(assetsDir, sourceFile);
    if (!existsSync(target)) {
      const source = path.join(tempDir, `${item.slug}.source`);
      console.log(`[exercise-media] baixando ${item.name}...`);
      await download(sourceUrl, source);
      console.log(`[exercise-media] convertendo ${item.name} para MP4 offline...`);
      runFfmpeg(source, target, item);
    }

    generatedEntries.push(`  ${JSON.stringify(item.slug)}: require('../../assets/exercises/${sourceFile}'),`);
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
  console.log(`[exercise-media] ${ready.length} clipe(s) real(is) materializado(s) para o APK.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
