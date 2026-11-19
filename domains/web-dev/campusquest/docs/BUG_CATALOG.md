# CampusQuest Bug Catalog

This catalog describes the seventeen intentional defects in the active challenge build. The clean implementation is stored under `docs/maintainer/baseline/` and can be restored temporarily with `npm run verify:baseline`.

All server tests live in `server/tests/api.test.js` and run against an in-memory MongoDB instance.

| ID | Area | Primary location | Symptom |
| --- | --- | --- | --- |
| B01 | Challenge progress | `server/src/services/challengeService.js` | Approved team challenges never count toward a student's completed progress. |
| B02 | Profile preferences | `server/src/controllers/usersController.js` | Updating one preference silently resets the others. |
| B03 | Challenge listing | `server/src/controllers/challengeController.js` | The default catalog includes challenges whose deadlines have passed. |
| B04 | Achievements | `server/src/services/achievementService.js` | An achievement does not unlock when the metric exactly matches its threshold. |
| B05 | Leaderboard pagination | `server/src/services/leaderboardService.js` | Page two of the individual leaderboard is empty or truncated. |
| B06 | Submission rules | `server/src/controllers/submissionController.js` | A student can submit replacement evidence after an approval. |
| B07 | Challenge rewards | `server/src/controllers/submissionController.js` | Approved challenges award the XP reward as points instead of the configured point reward. |
| B08 | Team membership | `server/src/services/teamService.js` | `membersCount` drops one below the real member list after a removal or departure. |
| B09 | Submission deadline | `server/src/controllers/submissionController.js` | Evidence is still accepted during a twenty-four-hour grace period after the deadline. |
| B10 | QR check-in | `server/src/services/checkinService.js` | A forged QR signature of the same length as the real signature is accepted. |
| B11 | Leaderboard ties | `server/src/services/leaderboardService.js` | Equal scores receive different ranks. |
| B12 | Event permissions | `server/src/controllers/eventController.js` | Club organizers cannot manage events hosted by their own club. |
| B13 | Point idempotency | `server/src/services/pointsService.js` | Reusing an idempotency key throws a duplicate-key error instead of returning the original transaction. |
| B14 | Team leaderboard | `server/src/services/leaderboardService.js` | Suspended members' points are included in active team totals. |
| B15 | Realtime leaderboard | `server/src/services/pointsService.js` | Normal point awards no longer broadcast a leaderboard snapshot. |
| B16 | Challenge capacity | `server/src/services/challengeService.js` | A challenge accepts one participant beyond `maxParticipants`. |
| B17 | Approval revocation | `server/src/controllers/submissionController.js` | Revoking an approval leaves the achievement badge and its bonus points in place. |

## B01 - Team challenge progress is under-reported

- **Function:** `approvedProgressForUser`
- **Cause:** The completed query only matches `user: user._id`; the team participation branch is missing.
- **Reproduction:** Create a team, accept an approved team-challenge participation, then open the student dashboard. `completed` remains `0`.
- **Expected:** Approved individual and team participations both count.
- **Test:** `reports team challenge progress in stats`

## B02 - Profile preferences are overwritten

- **Function:** `updateProfile`
- **Cause:** The incoming `preferences` object replaces the stored object instead of merging into it.
- **Reproduction:** Save only `preferences.theme`; `preferences.emailReminders` returns to its default.
- **Expected:** Unspecified preference keys keep their current values.
- **Test:** `updates the authenticated profile`

## B03 - Expired challenges appear by default

- **Function:** `buildChallengeFilter`
- **Cause:** The deadline filter only runs when `open=true`; the default path omits it.
- **Reproduction:** Create a published challenge with a past deadline and request `GET /api/challenges`.
- **Expected:** The default listing only returns challenges whose deadline is in the future.
- **Test:** `filters open challenges and rejects joining closed or full challenges`

## B04 - Achievement threshold is off by one

- **Function:** `evaluateAchievements`
- **Cause:** The comparison uses `value <= threshold`, so equality never unlocks.
- **Reproduction:** Create a ten-point achievement and call recheck with exactly ten points.
- **Expected:** A metric equal to the threshold unlocks the achievement.
- **Test:** `unlocks an achievement when the metric equals its threshold`

## B05 - Leaderboard pagination uses the wrong end index

- **Function:** `individualLeaderboard`
- **Cause:** The slice uses `limit` as the end index rather than `skip + limit`.
- **Reproduction:** Request page two with `limit=2`; the response is empty.
- **Expected:** Page two contains the next two ranked rows.
- **Test:** `ranks tied scores equally and paginates after ranking`

## B06 - Approved submissions can be duplicated

