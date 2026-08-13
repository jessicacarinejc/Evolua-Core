import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
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

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('[Evolua Core] EXPO_PUBLIC_API_URL não foi definida. O build usará o fallback configurado no app, que normalmente aponta para desenvolvimento local.');
}

console.log('[Evolua Core] Gerando projeto Android nativo localmente...');
run('npx', ['expo', 'prebuild', '--platform', 'android'], mobileDir);

const androidDir = join(mobileDir, 'android');
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
