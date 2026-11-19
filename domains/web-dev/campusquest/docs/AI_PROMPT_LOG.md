# AI Prompt Log

This log records the major prompts and checkpoints used while building CampusQuest. Early entries are reconstructed from the session summary and repository state.

## 2026-11-16 - Foundation

**Prompt:** Build a complete CampusQuest MERN application in `domains/web-dev/campusquest/` using React, Vite, Tailwind, Express, MongoDB, JWT, Socket.IO, Zod, and Vitest. Include public, student, organizer, and admin experiences, seed data, tests, documentation, and a planned set of intentional bugs and hidden easter eggs.

**Work completed:**

- Read repository guidance and CI scope rules.
- Scaffolded npm workspaces for `server` and `client`.
- Implemented configuration, models, middleware, services, controllers, routes, sockets, and seed data.
- Implemented the design system, API client, contexts, layouts, route guards, and shared components.
- Built the public, student, organizer, and admin page sets.
- Added ESLint configuration and fixed import/export issues.

## 2026-11-16 - Build stabilization

**Prompt:** Finish the remaining screens and make the workspace lint and build cleanly.

**Work completed:**

- Completed dashboards, management screens, forms, review queues, attendance desk, and admin moderation pages.
- Added the not-found screen and corrected layout/error-boundary imports.
- Fixed landing-page relative imports.
- Added `eslint-plugin-react` and enabled JSX variable tracking.
- Removed unused imports and variables.
- Confirmed a production client build.

## 2026-11-16 - Status checkpoint

**Prompt:** What did we do so far?

**Work completed:**

- Summarized the objective, constraints, tooling, completed features, outstanding tests, and known limitations.
- Identified that server tests and documentation were the next major gap.

## 2026-11-16 - Baseline tests and cleanup

**Prompt:** Continue with the next steps.

**Work completed:**

- Removed stale lint directives and unused helpers.
- Added `server/vitest.config.js`, in-memory MongoDB setup, fixture helpers, and a 31-test integration suite covering authentication, RBAC, clubs, events, capacity, QR check-in, teams, challenges, submissions, rewards, achievements, leaderboards, notifications, reports, and administration.
- Found and fixed a validation bug where validating route params discarded sibling params such as `userId`.
- Consolidated duplicate imports and connected the notification bell to the client-side read event.
- Confirmed server and client lint pass.

## 2026-11-16 - Bug injection and verification

**Prompt:** Prepare baseline snapshots, inject the planned defects, and add maintainer documentation.

**Work completed:**

- Snapshotted clean source files under `docs/maintainer/baseline/`.
- Implemented B01-B17 across challenge progress, profiles, filtering, achievements, pagination, submissions, rewards, teams, deadlines, check-in, rankings, permissions, idempotency, leaderboards, capacity, and revocation.
- Added four maintainer-only easter eggs.
- Added `scripts/verify-baseline.mjs`, which restores baseline files, runs lint/tests/build, and restores the challenge build.
- Verified that the clean baseline passes all 31 server tests and the challenge build produces the intended failures.
- Added the bug catalog, project explanation, API reference, issue files, and private easter egg notes.

## Notes

- No secrets or credentials were sent to external services.
- MongoDB was unavailable locally, so all automated server tests use `mongodb-memory-server`.
- GitHub CLI was unavailable, so issues were prepared as Markdown.
