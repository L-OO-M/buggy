# CampusQuest Issue Quality Audit

Audit date: 2026-11-16

## Scope and method

This audit checks B01–B17 against the active challenge implementation. It does not change application code, issue files, or database state.

Inputs reviewed:

- `docs/issues/B01`–`B17`
- `docs/BUG_CATALOG.md`
- The affected controllers, services, models, routes, and validators
- `server/tests/api.test.js`
- `server/src/seed/seed.js`
- The clean snapshots under `docs/maintainer/baseline/`

Runtime evidence:

- Active server suite: 31 tests, 16 passed, 15 failed.
- The suite runs against `mongodb-memory-server`; no external database was required.
- Failure output directly demonstrates B01, B02, B03, B04, B05, B07, B08, B09, B10, B12, B13, B14, and B15.
- B06, B11, and B16 are not directly reached because earlier assertions in the same test fail first.
- B17's test aborts before the revocation assertion because B04 prevents the prerequisite badge from unlocking.
- Static code inspection confirms B06, B11, B16, and B17 defects, but their current tests do not independently prove the target behavior.

Status meanings used below:

- **VERIFIED** — the bug exists, the written steps work, and the description and acceptance criteria are accurate enough to hand to a participant.
- **PARTIALLY VERIFIED** — the bug exists, but reproduction, wording, or acceptance coverage has a material gap.
- **NOT VERIFIED** — the bug could not be shown to exist.
- **INCORRECT DESCRIPTION** — the stated cause or affected behavior is wrong.

## Status table

| Issue | Bug Exists? | Reproducible? | Description Correct? | Acceptance Criteria Complete? | Recommendation |
| --- | --- | --- | --- | --- | --- |
| B01 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; add the seeded Noah shortcut described below. |
| B02 | Yes | Yes | Partial | Yes | **PARTIALLY VERIFIED** — the other preference becomes missing/`undefined`, not reset to the default `true`; correct the actual-result wording. |
| B03 | Yes | Yes | Yes | Yes | **VERIFIED** — ready. |
| B04 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; note that it currently blocks B17's reproduction. |
| B05 | Yes | Yes | Yes | Yes | **VERIFIED** — ready. |
| B06 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; its assertion is currently unreachable because B07 fails earlier in the same test. |
| B07 | Yes | Yes | Yes | Yes | **VERIFIED** — ready. |
| B08 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; the test proves the persisted value after reload. Add a removal-path test. |
| B09 | Yes | Yes | Yes | Yes | **VERIFIED** — ready. |
| B10 | Yes | Yes | Yes | Partial | **PARTIALLY VERIFIED** — the bug and fix are clear, but the file claims expired-token tests continue to pass and no expired-token test exists; the forged-token assertion is also after other steps in one long test. |
| B11 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; the rank assertion is currently unreachable because B05 fails first. Add a team-tie test. |
| B12 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; add an explicit unrelated-organizer assertion. |
| B13 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; clarify that reproduction is service-level and add concurrent-call coverage. |
| B14 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; add a preview-member-list assertion. |
| B15 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; add a negative `skipSideEffects` test. |
| B16 | Yes | Yes | Yes | Yes | **VERIFIED** — ready; its assertion is currently unreachable because B03 fails earlier in the same test. |
| B17 | Yes | No, as written | Partial | Partial | **PARTIALLY VERIFIED** — the revocation bug is real, but the written sequence cannot produce a badge while B04 is active; add an independent prerequisite and update the actual-result statement. |

## Ready issues

The following issue statements can be used as-is, subject only to the test-isolation notes below:

- **B01** — approved team participations do not count toward `completed`.
- **B03** — default challenge listing includes expired published challenges.
- **B04** — equality does not unlock an achievement.
- **B05** — page two uses the wrong slice end.
- **B06** — approved submissions do not block replacement submissions.
- **B07** — approval awards `xpReward` instead of `rewardPoints`.
- **B08** — persisted `membersCount` is one below `members.length` after departure/removal.
- **B09** — submissions are accepted for 24 hours after the deadline.
- **B11** — equal scores receive different ranks.
- **B12** — club organizers cannot manage their club's events.
- **B13** — duplicate idempotency keys throw instead of returning the original transaction.
- **B14** — suspended members count toward team score and member count.
- **B15** — normal awards skip leaderboard broadcasts and internal awards run them.
- **B16** — one participant beyond `maxParticipants` can join.

B02, B10, and B17 need the wording or coverage corrections below before they should be considered fully ready.

## Documentation improvements

### B01

- Add the seeded shortcut: Noah is a Byte Brigade member, and Byte Brigade has an approved team challenge (`Campus Cleanup Sprint`). Noah therefore has one completed team participation but `GET /api/users/me/stats` reports `completed: 0`.
- Clarify that `joined` already includes team participations, so the visible mismatch is concentrated in `completed` and `percent`.

