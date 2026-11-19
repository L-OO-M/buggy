# CampusQuest API

Base URL: `http://localhost:5000/api`

All successful responses use:

```json
{ "success": true, "data": {}, "meta": {} }
```

Errors use:

```json
{ "success": false, "error": { "message": "Text", "details": [] } }
```

Authenticated requests send `Authorization: Bearer <token>`.

## Authentication

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register as student or organizer and receive a token. |
| POST | `/auth/login` | Public | Log in, update streak metadata, and receive a token. |
| GET | `/auth/me` | Authenticated | Return the current user. |
| POST | `/auth/logout` | Authenticated | Confirm client-side sign-out. |

## Users

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/users/me/stats` | Authenticated | Dashboard counters, points, level progress, rank, and challenge progress. |
| GET | `/users/me/points` | Authenticated | Paginated point transaction history. |
| GET | `/users/me/submissions` | Authenticated | Submissions created by the current user. |
| PATCH | `/users/me` | Authenticated | Update profile fields and preferences. |
| GET | `/users/:id` | Public | Public profile with achievements, clubs, teams, and rank. |

## Clubs

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/clubs` | Public | Paginated approved clubs; supports `q`, `category`, `mine`. |
| GET | `/clubs/mine` | Authenticated | Approved club memberships for the current user. |
| POST | `/clubs` | Organizer/Admin | Create a club (pending unless created by an admin). |
| GET | `/clubs/:slug` | Public | Club by slug or id, with members, events, challenges, and membership state. |
| PATCH | `/clubs/:id` | Club organizer/Admin | Update club details. |
| POST | `/clubs/:id/join` | Authenticated | Request membership. |
| DELETE | `/clubs/:id/leave` | Authenticated | Leave an approved club. |
| GET | `/clubs/:id/requests` | Club organizer/Admin | Pending membership requests. |
| PATCH | `/clubs/:id/requests/:userId` | Club organizer/Admin | Approve or reject a request. |
| GET | `/clubs/:id/members` | Authenticated | Approved club members. |
| GET | `/clubs/:id/activity` | Public | Recent club activity. |
| POST | `/clubs/:id/archive` | Club organizer/Admin | Archive a club. |

## Events and registrations

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/events` | Public | Paginated published events; `mine=true` returns organizer events. |
| GET | `/events/mine/registrations` | Authenticated | Current user's registrations. |
| POST | `/events` | Organizer/Admin | Create a draft or published event. |
| GET | `/events/:id` | Public | Event details with the caller's registration and attendance. |
| PATCH | `/events/:id` | Event/club organizer/Admin | Update an event. |
| POST | `/events/:id/cancel` | Event/club organizer/Admin | Cancel an event and notify registrants. |
| GET | `/events/:id/participants` | Event/club organizer/Admin | Participants and attendance. |
| GET | `/events/:id/checkin-code` | Event/club organizer/Admin | Generate a signed check-in token and URL. |
| POST | `/events/:id/checkin-code/rotate` | Event/club organizer/Admin | Rotate the check-in version and return a new token. |
| PATCH | `/events/:id/checkin-settings` | Event/club organizer/Admin | Open or close check-in. |
| POST | `/events/:id/checkin/manual` | Event/club organizer/Admin | Check in a registered student by email or id. |
| POST | `/registrations/:id` | Authenticated | Register for an event. |
| DELETE | `/registrations/:id` | Authenticated | Cancel a registration. |
| GET | `/registrations/me` | Authenticated | List current registrations. |
| POST | `/attendance/checkin` | Authenticated | Check in with a signed QR token. |
| POST | `/attendance/events/:id/manual` | Event/club organizer/Admin | Manual attendance alias. |

## Teams

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/teams/mine` | Authenticated | Teams containing the current user. |
| POST | `/teams` | Authenticated | Create a team; the creator becomes leader. |
| GET | `/teams/invitations` | Authenticated | Pending invitations for the current user. |
| PATCH | `/teams/invitations/:id/respond` | Invitee | Accept or reject an invitation. |
| DELETE | `/teams/invitations/:id` | Team leader/Admin | Cancel an invitation. |
| GET | `/teams/:id` | Authenticated | Team details, invitations, participations, and score. |
| GET | `/teams/:id/progress` | Authenticated | Challenge progress and aggregate score. |
| POST | `/teams/:id/invite` | Team leader | Invite by email or user id. |
| DELETE | `/teams/:id/members/:userId` | Team leader/Admin | Remove a member. |
| POST | `/teams/:id/leave` | Member | Leave a team. |
| POST | `/teams/:id/transfer` | Team leader | Transfer leadership to a member. |
| POST | `/teams/:id/archive` | Team leader/Admin | Archive a team and cancel pending invitations. |

