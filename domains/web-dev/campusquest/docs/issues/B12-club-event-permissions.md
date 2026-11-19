# B12: Club organizers cannot manage their club's events

**Labels:** `bug`, `backend`, `permissions`, `events`, `high`

## Summary

Event management authorization only accepts the direct event organizer or an admin. A club organizer cannot manage an event hosted by a different organizer on behalf of their club.

## Steps to reproduce

1. Create an approved club organized by user B.
2. Create a published event owned by organizer A with that club attached.
3. Request `GET /api/events/:id/checkin-code` as B.

## Expected

The club organizer receives the check-in code.

## Actual

`403 Only the event organizer can manage this event`.

## Affected area

`server/src/controllers/eventController.js` - `assertEventManager`.

## Acceptance criteria

- Admins, direct event organizers, and the club organizer can manage the event.
- Unrelated organizers are rejected.
- A regression test covers the club organizer path.