### B02

- Replace the actual-result sentence. The stored preference is not restored to its default; it is absent. The response currently exposes `preferences.emailReminders` as `undefined`.
- State that the expected contract is a merge that preserves existing keys, not merely a frontend fallback.

### B04

- Add a cross-reference that B04 currently prevents the achievement setup used by B17.
- Add a below-threshold assertion so the boundary is tested on both sides.

### B06

- Move the replacement-submission assertion into its own test. The current B07 failure occurs before the B06 assertion, so B06 is not currently demonstrated by the suite.
- State that the challenge must be published and still before its deadline.
- Add the allowed-resubmission case after a rejection; the current suite covers only `allowResubmission: false`.

### B08

- Point out that the immediate response may still show the correct count because it returns a stale in-memory document. The observable failure appears only after reloading from the database.
- Add a `removeMember` test as well as the existing leave test.

### B10

- Add an expired-token test. The issue says rotated and expired tests continue to pass, but no expiry test exists.
- Split the forged-signature assertion from the valid-check-in, duplicate-check-in, and rotation steps so a forged-token failure cannot hide the other assertions.
- State that the event must be published and check-in must be open.

### B11

- Split the rank assertion from B05. B05 currently fails before the tie-rank assertion runs.
- Add a team-leaderboard tie case because the acceptance criteria explicitly require both leaderboards to share the ranking behavior.

### B12

- Add a direct unrelated-organizer assertion. The club path is tested, but the unrelated-organizer rejection is only reachable after an earlier assertion in another test.
- Mention that admins and direct event organizers remain allowed.

### B13

- State clearly that reproduction requires calling the service directly or writing an integration test; there is no public endpoint that accepts a caller-supplied idempotency key.
- Add a concurrent duplicate-call test. The current test is sequential.
- Note that the original transaction must be returned with `duplicate: true` and no change to the user's totals.

### B14

- Add an assertion for the six-member preview list, not only the score and count.
- Consider an all-suspended or empty-active-member team as an additional edge case.

### B15

- Add a negative assertion that an award with `skipSideEffects: true` does not broadcast.
- Add an assertion that a normal award also runs achievement evaluation, since the inverted guard affects both side effects.

### B16

- Split the capacity assertion from B03. B03 currently fails before the `maxParticipants: 1` join check.
- Add a concurrent-join test if “participation count stays accurate under concurrency” is meant literally.
- State that the second request must come from a different student.

### B17

- Add an explicit prerequisite: an achievement badge must already exist for the recipient, or B04 must be fixed first. As written, approval at the exact threshold never unlocks the badge.
- Correct the actual result. In the active build, the written sequence produces no badge and no bonus to leave behind.
- Make the regression test independent of B04 by pre-creating the `UserAchievement`/bonus state or by including the achievement unlock setup that bypasses equality.
- Add team-recipient and multiple-approved-submission cases.

## Non-seeded issues

These issues are not directly demonstrated by the seeded state and need a new record, a role mutation, or service-level access:

- **B03** — the seed has a closed past-deadline challenge, but no published challenge with a past deadline; the default filter excludes closed challenges by status anyway.
- **B07** — seeded challenges set `xpReward` equal to `rewardPoints`, so the wrong field is invisible until a new challenge is created or a challenge is updated with a different XP value.
- **B09** — the seed's past-deadline challenge is closed, so submission is rejected by status before the deadline check; a published past-deadline challenge must be created.
- **B12** — every seeded event's organizer is also the organizer of its club, so the club-organizer/managing-organizer split must be created.
- **B13** — no seeded action reuses a caller-supplied idempotency key; this is a service/integration-level reproduction.
- **B14** — the seed contains no suspended team member; suspend a member through the admin API to expose it.
- **B15** — requires an attached Socket.IO server and a client observing `leaderboard:update`.
- **B16** — no seeded challenge is at capacity; create a one-seat challenge.
- **B17** — no seeded badge/achievement bonus state is available, and B04 prevents the described unlock sequence.

Related partial coverage:

- **B04** may be reproducible for a seeded user whose metric exactly equals a threshold, but the seed does not deliberately provide that fixture. Creating a threshold-equal achievement is more reliable.
- **B11** may show ties in seeded point totals, but the seed does not guarantee the issue's `30/20/20/10` fixture. Creating the scores is more reliable.

## Missing reproduction steps

- **B01** — identify the student, team, and team participation; state that the participation status is `approved`.
- **B03** — include the exact unparameterized `GET /api/challenges` request and state that both challenges are published.
- **B04** — identify the admin-only achievement creation route or provide the database setup; normal users cannot create an achievement through the API.
- **B06** — state that the challenge is published, has not passed its deadline, and that the first submission is approved.
- **B08** — give the leave/remove endpoints and explicitly require reloading the team from the database before checking `membersCount`.
- **B10** — include the event publication/check-in prerequisites, registration step, and the check-in-code endpoint.
- **B11** — explain how to set the four point totals; points cannot be set directly by a student.
- **B13** — provide a service-level script or test snippet; the issue does not identify an HTTP path for arbitrary idempotency keys.
- **B15** — specify how to attach the Socket.IO server and which event name to subscribe to.
- **B16** — state that the challenge is published and started and that the second join uses a different student.
- **B17** — state that the achievement badge must already exist or that B04 blocks the setup; otherwise the described sequence stops before revocation.

