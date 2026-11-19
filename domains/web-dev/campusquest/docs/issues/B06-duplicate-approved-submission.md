# B06: Approved submissions can be submitted again

**Labels:** `bug`, `backend`, `submissions`, `high`

## Summary

The duplicate-submission guard only treats pending submissions as active. After an approval, the same participation can create another submission, which can lead to duplicate rewards.

## Steps to reproduce

1. Join an individual challenge and submit evidence.
2. Approve the submission as the organizer.
3. Submit again for the same challenge.

## Expected

`409 Conflict` because an approved submission already exists.

## Actual

A second submission is created.

## Affected area

`server/src/controllers/submissionController.js` - `createSubmission`.

## Acceptance criteria

- Pending and approved submissions both block new attempts.
- Rejected submissions remain resubmittable when the challenge allows it.
- A regression test submits after approval and expects a conflict.
