# B13: Reusing a point idempotency key throws an error

**Labels:** `bug`, `backend`, `points`, `high`

## Summary

The existing-transaction lookup and duplicate-key recovery were removed from `awardPoints`. A repeated award with the same idempotency key raises a duplicate-key error instead of returning the original transaction.

## Steps to reproduce

1. Call `awardPoints` with a fixed idempotency key.
2. Call it again with the same key and amount.

## Expected

The second call returns `duplicate: true`, the original transaction, and no balance change.

## Actual

The second call throws a MongoDB duplicate-key error.

## Affected area

`server/src/services/pointsService.js` - `awardPoints`.

## Acceptance criteria

- Existing keys are returned before insertion.
- Concurrent duplicate inserts are recovered safely.
- User totals change only once.
