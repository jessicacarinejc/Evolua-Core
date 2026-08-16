import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const manifestPath = path.join(root, 'apps/mobile/assets/exercises/media-manifest.json');
const strict = process.env.STRICT_EXERCISE_MEDIA === '1';
const expectedExercises = 29;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const exercises = Array.isArray(manifest.exercises) ? manifest.exercises : [];
const slugs = exercises.map((item) => String(item.slug ?? '').trim()).filter(Boolean);
const unique = new Set(slugs);

assert(exercises.length === expectedExercises, `Manifesto deve conter ${expectedExercises} exercícios; encontrado: ${exercises.length}.`);
assert(unique.size === exercises.length, 'Manifesto contém slugs duplicados.');
assert(manifest?.policy?.screenshotsAsVideoAllowed === false, 'Política deve proibir sequência de prints como vídeo final.');
assert(manifest?.policy?.referenceMediaCountsAsFinal === false, 'Mídia de referência não pode contar como clipe final.');

const ready = [];
const pending = [];
const invalid = [];

for (const item of exercises) {
  if (item.status !== 'ready') {
    pending.push({ slug: item.slug, name: item.name, reason: 'clipe real offline ainda pendente' });
    continue;
  }

  const sourceFile = String(item.sourceFile ?? '').trim();
  const license = String(item.license ?? '').trim();
  const attribution = String(item.attribution ?? '').trim();
  const sourceUrl = String(item.sourceUrl ?? '').trim();

  if (!sourceFile || !license || !attribution || !sourceUrl) {
    invalid.push({ slug: item.slug, reason: 'status ready sem sourceFile/license/attribution/sourceUrl' });
    continue;
  }

  const absoluteFile = path.join(root, 'apps/mobile/assets/exercises', sourceFile);
  try {
    await access(absoluteFile);
    ready.push({ slug: item.slug, name: item.name, sourceFile, license, attribution, sourceUrl });
  } catch {
    invalid.push({ slug: item.slug, reason: `arquivo ausente: ${sourceFile}` });
  }
}

const coveragePercent = Math.round((ready.length / expectedExercises) * 100);
const report = {
  generatedAt: new Date().toISOString(),
  expectedExercises,
  readyClips: ready.length,
  pendingClips: pending.length,
  invalidClips: invalid.length,
  coveragePercent,
  strict,
  ready,
  pending,
  invalid,
};

await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist', 'exercise-media-coverage.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`[exercise-media] cobertura real offline: ${ready.length}/${expectedExercises} (${coveragePercent}%).`);
if (pending.length) console.log(`[exercise-media] pendentes: ${pending.length}.`);
if (invalid.length) console.error(`[exercise-media] inválidos: ${invalid.length}.`);

assert(invalid.length === 0, 'Existem clipes marcados como prontos com metadados/arquivo inválidos.');
if (strict) {
  assert(ready.length === expectedExercises, `Homologação final exige ${expectedExercises}/${expectedExercises} clipes reais offline.`);
}
