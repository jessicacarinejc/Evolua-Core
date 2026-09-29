import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const assetsDir = path.join(root, 'apps/mobile/assets/exercises');
const manifestPath = path.join(assetsDir, 'media-manifest.json');
const overridesPath = path.join(assetsDir, 'realistic-media-overrides.json');
const generatedPath = path.join(root, 'apps/mobile/src/workouts/exercise-media.generated.ts');
const generatorPath = path.join(root, 'scripts/generate-original-exercise-clip.py');
const tempDir = path.join(root, '.tmp-exercise-media');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const overrides = existsSync(overridesPath)
  ? JSON.parse(await readFile(overridesPath, 'utf8'))
  : { exercises: [] };
const overrideBySlug = new Map((overrides.exercises ?? []).map((item) => [item.slug, item]));
const exercises = (manifest.exercises ?? []).map((item) => ({ ...item, ...(overrideBySlug.get(item.slug) ?? {}) }));
const ready = exercises.filter((item) => item.status === 'ready');

await mkdir(assetsDir, { recursive: true });
await mkdir(tempDir, { recursive: true });

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit', cwd: root });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const retryable = new Set([408, 425, 429, 500, 502, 503, 504]);
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Evolua-Core-Homologation-Build/1.0 (contact: github.com/jessicacarinejc/Evolua-Core)',
        accept: '*/*',
      },
    });

    if (response.ok) {
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error(`Mídia muito pequena/possivelmente inválida: ${url}`);
      await writeFile(target, bytes);
      return;
    }

    if (!retryable.has(response.status) || attempt === maxAttempts) {
      throw new Error(`Falha ao baixar mídia (${response.status}) ${url}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : 1500 * (2 ** (attempt - 1));
    console.warn(`[exercise-media] fonte respondeu ${response.status}; nova tentativa ${attempt + 1}/${maxAttempts} em ${delay}ms...`);
    await sleep(delay);
  }
}

const generatedEntries = [];
const generatedKeys = new Set();

function addGeneratedKey(key, sourceFile, item) {
  if (!key || generatedKeys.has(key)) return;
  generatedKeys.add(key);
  const finalQuality = item.finalQuality === 'realistic-human-demo' ? 'realistic-human-demo' : 'animated-fallback';
  generatedEntries.push(
    `  ${JSON.stringify(key)}: { source: require('../../assets/exercises/${sourceFile}'), finalQuality: ${JSON.stringify(finalQuality)}, license: ${JSON.stringify(String(item.license ?? ''))}, attribution: ${JSON.stringify(String(item.attribution ?? ''))} },`,
  );
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
        console.log(`[exercise-media] baixando mídia realista: ${item.name}...`);
        await download(sourceUrl, source);
        console.log(`[exercise-media] convertendo ${item.name} para MP4 offline...`);
        runFfmpeg(source, target, item);
        await sleep(1200);
      }
    }

    addGeneratedKey(keyOf(item.slug), sourceFile, item);
    addGeneratedKey(keyOf(item.name), sourceFile, item);
    for (const alias of item.aliases ?? []) addGeneratedKey(keyOf(alias), sourceFile, item);
  }

  const generated = [
    '// Arquivo gerado durante o build Android por scripts/prepare-mobile-exercise-media.mjs.',
    '// Não editar manualmente no runner.',
    'declare const require: (path: string) => number;',
    "export type GeneratedLocalExerciseMedia = { source: number; finalQuality: 'realistic-human-demo' | 'animated-fallback'; license?: string; attribution?: string };",
    'export const generatedLocalExerciseMedia: Record<string, GeneratedLocalExerciseMedia> = {',
    ...generatedEntries,
    '};',
    '',
  ].join('\n');
  await writeFile(generatedPath, generated);
  const realistic = ready.filter((item) => item.finalQuality === 'realistic-human-demo').length;
  console.log(`[exercise-media] ${ready.length} demonstração(ões) offline materializada(s); ${realistic} realista(s); ${generatedKeys.size} chave(s) de resolução.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
