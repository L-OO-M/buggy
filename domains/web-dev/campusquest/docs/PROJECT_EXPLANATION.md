# CampusQuest Project Explanation

CampusQuest is a MERN application for gamified campus events, clubs, teams, and challenges. Students register for events, check in with QR codes, join clubs and teams, submit challenge evidence, earn points and achievements, and compete on leaderboards. Organizers manage events, attendance, clubs, challenges, and submissions. Administrators moderate the platform, manage users, clubs, events, challenges, reports, rewards, and announcements.

## Stack

- **Client:** React 18, Vite 6, React Router, Tailwind CSS 3, Lucide icons, Axios, Socket.IO client.
- **Server:** Node.js, Express 4, Mongoose 8, JSON Web Tokens, bcryptjs, Zod, Socket.IO, Multer.
- **Testing:** Vitest, Supertest, React Testing Library, and `mongodb-memory-server` for integration tests without a local MongoDB installation.

## Repository layout

```text
client/
  src/api/            Axios client and typed endpoint helpers
  src/components/     Shared UI, layouts, route guards, notification bell
  src/context/        Auth, theme, toast, and socket providers
  src/pages/          Public, student, organizer, and admin screens
  src/utils/          Formatting and shared constants
server/
  src/config/         Environment, database, and domain constants
  src/controllers/    HTTP handlers
  src/middleware/     Authentication, validation, error handling
  src/models/         Mongoose schemas and indexes
  src/routes/         Express routers
  src/services/       Points, achievements, leaderboards, teams, check-in, challenges
  src/sockets/        Socket.IO registration and emitters
  src/seed/           Demo data seeder
  tests/              Integration tests and in-memory MongoDB setup
docs/
  maintainer/         Private baseline snapshots and easter egg documentation
  issues/             Issue-ready Markdown for B01-B17
scripts/              Baseline and easter egg verification
```

## Main flows

1. **Authentication:** Registration and login issue JWTs. Protected server routes resolve the user from the database on every request and enforce roles. The client stores the session, redirects by role, and rebuilds socket connections after login.
2. **Events:** Organizers create drafts or published events, optionally for an approved club. Students register until capacity is reached. Organizers issue signed, expiring, rotatable QR tokens; students check in once and receive event points. Organizers can also mark attendance manually.
3. **Clubs:** Organizers create clubs, which need admin approval before appearing publicly. Students request membership; organizers approve or reject. Member counts and points stay in sync with memberships.
4. **Teams:** Students create teams, invite classmates, accept or reject invitations, transfer leadership, remove members, leave, or archive. Team size is enforced during invitation and acceptance.
5. **Challenges:** Organizers publish individual or team challenges with deadlines, capacity, rewards, and resubmission rules. Students join before submitting evidence. Organizers review pending evidence, approve or reject it, and can revoke approvals.
6. **Points:** Every point change is stored as a `PointTransaction` with an idempotency key. User totals, levels, achievements, and leaderboard broadcasts follow successful awards.
7. **Achievements:** Criteria cover points, completed challenges, attendance, club membership, teams created, and streaks. Unlocks grant bonus points and notifications; reconciliation removes badges when criteria regress.
8. **Leaderboards:** Global, weekly, monthly, category, and team views use competition ranking for ties. Team scores aggregate active members only.
9. **Notifications:** In-app notifications cover registrations, invitations, submission decisions, achievements, and announcements. Socket events update the bell in real time.
10. **Administration:** Admins manage users, moderate clubs/events/challenges, review reports, inspect submissions, broadcast announcements, and adjust points.

## Data model

Core collections: `User`, `Club`, `ClubMembership`, `Event`, `EventRegistration`, `Attendance`, `Team`, `TeamInvitation`, `Challenge`, `ChallengeParticipation`, `Submission`, `PointTransaction`, `Achievement`, `UserAchievement`, `Notification`, and `Report`.

Important uniqueness constraints:

- User email, club name/slug, team invite code, and point idempotency keys are unique.
- Event registration is unique per event and student.
- Club membership is unique per club and student.
- Challenge participation uses a participant key for individuals or teams.
- Pending team invitations are unique per team and invitee.
- User achievements are unique per student and achievement.

## Local setup

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:5000`. Seeding requires a reachable MongoDB instance. Integration tests do not.

Demo password: `CampusQuest123!`

| Role | Email |
| --- | --- |
| Admin | `admin@campusquest.dev` |
| Organizer | `maya@campusquest.dev` |
| Student | `jordan@campusquest.dev` |
| Student | `ava@campusquest.dev` |
| Student | `noah@campusquest.dev` |

## Verification

```bash
npm run lint
npm run test -w server
npm run build
npm run verify:baseline
```

`npm test` runs both workspaces. The server suite downloads/caches a MongoDB binary on first use; subsequent runs reuse it. The active challenge build intentionally fails a subset of server tests. Use `npm run verify:baseline` to prove that the clean implementation passes all checks.

## Known operational notes

- Manual seeding and live development require MongoDB. A Docker container is sufficient.
- GitHub CLI is not available in this environment, so bug issues are prepared as Markdown files under `docs/issues/`.
- The Vite production build reports a chunk-size warning; functionality is unaffected.
- Socket broadcasts are best-effort and intentionally no-op when a Socket.IO server is not attached.
