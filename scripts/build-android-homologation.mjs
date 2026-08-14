import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

if (new Set(['localhost', '127.0.0.1', '10.0.2.2', '::1']).has(apiUrl.hostname)) {
  throw new Error(`${apiUrl.hostname} não é válido para homologação em aparelho físico. Use o IP da máquina na rede local.`);
}

function run(command, args, cwd, capture = false) {
  return execFileSync(command, args, {
    cwd,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
    encoding: capture ? 'utf8' : undefined,
  });
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function findApkSigner() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!androidHome) return null;
  const buildToolsDir = join(androidHome, 'build-tools');
  if (!existsSync(buildToolsDir)) return null;
  const versions = readdirSync(buildToolsDir).sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
  const binary = process.platform === 'win32' ? 'apksigner.bat' : 'apksigner';
  for (const versionDir of versions) {
    const candidate = join(buildToolsDir, versionDir, binary);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function ensureLocalReleaseSigning(androidDir) {
  const gradlePath = join(androidDir, 'app', 'build.gradle');
  const gradleText = readFileSync(gradlePath, 'utf8');
  const releaseBlock = gradleText.match(/release\s*\{[\s\S]*?\n\s*\}/)?.[0] ?? '';
  if (!/signingConfig\s+signingConfigs\.debug/.test(releaseBlock)) {
    throw new Error(
      'O projeto Android gerado não está configurado para assinar o release com a chave local de desenvolvimento. ' +
        'Para homologação física local, o APK release precisa ser instalável, mas não deve usar chave de loja.',
    );
  }
}

function enableLocalHttpWhenNeeded(androidDir) {
  if (apiUrl.protocol !== 'http:') return false;
  const manifestPath = join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  let manifest = readFileSync(manifestPath, 'utf8');
  if (!/android:usesCleartextTraffic=/.test(manifest)) {
    manifest = manifest.replace('<application ', '<application android:usesCleartextTraffic="true" ');
    writeFileSync(manifestPath, manifest);
  }
  if (!/android:usesCleartextTraffic="true"/.test(readFileSync(manifestPath, 'utf8'))) {
    throw new Error('Não foi possível habilitar HTTP local no AndroidManifest para a API de homologação.');
  }
  return true;
}

console.log(`[Evolua Core] versão ${version} (Android ${versionCode})`);
console.log(`[Evolua Core] API: ${apiUrl.toString()}`);
console.log('[Evolua Core] Gerando projeto Android nativo localmente...');
run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android'], mobileDir);

const androidDir = join(mobileDir, 'android');
ensureLocalReleaseSigning(androidDir);
const cleartextEnabled = enableLocalHttpWhenNeeded(androidDir);

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
  throw new Error('O APK release está sem assinatura e não pode ser instalado no aparelho físico.');
}

const apkSigner = findApkSigner();
if (!apkSigner) {
  throw new Error('Não encontrei apksigner no Android SDK. Instale Android SDK Build-Tools antes de gerar o APK de homologação.');
}

console.log('[Evolua Core] Verificando assinatura e integridade do APK...');
run(apkSigner, ['verify', '--verbose', sourceApk], androidDir);
const certOutput = String(run(apkSigner, ['verify', '--print-certs', sourceApk], androidDir, true));
const certSha256 = certOutput.match(/Signer #1 certificate SHA-256 digest:\s*([a-fA-F0-9:]+)/)?.[1] ?? null;

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
  localHttpCleartextEnabled: cleartextEnabled,
  signing: {
    purpose: 'homologacao-local',
    storeSigning: false,
    verifiedByApkSigner: true,
    certificateSha256: certSha256,
  },
  artifact: targetApk.split(/[\\/]/).pop(),
  bytes: statSync(targetApk).size,
  sha256: sha256(targetApk),
  builtAt: new Date().toISOString(),
};
writeFileSync(join(distDir, `evolua-core-${version}-b${versionCode}-homologacao.json`), `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`[Evolua Core] APK gerado: ${targetApk}`);
console.log(`[Evolua Core] SHA-256: ${metadata.sha256}`);
if (certSha256) console.log(`[Evolua Core] Certificado local SHA-256: ${certSha256}`);
console.log('[Evolua Core] Artefato destinado exclusivamente à homologação local; não usar para publicação em loja.');
