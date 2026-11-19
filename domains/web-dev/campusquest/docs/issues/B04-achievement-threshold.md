# B04: Achievements do not unlock at the exact threshold

**Labels:** `bug`, `backend`, `achievements`, `medium`

## Summary

Achievement evaluation skips values equal to the threshold. A ten-point achievement remains locked at exactly ten points.

## Steps to reproduce

1. Create a user with `points: 10`.
2. Create an active achievement with `criteriaType: "points"` and `threshold: 10`.
3. Request `POST /api/achievements/recheck`.

## Expected

The achievement unlocks.

## Actual

No achievement is returned and the user remains locked.

## Affected area

`server/src/services/achievementService.js` - `evaluateAchievements`.

## Acceptance criteria

- `value >= threshold` unlocks.
- Values below the threshold stay locked.
- A regression test covers equality.
