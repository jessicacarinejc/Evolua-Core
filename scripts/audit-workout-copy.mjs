import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const roots = [
  'apps/mobile/src',
  'services/api/src/workouts',
  'database',
];

const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.sql', '.json']);
const forbidden = [
  { pattern: /\bSentda\b/gi, suggestion: 'Sentada' },
  { pattern: /\bSentdo\b/gi, suggestion: 'Sentado' },
  { pattern: /\brepetiçoes\b/gi, suggestion: 'repetições' },
  { pattern: /\bPosiçao\b/g, suggestion: 'Posição' },
];

async function collect(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collect(full));
    else if (allowedExtensions.has(extname(entry.name))) out.push(full);
  }
  return out;
}

const failures = [];
for (const root of roots) {
  for (const file of await collect(root)) {
    const text = await readFile(file, 'utf8');
    for (const rule of forbidden) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(text)) {
        failures.push(`${relative('.', file)}: usar “${rule.suggestion}”`);
      }
    }
  }
}

if (failures.length) {
  console.error('Erros ortográficos encontrados em textos de treino:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Auditoria de ortografia dos textos de treino: OK');
