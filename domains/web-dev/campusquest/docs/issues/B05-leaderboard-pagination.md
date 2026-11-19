# B05: Second leaderboard page is empty

**Labels:** `bug`, `backend`, `leaderboards`, `medium`

## Summary

Individual leaderboard pagination uses `limit` as the slice end instead of `skip + limit`. Requesting page two returns an empty or truncated list.

## Steps to reproduce

1. Create at least four users with distinct point totals.
2. Request `GET /api/leaderboards/individual?page=1&limit=2`.
3. Request `GET /api/leaderboards/individual?page=2&limit=2`.

## Expected

Page two contains the next two ranked users.

## Actual

Page two is empty.

## Affected area

`server/src/services/leaderboardService.js` - `individualLeaderboard`.

## Acceptance criteria

- Slicing uses `skip` and `skip + limit`.
- Ranks are assigned before pagination.
- A regression test verifies page two contents.
