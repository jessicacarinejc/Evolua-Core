import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const mobileDir = join(root, 'apps', 'mobile');
const appConfig = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8'));
const version = appConfig.expo?.version ?? '0.0.0';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Defina EXPO_PUBLIC_API_URL com o endereço da API acessível pelo aparelho na rede local.');
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
}

console.log(`[Evolua Core] API: ${apiUrl}`);
console.log('[Evolua Core] Gerando projeto Android nativo localmente...');
run('npx', ['expo', 'prebuild', '--clean', '--platform', 'android'], mobileDir);

const androidDir = join(mobileDir, 'android');
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
console.log('[Evolua Core] Compilando APK local de homologação...');
run(gradle, ['assembleRelease'], androidDir);

const sourceApk = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const distDir = join(root, 'dist');
const targetApk = join(distDir, `evolua-core-${version}-homologacao.apk`);
mkdirSync(distDir, { recursive: true });
copyFileSync(sourceApk, targetApk);
console.log(`[Evolua Core] APK gerado: ${targetApk}`);
