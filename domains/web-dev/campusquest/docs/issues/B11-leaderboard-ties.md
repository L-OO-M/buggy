# B11: Tied leaderboard scores receive different ranks

**Labels:** `bug`, `backend`, `leaderboards`, `medium`

## Summary

Ranks are assigned from the array index. Two users with the same score receive different ranks instead of sharing a competition rank.

## Steps to reproduce

1. Create users with scores `30`, `20`, `20`, and `10`.
2. Request the individual leaderboard.

## Expected

Ranks are `1, 2, 2, 4`.

## Actual

Ranks are `1, 2, 3, 4`.

## Affected area

`server/src/services/leaderboardService.js` - `attachRanks`.

## Acceptance criteria

- Equal scores share a rank.
- The next distinct score skips the tied positions.
- Individual and team leaderboards both use the helper.
