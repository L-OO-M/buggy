# B10: Forged check-in signatures are accepted

**Labels:** `bug`, `backend`, `security`, `check-in`, `critical`

## Summary

Check-in token validation compares signature lengths but not signature contents. A forged signature with the same length as the expected HMAC is accepted.

## Steps to reproduce

1. Register a student for a published event.
2. Generate a valid check-in token as the organizer.
3. Change the final signature character without changing the token length.
4. Submit the forged token to `POST /api/attendance/checkin`.

## Expected

`400` for an invalid signature.

## Actual

Check-in succeeds and points are awarded.

## Affected area

`server/src/services/checkinService.js` - `checkInWithToken`.

## Acceptance criteria

- Signature validation uses a timing-safe content comparison.
- Forged tokens of equal length are rejected.
- Rotated and expired token tests continue to pass.
