import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const mobileDir = join(root, 'apps', 'mobile');
const appConfig = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8'));
const version = appConfig.expo?.version ?? '0.0.0';
const versionCode = appConfig.expo?.android?.versionCode ?? 0;
const apiUrlRaw = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrlRaw) {
  throw new Error('Defina EXPO_PUBLIC_API_URL com o endereço da API acessível pelo aparelho na rede local.');
}

let apiUrl;
try {
  apiUrl = new URL(apiUrlRaw);
} catch {
  throw new Error('EXPO_PUBLIC_API_URL inválida. Use uma URL completa, por exemplo http://192.168.1.10:3333/v1.');
}

if (!['http:', 'https:'].includes(apiUrl.protocol)) {
  throw new Error('EXPO_PUBLIC_API_URL deve usar http:// ou https://.');
}

if (new Set(['localhost', '127.0.0.1', '10.0.2.2']).has(apiUrl.hostname)) {
  throw new Error(`${apiUrl.hostname} não é válido para homologação em aparelho físico. Use o IP da máquina na rede local.`);
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

console.log(`[Evolua Core] versão ${version} (Android ${versionCode})`);
console.log(`[Evolua Core] API: ${apiUrl.toString()}`);
console.log('[Evolua Core] Gerando projeto Android nativo localmente...');
run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android'], mobileDir);

const androidDir = join(mobileDir, 'android');
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
console.log('[Evolua Core] Compilando APK release local de homologação...');
run(gradle, ['assembleRelease'], androidDir);

const candidates = [
  join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
];
const sourceApk = candidates.find((path) => existsSync(path));
if (!sourceApk) {
  throw new Error('Gradle concluiu sem gerar APK release no caminho esperado.');
}

if (sourceApk.endsWith('-unsigned.apk')) {
  throw new Error(
    'O APK gerado está sem assinatura e não pode ser instalado no aparelho. ' +
      'A configuração local deve assinar o release com a chave de homologação/desenvolvimento antes da entrega.',
  );
}

const distDir = join(root, 'dist');
mkdirSync(distDir, { recursive: true });
const targetApk = join(distDir, `evolua-core-${version}-b${versionCode}-homologacao.apk`);
copyFileSync(sourceApk, targetApk);

const metadata = {
  application: 'Evolua Core',
  channel: 'homologacao-local',
  version,
  versionCode,
  apiUrl: apiUrl.toString(),
  artifact: targetApk.split(/[\\/]/).pop(),
  bytes: statSync(targetApk).size,
  sha256: sha256(targetApk),
  builtAt: new Date().toISOString(),
};
writeFileSync(join(distDir, `evolua-core-${version}-b${versionCode}-homologacao.json`), `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`[Evolua Core] APK gerado: ${targetApk}`);
console.log(`[Evolua Core] SHA-256: ${metadata.sha256}`);
console.log('[Evolua Core] Artefato destinado exclusivamente à homologação local.');
