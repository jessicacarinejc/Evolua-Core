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

const playable = [];
const pending = [];
const invalid = [];
const realisticFinal = [];
const animatedFallback = [];

for (const item of exercises) {
  if (item.status !== 'ready') {
    pending.push({ slug: item.slug, name: item.name, reason: 'demonstração offline ainda pendente' });
    continue;
  }

  const sourceFile = String(item.sourceFile ?? '').trim();
  const sourceKind = String(item.sourceKind ?? 'external').trim();
  const license = String(item.license ?? '').trim();
  const attribution = String(item.attribution ?? '').trim();
  const sourceUrl = String(item.sourceUrl ?? '').trim();
  const finalQuality = String(item.finalQuality ?? '').trim();

  const isOriginalAnimation = sourceKind === 'original-animation';
  if (!sourceFile || !license || !attribution || (!isOriginalAnimation && !sourceUrl)) {
    invalid.push({ slug: item.slug, reason: 'status ready sem metadados obrigatórios para o tipo de fonte' });
    continue;
  }

  const absoluteFile = path.join(root, 'apps/mobile/assets/exercises', sourceFile);
  try {
    await access(absoluteFile);
    const entry = {
      slug: item.slug,
      name: item.name,
      sourceFile,
      sourceKind,
      finalQuality: finalQuality || null,
      license,
      attribution,
      sourceUrl: sourceUrl || null,
    };
    playable.push(entry);
    if (finalQuality === 'realistic-human-demo') realisticFinal.push(entry);
    else animatedFallback.push(entry);
  } catch {
    invalid.push({ slug: item.slug, reason: `arquivo ausente: ${sourceFile}` });
  }
}

const playableCoveragePercent = Math.round((playable.length / expectedExercises) * 100);
const realisticCoveragePercent = Math.round((realisticFinal.length / expectedExercises) * 100);
const report = {
  generatedAt: new Date().toISOString(),
  expectedExercises,
  playableClips: playable.length,
  playableCoveragePercent,
  realisticFinalClips: realisticFinal.length,
  realisticCoveragePercent,
  animatedFallbackClips: animatedFallback.length,
  pendingClips: pending.length,
  invalidClips: invalid.length,
  strict,
  policy: {
    ...manifest.policy,
    finalAcceptance: 'realistic-human-demo',
    proceduralAnimationIsFallback: true,
  },
  playable,
  realisticFinal,
  animatedFallback,
  pending,
  invalid,
};

await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist', 'exercise-media-coverage.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`[exercise-media] cobertura reproduzível no APK: ${playable.length}/${expectedExercises} (${playableCoveragePercent}%).`);
console.log(`[exercise-media] cobertura realista final: ${realisticFinal.length}/${expectedExercises} (${realisticCoveragePercent}%).`);
if (animatedFallback.length) console.log(`[exercise-media] fallbacks animados: ${animatedFallback.length}.`);
if (pending.length) console.log(`[exercise-media] pendentes: ${pending.length}.`);
if (invalid.length) console.error(`[exercise-media] inválidos: ${invalid.length}.`);

assert(invalid.length === 0, 'Existem clipes marcados como prontos com metadados/arquivo inválidos.');
if (strict) {
  assert(playable.length === expectedExercises, `APK de homologação exige ${expectedExercises}/${expectedExercises} demonstrações offline reproduzíveis.`);
}
