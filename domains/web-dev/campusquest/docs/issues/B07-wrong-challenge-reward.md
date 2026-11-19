# B07: Challenge approval awards the XP field as points

**Labels:** `bug`, `backend`, `rewards`, `high`

## Summary

Submission approval awards `challenge.xpReward` to each recipient instead of `challenge.rewardPoints`. The submission and participation records still report the configured reward, so the user interface and balance disagree.

## Steps to reproduce

1. Create a challenge with `rewardPoints: 20` and leave `xpReward` at its default.
2. Join, submit, and approve the submission.
3. Check the participant's point balance.

## Expected

The participant gains twenty points.

## Actual

The participant gains the XP reward amount (fifty by default).

## Affected area

`server/src/controllers/submissionController.js` - `reviewSubmission`.

## Acceptance criteria

- Point awards use `rewardPoints`.
- `pointsAwarded` and the actual balance agree.
- Individual and team reward tests pass.
