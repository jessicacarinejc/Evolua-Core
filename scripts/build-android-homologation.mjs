import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const mobileDir = join(root, 'apps', 'mobile');
const appConfig = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8'));
const version = appConfig.expo?.version ?? '0.0.0';

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
}

function validateApiUrl(rawValue) {
  if (!rawValue) {
    throw new Error(
      '[Evolua Core] EXPO_PUBLIC_API_URL é obrigatória para homologação em dispositivo físico. ' +
      'Exemplo: http://192.168.1.10:3333/v1',
    );
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error('[Evolua Core] EXPO_PUBLIC_API_URL inválida. Informe uma URL http:// ou https:// completa.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('[Evolua Core] EXPO_PUBLIC_API_URL deve usar http:// ou https://.');
  }

  const blockedHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2']);
  if (blockedHosts.has(parsed.hostname)) {
    throw new Error(
      `[Evolua Core] ${parsed.hostname} não é válido para homologação em aparelho físico. ` +
      'Use o IP da máquina na mesma rede local do celular.',
    );
  }

  return parsed;
}

function enableLocalHttpIfNeeded(apiUrl, androidDir) {
  if (apiUrl.protocol !== 'http:') return;

  const manifestPath = join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
  let manifest = readFileSync(manifestPath, 'utf8');

  if (/android:usesCleartextTraffic=/.test(manifest)) {
    manifest = manifest.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="true"');
  } else {
    manifest = manifest.replace('<application ', '<application android:usesCleartextTraffic="true" ');
  }

  writeFileSync(manifestPath, manifest, 'utf8');
  console.log('[Evolua Core] Tráfego HTTP local habilitado somente no projeto Android gerado para homologação.');
}

const apiUrl = validateApiUrl(process.env.EXPO_PUBLIC_API_URL);

console.log(`[Evolua Core] API de homologação: ${apiUrl.toString()}`);
console.log('[Evolua Core] Gerando projeto Android nativo localmente...');
run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android'], mobileDir);

const androidDir = join(mobileDir, 'android');
enableLocalHttpIfNeeded(apiUrl, androidDir);

const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('[Evolua Core] Compilando APK release local para homologação...');
run(gradle, ['assembleRelease'], androidDir);

const sourceApk = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const distDir = join(root, 'dist');
const targetApk = join(distDir, `evolua-core-${version}-homologacao.apk`);
mkdirSync(distDir, { recursive: true });
copyFileSync(sourceApk, targetApk);

console.log(`\n[Evolua Core] APK gerado: ${targetApk}`);
console.log('[Evolua Core] Este artefato é destinado à homologação local e não à publicação em loja.');
