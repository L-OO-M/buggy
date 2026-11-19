# B17: Revoking an approval leaves achievements and bonus points behind

**Labels:** `bug`, `backend`, `achievements`, `submissions`, `high`

## Summary

When an approval is revoked, achievement reconciliation receives the submission id instead of each recipient's user id. The reconciliation returns no results, so unlocked badges and achievement bonus points remain.

## Steps to reproduce

1. Create a challenge achievement with a bonus.
2. Join a challenge, submit evidence, and approve it so the achievement unlocks.
3. Revoke the approval.

## Expected

The challenge reward and achievement bonus are reversed, and the achievement is removed because the user no longer qualifies.

## Actual

The challenge reward is reversed, but the badge and bonus remain.

## Affected area

`server/src/controllers/submissionController.js` - `revokeSubmission`.

## Acceptance criteria

- Reconciliation runs for every reward recipient's user id.
- Badges that no longer meet their criteria are removed.
- Achievement bonus points are reversed.
- A regression test checks both points and `UserAchievement`.