- **Function:** `createSubmission`
- **Cause:** The active-submission check only looks for `pending` entries.
- **Reproduction:** Submit evidence, approve it, then submit again with the same participation.
- **Expected:** A conflict response because an approved submission already exists.
- **Test:** `awards challenge points, updates participation, and enforces single review`

## B07 - Challenge rewards use the XP amount

- **Function:** `reviewSubmission`
- **Cause:** Points are awarded with `challenge.xpReward` rather than `challenge.rewardPoints`.
- **Reproduction:** Create a challenge with `rewardPoints: 20` and the default XP reward; approve it.
- **Expected:** The participant receives twenty points.
- **Test:** `awards challenge points, updates participation, and enforces single review`

## B08 - Team member count is off by one

- **Function:** `refreshTeamMemberCount`
- **Cause:** The helper subtracts one from `team.members.length`.
- **Reproduction:** Remove a member from a two-person team and reload the team from the database.
- **Expected:** `membersCount` equals the stored member array length.
- **Test:** `prevents invitations beyond team capacity and updates counts on leave`

## B09 - Deadline has a hidden grace period

- **Function:** `createSubmission`
- **Cause:** The deadline comparison adds twenty-four hours before rejecting.
- **Reproduction:** Create evidence two hours after the deadline with an existing participation.
- **Expected:** Rejection as soon as the deadline passes.
- **Test:** `rejects submissions shortly after the deadline even with a joined participation`

## B10 - Check-in signature validation checks length only

- **Function:** `checkInWithToken`
- **Cause:** The timing-safe comparison was replaced by a length comparison.
- **Reproduction:** Tamper with the final character of a valid token without changing its length.
- **Expected:** `400` for an invalid signature.
- **Test:** `checks in with a valid token, awards points once, and rejects rotated codes`

## B11 - Ties receive different ranks

- **Function:** `attachRanks`
- **Cause:** Ranks are assigned from the row index instead of competition ranking.
- **Reproduction:** Load a leaderboard containing two equal scores.
- **Expected:** Equal scores share a rank; the next score skips the tied positions.
- **Test:** `ranks tied scores equally and paginates after ranking`

## B12 - Club organizers lose event management access

- **Function:** `assertEventManager`
- **Cause:** The club-organizer branch was removed; only the event organizer and admins pass.
- **Reproduction:** Create an event owned by organizer A for a club organized by B; request its check-in code as B.
- **Expected:** B can manage the event.
- **Test:** `lets club organizers manage events hosted by their club`

## B13 - Duplicate point keys raise errors

- **Function:** `awardPoints`
- **Cause:** The existing-key lookup and duplicate-key recovery were removed.
- **Reproduction:** Call `awardPoints` twice with the same idempotency key.
- **Expected:** The second call returns `duplicate: true` and does not change the balance.
- **Test:** `keeps point awards idempotent for repeated keys`

## B14 - Suspended members count toward team scores

- **Function:** `teamLeaderboard`
- **Cause:** The suspended-member filter was removed from the member list used for scoring.
- **Reproduction:** Put a suspended member with points on an active team.
- **Expected:** Only active members contribute to the team score and member count.
- **Test:** `sums active team member points and excludes suspended members`

## B15 - Leaderboard broadcasts are inverted

- **Function:** `awardPoints`
- **Cause:** Side effects now run only when `skipSideEffects` is true.
- **Reproduction:** Connect a socket client and award points without skip flags.
- **Expected:** A `leaderboard:update` event is emitted.
- **Test:** `broadcasts a leaderboard snapshot after a normal point award`

## B16 - Challenge capacity allows one extra participant

- **Function:** `joinChallenge`
- **Cause:** The atomic claim uses `$lte` instead of `$lt`.
- **Reproduction:** Create a one-seat challenge and let two students join.
- **Expected:** The second join returns `409`.
- **Test:** `filters open challenges and rejects joining closed or full challenges`

## B17 - Revocation does not reconcile achievements

- **Function:** `revokeSubmission`
- **Cause:** The reconciliation call receives the submission id instead of each recipient's user id.
- **Reproduction:** Approve evidence that unlocks a challenge achievement, then revoke it.
- **Expected:** The badge is removed and its bonus points are reversed.
- **Test:** `unlocks achievements and reverses bonus points when approvals are revoked`

## Verification workflow

```bash
npm run verify:baseline   # restores clean files, runs lint + tests + build, then restores challenge files
npm test                  # expected to fail while the challenge defects are active
npm run verify:eggs       # confirms the maintainer-only easter eggs are still present
```

Baseline copies must stay in sync with documented fixes. When correcting a defect, update its baseline copy as well if the challenge is expected to remain reproducible.
