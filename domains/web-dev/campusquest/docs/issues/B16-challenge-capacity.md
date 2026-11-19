# B16: Challenge capacity accepts one extra participant

**Labels:** `bug`, `backend`, `challenges`, `high`

## Summary

The atomic participation claim uses `$lte` instead of `$lt`. When `participationCount` equals `maxParticipants`, one more student can still join.

## Steps to reproduce

1. Create a published challenge with `maxParticipants: 1`.
2. Join as the first student.
3. Join as a second student.

## Expected

The second join returns `409 This challenge is full`.

## Actual

The second join succeeds and the count becomes two.

## Affected area

`server/src/services/challengeService.js` - `joinChallenge`.

## Acceptance criteria

- The claim uses a strict less-than capacity comparison.
- Only one join succeeds for a one-seat challenge.
- The participation count stays accurate under concurrency.
