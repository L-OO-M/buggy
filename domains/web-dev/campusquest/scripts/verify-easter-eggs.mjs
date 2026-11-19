import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const checks = [
  {
    id: 'E01',
    file: 'server/src/services/leaderboardService.js',
    pattern: /\$sum: '\$challengeDoc\.rewardPoints'/,
    description: 'category leaderboard uses the current challenge reward',
  },
  {
    id: 'E02',
    file: 'server/src/controllers/teamController.js',
    pattern: /TeamInvitation\.updateMany\(\s*\{\s*team: team\._id,\s*status: 'pending'\s*\}/,
    description: 'leadership transfer cancels pending invitations',
  },
  {
    id: 'E03',
    file: 'server/src/middleware/auth.js',
    pattern: /req\.tokenPayload\?\.role \?\? req\.user\.role/,
    description: 'authorization trusts the token role first',
  },
  {
    id: 'E04',
    file: 'server/src/controllers/teamController.js',
    pattern: /\{ _id: team\._id, status: 'active' \},\s*\{ \$addToSet: \{ members: req\.user\._id \}/,
    description: 'invitation acceptance lacks the atomic capacity guard',
  },
];

let failed = false;

for (const check of checks) {
  const filePath = path.join(root, check.file);
  const source = fs.readFileSync(filePath, 'utf8');
  const present = check.pattern.test(source);
  console.log(`[verify:eggs] ${check.id} ${present ? 'present' : 'MISSING'} - ${check.description}`);
  if (!present) failed = true;
}

const privateDoc = path.join(root, 'docs', 'MAINTAINER_EASTER_EGGS.md');
if (!fs.existsSync(privateDoc)) {
  console.error('[verify:eggs] Missing private maintainer document.');
  failed = true;
}

if (failed) {
  console.error('\n[verify:eggs] Easter egg verification failed.');
  process.exit(1);
}

console.log('\n[verify:eggs] All maintainer-only easter eggs are present.');
