import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['--workspace', '@evolua/api', 'run', 'start:dev'],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
