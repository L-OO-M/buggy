# B01: Approved team challenges are missing from student progress

**Labels:** `bug`, `backend`, `challenges`, `medium`

## Summary

`approvedProgressForUser` counts approved team participations in the joined total but not in the completed total. A student who completes a team challenge sees `0` completed and `0%` progress.

## Steps to reproduce

1. Create a student and a team led by that student.
2. Create an approved team challenge participation for the team.
3. Request `GET /api/users/me/stats` as the student.

## Expected

`challengeProgress` is `{ joined: 1, completed: 1, percent: 100 }`.

## Actual

`completed` is `0` and `percent` is `0`.

## Affected area

`server/src/services/challengeService.js` - `approvedProgressForUser`.

## Acceptance criteria

- Approved individual and team participations both count toward completion.
- The percentage is `completed / joined`.
- A regression test covers team progress.
