# B08: Team member counts drop below the real member list

**Labels:** `bug`, `backend`, `teams`, `medium`

## Summary

`refreshTeamMemberCount` subtracts one from the member array length. After a member leaves or is removed, the persisted `membersCount` is one lower than the actual members.

## Steps to reproduce

1. Create a team with a leader and one member.
2. Remove the member or have them leave.
3. Reload the team from the database.

## Expected

`membersCount` equals `members.length`.

## Actual

`membersCount` is zero while the leader is still a member.

## Affected area

`server/src/services/teamService.js` - `refreshTeamMemberCount`.

## Acceptance criteria

- The count equals the member array length.
- Removal and departure flows persist the corrected count.
- A regression test checks the database value, not only the response.