## Challenges

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/challenges` | Public | Challenge catalog; supports filters and `mine=true`. |
| GET | `/challenges/mine/participations` | Authenticated | Current user's and teams' participations. |
| POST | `/challenges` | Organizer/Admin | Create a draft or published challenge. |
| GET | `/challenges/:id` | Public | Details, participation, submissions, team, and approved count. |
| PATCH | `/challenges/:id` | Challenge/club organizer/Admin | Update a challenge. |
| POST | `/challenges/:id/close` | Challenge/club organizer/Admin | Close a challenge and notify participants. |
| POST | `/challenges/:id/join` | Authenticated | Join as an individual or with the caller's active team. |
| GET | `/challenges/:id/participants` | Challenge/club organizer/Admin | Participants with submission counts. |

## Submissions

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/submissions` | Authenticated | Submit evidence for a joined challenge. |
| GET | `/submissions/mine` | Authenticated | Current user's and team submissions. |
| GET | `/submissions/review-queue` | Organizer/Admin | Submissions awaiting or matching review status. |
| GET | `/submissions/:id` | Owner/team/Organizer/Admin | Submission detail. |
| PATCH | `/submissions/:id/review` | Challenge/club organizer/Admin | Approve or reject pending evidence. |
| POST | `/submissions/:id/revoke` | Challenge/club organizer/Admin | Revoke an approval, reverse points, and reconcile achievements. |

## Leaderboards and achievements

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/leaderboards/individual` | Public | Global, weekly, monthly, or category rankings. |
| GET | `/leaderboards/teams` | Public | Active team rankings. |
| GET | `/leaderboards/me` | Authenticated | Current user's global rank. |
| GET | `/achievements` | Authenticated | Achievement catalog with progress. |
| GET | `/achievements/me` | Authenticated | Unlocked achievements. |
| POST | `/achievements/recheck` | Authenticated | Re-evaluate achievement criteria. |

## Notifications

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | Authenticated | Paginated notifications; supports `unread` and `type`. |
| GET | `/notifications/unread-count` | Authenticated | Unread count. |
| PATCH | `/notifications/read-all` | Authenticated | Mark all notifications read. |
| PATCH | `/notifications/:id/read` | Authenticated | Mark one notification read. |
| DELETE | `/notifications/:id` | Authenticated | Delete one notification. |
| POST | `/notifications/announcements` | Organizer/Admin | Send an announcement to all, students, or a club. |
| POST | `/notifications/broadcast` | Admin | Broadcast a system announcement. |

## Reports

| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/reports` | Authenticated | Report an event, challenge, user, submission, or club. |
| GET | `/reports/mine` | Authenticated | Reports created by the current user. |
| GET | `/reports` | Admin | All reports. |
| PATCH | `/reports/:id` | Admin | Update report status and resolution note. |

## Administration

All admin routes require the `admin` role.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/stats` | Platform counters. |
| GET | `/admin/users` | Paginated users. |
| PATCH | `/admin/users/:id` | Change role or suspension state. |
| GET | `/admin/clubs` | All clubs. |
| PATCH | `/admin/clubs/:id` | Approve or reject a club. |
| GET | `/admin/events` | All events. |
| PATCH | `/admin/events/:id` | Moderate an event. |
| GET | `/admin/challenges` | All challenges. |
| PATCH | `/admin/challenges/:id` | Moderate a challenge. |
| GET | `/admin/submissions` | All submissions. |
| GET | `/admin/achievements` | Achievement definitions. |
| POST | `/admin/achievements` | Create or update an achievement. |
| GET | `/admin/points` | Point transactions. |
| POST | `/admin/points/adjust` | Apply an idempotent manual point adjustment. |
| GET | `/admin/reports` | Reports. |
| PATCH | `/admin/reports/:id` | Resolve a report. |
| POST | `/admin/broadcast` | Broadcast to all active users. |

## Health

`GET /api/health` returns service status and the current server time.
