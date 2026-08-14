import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const mobileDir = join(root, 'apps', 'mobile');
const iosDir = join(mobileDir, 'ios');
const distDir = join(root, 'dist');
const derivedDataDir = join(root, '.tmp', 'ios-homologation-derived-data');
const appConfig = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8'));
const version = appConfig.expo?.version ?? '0.0.0';
const buildNumber = appConfig.expo?.ios?.buildNumber ?? '0';

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: options.capture ? 'utf8' : undefined,
    env: process.env,
  });
}

function validateApiUrl(rawValue) {
  if (!rawValue) throw new Error('[Evolua Core] EXPO_PUBLIC_API_URL é obrigatória para homologação local.');
  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error('[Evolua Core] EXPO_PUBLIC_API_URL inválida. Informe uma URL http:// ou https:// completa.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('[Evolua Core] A API deve usar http:// ou https://.');
  const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  if (blockedHosts.has(parsed.hostname)) {
    throw new Error('[Evolua Core] Para homologação em aparelho físico, use o IP da máquina na rede local.');
  }
  return parsed;
}

if (process.platform !== 'darwin') {
  throw new Error('[Evolua Core] O build iOS local exige macOS com Xcode instalado. Nenhum serviço externo será usado.');
}

const apiUrl = validateApiUrl(process.env.EXPO_PUBLIC_API_URL);
console.log(`[Evolua Core] API de homologação iOS: ${apiUrl.toString()}`);

run('xcodebuild', ['-version'], root);
run('pod', ['--version'], root);

console.log('[Evolua Core] Gerando projeto iOS nativo localmente...');
run('npx', ['expo', 'prebuild', '--clean', '--platform', 'ios'], mobileDir);

console.log('[Evolua Core] Instalando Pods localmente...');
run('pod', ['install'], iosDir);

const workspaceName = readdirSync(iosDir).find((entry) => entry.endsWith('.xcworkspace'));
if (!workspaceName) throw new Error('[Evolua Core] Workspace iOS não encontrado após o prebuild/pod install.');

const workspacePath = join(iosDir, workspaceName);
const listOutput = run('xcodebuild', ['-workspace', workspacePath, '-list', '-json'], root, { capture: true });
const listJson = JSON.parse(listOutput);
const scheme = listJson.workspace?.schemes?.[0];
if (!scheme) throw new Error('[Evolua Core] Nenhum scheme iOS foi encontrado no workspace.');

rmSync(derivedDataDir, { recursive: true, force: true });
mkdirSync(derivedDataDir, { recursive: true });

console.log(`[Evolua Core] Validando build Release iOS local sem assinatura (${scheme})...`);
run(
  'xcodebuild',
  [
    '-workspace', workspacePath,
    '-scheme', scheme,
    '-configuration', 'Release',
    '-sdk', 'iphoneos',
    '-derivedDataPath', derivedDataDir,
    'CODE_SIGNING_ALLOWED=NO',
    'CODE_SIGNING_REQUIRED=NO',
    'build',
  ],
  root,
);

const productsDir = join(derivedDataDir, 'Build', 'Products', 'Release-iphoneos');
const appName = existsSync(productsDir) ? readdirSync(productsDir).find((entry) => entry.endsWith('.app')) : null;
if (!appName) throw new Error('[Evolua Core] O build terminou sem produzir o bundle .app esperado.');

mkdirSync(distDir, { recursive: true });
const sourceApp = join(productsDir, appName);
const archiveName = `evolua-core-${version}-build-${buildNumber}-ios-homologacao-unsigned.zip`;
const archivePath = join(distDir, archiveName);
rmSync(archivePath, { force: true });
run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', sourceApp, archivePath], root);

console.log(`\n[Evolua Core] Build iOS local validado: ${basename(archivePath)}`);
console.log('[Evolua Core] O artefato é propositalmente não assinado e serve para validar a compilação local.');
console.log('[Evolua Core] Instalação em iPhone físico continua sujeita às regras de assinatura do iOS/Xcode, sem TestFlight nesta etapa.');
