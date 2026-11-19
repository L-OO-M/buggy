import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const baselineRoot = path.join(root, 'docs', 'maintainer', 'baseline');

const files = [
  'server/src/services/challengeService.js',
  'server/src/controllers/usersController.js',
  'server/src/controllers/challengeController.js',
  'server/src/services/achievementService.js',
  'server/src/services/leaderboardService.js',
  'server/src/controllers/submissionController.js',
  'server/src/controllers/teamController.js',
  'server/src/services/teamService.js',
  'server/src/services/checkinService.js',
  'server/src/services/pointsService.js',
  'server/src/controllers/eventController.js',
];

const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'campusquest-baseline-'));

function copy(fromRoot, toRoot) {
  for (const file of files) {
    const source = path.join(fromRoot, file);
    const target = path.join(toRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function run(label, args) {
  console.log(`\n[verify:baseline] ${label}`);
  execFileSync('npm', args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
}

for (const file of files) {
  if (!fs.existsSync(path.join(baselineRoot, file))) {
    console.error(`[verify:baseline] Missing baseline snapshot for ${file}`);
    process.exit(1);
  }
}

try {
  copy(root, backupRoot);
  copy(baselineRoot, root);
  console.log('[verify:baseline] Restored clean baseline files.');
  run('Lint clean baseline', ['run', 'lint']);
  run('Run server integration tests', ['run', 'test', '-w', 'server']);
  run('Run client unit tests', ['run', 'test', '-w', 'client']);
  run('Build client', ['run', 'build']);
  console.log('\n[verify:baseline] Clean baseline passed.');
} catch (error) {
  console.error('\n[verify:baseline] Baseline verification failed.');
  process.exitCode = error.status || 1;
} finally {
  copy(backupRoot, root);
  fs.rmSync(backupRoot, { recursive: true, force: true });
  console.log('[verify:baseline] Restored active challenge files.');
}
