# B02: Saving one profile preference resets the others

**Labels:** `bug`, `backend`, `profile`, `medium`

## Summary

The profile update endpoint replaces the entire preferences object. Updating the theme resets `emailReminders` (and any future preference keys) to their defaults.

## Steps to reproduce

1. Log in as a student whose preferences are the defaults.
2. Send `PATCH /api/users/me` with `{ "preferences": { "theme": "dark" } }`.
3. Inspect the returned user.

## Expected

`theme` becomes `dark` and `emailReminders` stays `true`.

## Actual

`emailReminders` falls back to its default because the stored object was replaced.

## Affected area

`server/src/controllers/usersController.js` - `updateProfile`.

## Acceptance criteria

- Preference updates merge with existing values.
- Unspecified keys are preserved.
- A regression test updates one preference and checks another.
