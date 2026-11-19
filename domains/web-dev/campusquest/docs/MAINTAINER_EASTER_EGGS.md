# Maintainer Easter Eggs

> **Private maintainer document.** Do not publish this file, its contents, or the hidden tests in the participant-facing submission. These are additional edge cases beyond B01-B17.

## E01 - Historical reward edits rewrite category rankings

- **Location:** `server/src/services/leaderboardService.js`, category branch of `individualLeaderboard`.
- **Behavior:** Category scores sum the challenge's **current** `rewardPoints` instead of each submission's historical `pointsAwarded`.
- **Trigger:** Approve submissions, then edit the challenge's reward. The category leaderboard changes retroactively even though no user balance changed.
- **Expected:** Approved submissions keep the points recorded at review time.
- **Discovery hint:** Compare a category leaderboard before and after changing a challenge reward.

## E02 - Leadership transfer cancels pending invitations

- **Location:** `server/src/controllers/teamController.js`, `transferLeadership`.
- **Behavior:** Transferring leadership cancels every pending invitation for the team.
- **Trigger:** Leader A invites C, transfers leadership to B, then C opens the invitation.
- **Expected:** Pending invitations survive a leadership change and remain valid team invitations.
- **Discovery hint:** Invite a student, transfer leadership, and inspect the invitee's invitation list.

## E03 - Authorization uses the role embedded in the token

- **Location:** `server/src/middleware/auth.js`, `requireRole` and `requireOrganizer`.
- **Behavior:** Route guards trust `req.tokenPayload.role` before the current database role.
- **Trigger:** Issue a token for an admin, demote the account, then use the old token. The account can still reach admin routes until it receives a new token. The inverse also occurs for promoted accounts.
- **Expected:** Authorization always uses the current database role.
- **Discovery hint:** Change a user's role and reuse an existing token.

## E04 - Concurrent invitation accepts can exceed team size

- **Location:** `server/src/controllers/teamController.js`, `respondToInvitation`.
- **Behavior:** The atomic `membersCount < maxSize` guard is missing from the accept update.
- **Trigger:** Invite two students to a team with one available seat and accept both invitations concurrently.
- **Expected:** Exactly one acceptance succeeds; the other receives a capacity conflict.
- **Discovery hint:** Fire two acceptance requests in parallel against a nearly full team.

## Verification

```bash
npm run verify:eggs
```

The script checks that the intentional egggy code paths are still present while the challenge build is active. Baseline restoration in `npm run verify:baseline` temporarily removes eggs that live in snapshotted files, then restores the active challenge build.

## Handling

These findings should remain out of public issue lists and participant documentation. If a challenge submission is being evaluated for security correctness, treat E03 and E04 as high severity even though they are not part of B01-B17.
