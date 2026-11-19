# B03: Expired challenges appear in the default catalog

**Labels:** `bug`, `backend`, `challenges`, `medium`

## Summary

The default challenge listing only applies the open-deadline filter when `open=true`. Requests without that parameter include challenges whose deadlines have already passed.

## Steps to reproduce

1. Create a published challenge whose deadline is in the past.
2. Create a published challenge with a future deadline.
3. Request `GET /api/challenges` without query parameters.

## Expected

Only the future challenge is returned.

## Actual

Both challenges are returned.

## Affected area

`server/src/controllers/challengeController.js` - `buildChallengeFilter`.

## Acceptance criteria

- The default listing is equivalent to `open=true`.
- Explicit closed/draft status queries still work.
- A regression test asserts expired challenges are absent.