## Missing edge cases

- **B01** — mixed individual and team completions, percentage rounding, withdrawn participations, and multiple teams.
- **B02** — omitted preferences object, unknown preference keys, and reapplying the same value.
- **B03** — `open=false`, explicit `status=closed`/`draft`, category filters, and pagination metadata.
- **B04** — threshold `0`, values below threshold, and an already-owned achievement remaining idempotent.
- **B05** — pages beyond two, limits larger than the remaining rows, and the category/weekly variants that share the pagination code.
- **B06** — team submissions, rejection followed by allowed resubmission, revocation followed by resubmission, and duplicate rewards.
- **B07** — `xpReward: 0`, team recipient counts, partial award failure, and consistency between `pointsAwarded` and balances.
- **B08** — member removal by a leader, departure, multiple removals, and concurrent removals.
- **B09** — exact-deadline boundary, time zones, and the `24h` boundary after a fix.
- **B10** — expired tokens, malformed tokens, rotation after a valid check-in, same-length tampering in multiple positions, and closed check-in.
- **B11** — tied scores at the top, ties spanning a page boundary, and team-leaderboard ties.
- **B12** — unrelated organizer, admin access, direct organizer access, and a club organizer managing a different club's event.
- **B13** — concurrent duplicate calls, same key with a different amount/reason, and cleanup when the user does not exist.
- **B14** — all members suspended, preview list contents, and an active team with no populated members.
- **B15** — `skipSideEffects: true`, normal award with achievement evaluation, and no attached socket server.
- **B16** — concurrent joins, withdrawal followed by a rejoin, team-challenge capacity, and `maxParticipants: 1`.
- **B17** — team recipients, multiple approved submissions for one user, badges supported by another submission, and bonus-reversal idempotency.

## Corrected descriptions

### B02 — correct actual result

Current wording says the other preference resets to its default. The observed response instead omits the key:

> After saving only `preferences.theme`, the persisted preferences object contains `theme: "dark"` but no `emailReminders` key. The API response consequently exposes `preferences.emailReminders` as `undefined`, rather than restoring the schema default of `true`.

### B10 — correct acceptance wording

Current wording mentions expired-token tests that do not exist. Use:

> Signature validation must compare the full expected and supplied signatures in constant time. A forged token of the same length must return `400`. Rotation, expiry, malformed-token, and closed-check-in behavior must be covered by separate regression assertions.

### B17 — correct prerequisites and actual result

Current wording assumes the approval unlocks an achievement at the exact threshold, but B04 prevents that. Use:

> Precondition: the recipient already owns the qualifying achievement, for example because it was created before B04 was introduced or seeded directly. Approve and then revoke a submission. The challenge points are reversed, but the existing badge and its achievement bonus remain because reconciliation receives the submission id instead of the recipient user id.

### B08 — clarify observation point

Add to the actual result:

> The response returned immediately by the leave/remove endpoint can still report the correct `membersCount`; the defect is visible only after reloading the team document from MongoDB.

## Overall quality assessment

The issue set is strong overall. All seventeen defects are present, the affected files and functions are correct, and the cause statements match the active code aside from the B02 wording nuance and B17's cross-issue prerequisite. The issue files are consistently structured with summary, reproduction, expected/actual, affected area, and acceptance criteria.

The main weaknesses are test independence and cross-issue coupling:

- B03 and B16 share one test; B03 fails first.
- B05 and B11 share one test; B05 fails first.
- B07 and B06 share one test; B07 fails first.
- B04 prevents B17's prerequisite badge, so B17's regression test fails before revocation.
- B10 packs valid check-in, duplicate check-in, forged signature, rotation, and authorization into one test, so later assertions are hidden by the forged-signature failure.
- B08 correctly checks the persisted database value, which is the right pattern for this bug.
- B13's test is sequential only, while its acceptance criteria mention concurrency.
- B15 has no negative test for `skipSideEffects`.
- B08, B11, B12, B14, and B17 lack some of the edge cases their own acceptance criteria imply.

Recommended disposition:

1. Publish B01, B03–B09, B11–B16 as written after splitting the coupled tests noted above.
2. Correct B02's actual-result wording.
3. Add the expired-token assertion to B10 and split its assertions.
4. Rewrite B17's prerequisite and actual result, and make its test independent of B04.
5. Clarify that B13 is service-level and add a concurrent duplicate-call test.
