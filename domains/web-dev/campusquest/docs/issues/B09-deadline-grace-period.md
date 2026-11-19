# B09: Submissions are accepted after the deadline

**Labels:** `bug`, `backend`, `submissions`, `high`

## Summary

The submission deadline check adds a twenty-four-hour grace period. Evidence can be submitted after the challenge deadline.

## Steps to reproduce

1. Create a challenge whose deadline was two hours ago.
2. Create an active participation for a student.
3. Submit evidence.

## Expected

`400` because the deadline has passed.

## Actual

The submission is created.

## Affected area

`server/src/controllers/submissionController.js` - `createSubmission`.

## Acceptance criteria

- The current time is compared directly with the deadline.
- Late submissions are rejected immediately.
- A regression test uses a deadline shortly in the past.
