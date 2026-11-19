# B15: Normal point awards do not broadcast leaderboard updates

**Labels:** `bug`, `backend`, `realtime`, `leaderboards`, `medium`

## Summary

The side-effect guard in `awardPoints` is inverted. Normal awards skip achievement evaluation and leaderboard broadcasts, while internal `skipSideEffects` awards perform them.

## Steps to reproduce

1. Attach a Socket.IO server with a client subscribed to `leaderboard`.
2. Award points without setting `skipSideEffects`.
3. Observe socket events.

## Expected

A `leaderboard:update` event is emitted with refreshed individual and team entries.

## Actual

No broadcast occurs.

## Affected area

`server/src/services/pointsService.js` - `awardPoints`.

## Acceptance criteria

- Normal awards run achievements and broadcast the snapshot.
- Internal awards with `skipSideEffects` do not.
- A socket-backed regression test verifies the event.
