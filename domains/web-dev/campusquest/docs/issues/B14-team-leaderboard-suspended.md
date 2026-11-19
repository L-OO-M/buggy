# B14: Suspended members contribute to team scores

**Labels:** `bug`, `backend`, `leaderboards`, `teams`, `medium`

## Summary

The team leaderboard scores every populated member, including suspended accounts. Suspended students therefore still raise their team's rank and member count.

## Steps to reproduce

1. Create an active team with an active member worth 25 points.
2. Add a suspended member worth 100 points.
3. Request `GET /api/leaderboards/teams`.

## Expected

The team score is 25 and the active member count is 1.

## Actual

The team score is 125 and the member count is 2.

## Affected area

`server/src/services/leaderboardService.js` - `teamLeaderboard`.

## Acceptance criteria

- Suspended members are excluded from score and member count.
- The preview member list only shows active members.
- A regression test covers a mixed team.
