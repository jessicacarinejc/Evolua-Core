import { networkInterfaces } from 'node:os';
import process from 'node:process';

const apiUrlRaw = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrlRaw) {
  throw new Error('Defina EXPO_PUBLIC_API_URL no .env.homologation. Ex.: http://192.168.1.10:3333/v1');
}

let apiUrl;
try {
  apiUrl = new URL(apiUrlRaw);
} catch {
  throw new Error('EXPO_PUBLIC_API_URL inválida.');
}

const blockedHosts = new Set(['localhost', '127.0.0.1', '10.0.2.2', '::1']);
if (blockedHosts.has(apiUrl.hostname)) {
  throw new Error(`${apiUrl.hostname} não é acessível por um aparelho físico. Use o IPv4 da máquina na rede local.`);
}

const localIpv4 = Object.values(networkInterfaces())
  .flatMap((entries) => entries ?? [])
  .filter((entry) => entry.family === 'IPv4' && !entry.internal)
  .map((entry) => entry.address);

console.log(`[Evolua Core] IPv4 locais detectados: ${localIpv4.join(', ') || 'nenhum'}`);
console.log(`[Evolua Core] URL configurada para o aparelho: ${apiUrl.toString()}`);

if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiUrl.hostname) && !localIpv4.includes(apiUrl.hostname)) {
  throw new Error(
    `A URL usa ${apiUrl.hostname}, mas esse IP não está ativo nesta máquina. ` +
      'Atualize EXPO_PUBLIC_API_URL para um dos IPv4 listados acima antes do build.',
  );
}

const readinessUrl = new URL(apiUrl.toString().replace(/\/$/, '') + '/health/ready');
console.log(`[Evolua Core] Testando readiness em ${readinessUrl.toString()}...`);

let response;
try {
  response = await fetch(readinessUrl, { signal: AbortSignal.timeout(8_000) });
} catch (error) {
  throw new Error(
    `Não foi possível acessar a API pelo endereço de rede ${readinessUrl.toString()}. ` +
      'Confirme se a API está iniciada, se a porta está liberada no firewall e se o computador está conectado à rede correta.',
    { cause: error },
  );
}

if (!response.ok) {
  throw new Error(`A API respondeu HTTP ${response.status} em ${readinessUrl.toString()}.`);
}

console.log('[Evolua Core] API acessível pelo endereço de rede local: OK.');
console.log(`[Evolua Core] No Android, abra no navegador: ${readinessUrl.toString()}`);
console.log('[Evolua Core] Se o navegador do aparelho não abrir essa URL, libere a porta da API no firewall e confirme que celular e computador estão na mesma rede Wi-Fi.');
