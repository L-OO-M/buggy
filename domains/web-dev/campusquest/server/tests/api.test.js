import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { Achievement } from '../src/models/Achievement.js';
import { UserAchievement } from '../src/models/UserAchievement.js';
import { Notification } from '../src/models/Notification.js';
import { Team } from '../src/models/Team.js';
import { ChallengeParticipation } from '../src/models/ChallengeParticipation.js';
import { PointTransaction } from '../src/models/PointTransaction.js';
import { awardPoints } from '../src/services/pointsService.js';
import { setSocketServer } from '../src/sockets/emitter.js';
import {
  PASSWORD,
  auth,
  createChallenge,
  createClub,
  createEvent,
  createUser,
  futureDate,
  pastDate,
  uniqueEmail,
} from './helpers.js';

const app = createApp();
const api = request(app);

describe('auth and accounts', () => {
  it('reports health', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('registers, logs in, and returns the current user', async () => {
    const email = uniqueEmail('register');
    const registered = await api.post('/api/auth/register').send({
      name: 'New Student',
      email,
      password: PASSWORD,
      role: 'student',
    });
    expect(registered.status).toBe(201);
    expect(registered.body.data.token).toBeTruthy();
    expect(registered.body.data.user.email).toBe(email);
    expect(registered.body.data.user.passwordHash).toBeUndefined();

    const duplicate = await api.post('/api/auth/register').send({
      name: 'New Student',
      email,
      password: PASSWORD,
    });
    expect(duplicate.status).toBe(409);

    const badLogin = await api.post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);

    const login = await api.post('/api/auth/login').send({ email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.streak).toBe(1);

    const me = await api.get('/api/auth/me');
    expect(me.status).toBe(401);

    const meWithToken = await api.get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.token}`);
    expect(meWithToken.status).toBe(200);
    expect(meWithToken.body.data.user.email).toBe(email);
  });

  it('updates the authenticated profile', async () => {
    const user = await createUser();
    const res = await api
      .patch('/api/users/me')
      .set(auth(user))
      .send({ name: 'Updated Name', bio: 'Hello campus', preferences: { theme: 'dark' } });
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Updated Name');
    expect(res.body.data.user.preferences.theme).toBe('dark');
    expect(res.body.data.user.preferences.emailReminders).toBe(true);
  });

  it('reports team challenge progress in stats', async () => {
    const student = await createUser();
    const organizer = await createUser({ role: 'organizer' });
    const team = await Team.create({
      name: 'Progress Team',
      leader: student._id,
      members: [student._id],
      membersCount: 1,
      maxSize: 5,
      inviteCode: 'progress-team-code',
    });
    const challenge = await createChallenge(organizer, { type: 'team' });
    await ChallengeParticipation.create({
      challenge: challenge._id,
      team: team._id,
      participantKey: `challenge:${challenge._id}:team:${team._id}`,
      status: 'approved',
    });

    const res = await api.get('/api/users/me/stats').set(auth(student));
    expect(res.status).toBe(200);
    expect(res.body.data.stats.challengeProgress).toEqual({ joined: 1, completed: 1, percent: 100 });
  });

  it('blocks suspended accounts from logging in', async () => {
    const user = await createUser({ suspended: true });
    const res = await api.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(403);
  });

  it('enforces organizer role gates', async () => {
    const student = await createUser();
    const organizer = await createUser({ role: 'organizer' });
    const body = {
      title: 'Role Gate Event',
      description: 'A sufficiently long description for the role gate test.',
      category: 'academic',
      venue: 'Hall A',
      startDate: futureDate(1).toISOString(),
      endDate: futureDate(2).toISOString(),
      capacity: 10,
    };
    expect((await api.post('/api/events').set(auth(student)).send(body)).status).toBe(403);
    expect((await api.post('/api/events').set(auth(organizer)).send(body)).status).toBe(201);
  });
});

describe('clubs', () => {
  it('handles club creation, approval, membership, and member counts', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const admin = await createUser({ role: 'admin' });

    const created = await api
      .post('/api/clubs')
      .set(auth(organizer))
      .send({ name: 'Robotics Society', description: 'We build robots and compete on campus.' });
    expect(created.status).toBe(201);
    const club = created.body.data.club;
    expect(club.status).toBe('pending');

    const hidden = await api.get('/api/clubs');
    expect(hidden.body.data.some((item) => item._id === club._id)).toBe(false);

    const approved = await api
      .patch(`/api/admin/clubs/${club._id}`)
      .set(auth(admin))
      .send({ decision: 'approved' });
    expect(approved.status).toBe(200);

    const join = await api.post(`/api/clubs/${club._id}/join`).set(auth(student)).send({ message: 'Please' });
    expect(join.status).toBe(201);
    expect(join.body.data.membership.status).toBe('pending');

    const pending = await api.get(`/api/clubs/${club._id}/requests`).set(auth(organizer));
    expect(pending.body.data.requests).toHaveLength(1);

    const decision = await api
      .patch(`/api/clubs/${club._id}/requests/${student._id}`)
      .set(auth(organizer))
      .send({ decision: 'approved' });
    expect(decision.status).toBe(200);

    const mine = await api.get('/api/clubs/mine').set(auth(student));
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].club._id).toBe(club._id);

    const repeated = await api.post(`/api/clubs/${club._id}/join`).set(auth(student)).send({});
    expect(repeated.status).toBe(409);

    const withMembers = await api.get(`/api/clubs/${club._id}`);
    expect(withMembers.body.data.members).toHaveLength(2);

    const left = await api.delete(`/api/clubs/${club._id}/leave`).set(auth(student));
    expect(left.status).toBe(200);
    const afterLeave = await api.get(`/api/clubs/${club._id}`).set(auth(student));
    expect(afterLeave.body.data.members).toHaveLength(1);
  });
});

describe('events and check-in', () => {
  it('lists only published events publicly', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const published = await createEvent(organizer);
    await createEvent(organizer, { title: 'Draft Event', status: 'draft' });

    const list = await api.get('/api/events');
    expect(list.status).toBe(200);
    expect(list.body.data.map((event) => String(event._id))).toContain(String(published._id));
    expect(list.body.data.map((event) => event.title)).not.toContain('Draft Event');

    expect((await api.get(`/api/events/${published._id}`)).status).toBe(200);
  });

  it('enforces registration capacity and allows cancel and re-register', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const first = await createUser();
    const second = await createUser();
    const event = await createEvent(organizer, { capacity: 1 });

    const registered = await api.post(`/api/registrations/${event._id}`).set(auth(first)).send({});
    expect(registered.status).toBe(201);

    const full = await api.post(`/api/registrations/${event._id}`).set(auth(second)).send({});
    expect(full.status).toBe(409);

    const duplicate = await api.post(`/api/registrations/${event._id}`).set(auth(first)).send({});
    expect(duplicate.status).toBe(409);

    const cancelled = await api.delete(`/api/registrations/${event._id}`).set(auth(first));
    expect(cancelled.status).toBe(200);

    const reRegistered = await api.post(`/api/registrations/${event._id}`).set(auth(first)).send({});
    expect(reRegistered.status).toBe(200);

    const refreshed = await Event.findById(event._id);
    expect(refreshed.registrationCount).toBe(1);
  });

  it('checks in with a valid token, awards points once, and rejects rotated codes', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const event = await createEvent(organizer, { points: 20 });

    await api.post(`/api/registrations/${event._id}`).set(auth(student)).send({});

    const code = await api.get(`/api/events/${event._id}/checkin-code`).set(auth(organizer));
    expect(code.status).toBe(200);
    const token = code.body.data.token;

    const checkedIn = await api.post('/api/attendance/checkin').set(auth(student)).send({ token });
    expect(checkedIn.status).toBe(201);

    const refreshed = await User.findById(student._id);
    expect(refreshed.points).toBe(25);

    const duplicate = await api.post('/api/attendance/checkin').set(auth(student)).send({ token });
    expect(duplicate.status).toBe(409);

    const forgedUser = await createUser();
    await api.post(`/api/registrations/${event._id}`).set(auth(forgedUser)).send({});
    const forged = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;
    const forgedCheckIn = await api.post('/api/attendance/checkin').set(auth(forgedUser)).send({ token: forged });
    expect(forgedCheckIn.status).toBe(400);

    const rotated = await api.post(`/api/events/${event._id}/checkin-code/rotate`).set(auth(organizer));
    expect(rotated.status).toBe(200);
    const other = await createUser();
    await api.post(`/api/registrations/${event._id}`).set(auth(other)).send({});
    const stale = await api.post('/api/attendance/checkin').set(auth(other)).send({ token });
    expect(stale.status).toBe(400);

    const unauthorized = await api.get(`/api/events/${event._id}/checkin-code`).set(auth(other));
    expect(unauthorized.status).toBe(403);
  });

  it('lets club organizers manage events hosted by their club', async () => {
    const clubOrganizer = await createUser({ role: 'organizer' });
    const eventOrganizer = await createUser({ role: 'organizer' });
    const club = await createClub(clubOrganizer);
    const event = await createEvent(eventOrganizer, { club: club._id });

    const code = await api.get(`/api/events/${event._id}/checkin-code`).set(auth(clubOrganizer));
    expect(code.status).toBe(200);
  });

  it('lets organizers manually check in registered students after the event starts', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const event = await createEvent(organizer, { points: 15 });
    await api.post(`/api/registrations/${event._id}`).set(auth(student)).send({});

    const manual = await api
      .post(`/api/events/${event._id}/checkin/manual`)
      .set(auth(organizer))
      .send({ email: student.email });
    expect(manual.status).toBe(201);

    const duplicate = await api
      .post(`/api/events/${event._id}/checkin/manual`)
      .set(auth(organizer))
      .send({ email: student.email });
    expect(duplicate.status).toBe(409);

    const unregistered = await createUser();
    const rejected = await api
      .post(`/api/events/${event._id}/checkin/manual`)
      .set(auth(organizer))
      .send({ email: unregistered.email });
    expect(rejected.status).toBe(400);
  });
});

describe('teams', () => {
  it('creates teams, sends invitations, and accepts with accurate member counts', async () => {
    const leader = await createUser();
    const invitee = await createUser();

    const created = await api.post('/api/teams').set(auth(leader)).send({ name: 'Trail Blazers' });
    expect(created.status).toBe(201);
    const team = created.body.data.team;
    expect(team.membersCount).toBe(1);

    const invite = await api
      .post(`/api/teams/${team._id}/invite`)
      .set(auth(leader))
      .send({ userId: invitee._id });
    expect(invite.status).toBe(201);

    const invitations = await api.get('/api/teams/invitations').set(auth(invitee));
    expect(invitations.body.data).toHaveLength(1);

    const accepted = await api
      .patch(`/api/teams/invitations/${invite.body.data.invitation._id}/respond`)
      .set(auth(invitee))
      .send({ decision: 'accepted' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.team.membersCount).toBe(2);

    const details = await api.get(`/api/teams/${team._id}`).set(auth(leader));
    expect(details.body.data.team.members).toHaveLength(2);

    const nonLeader = await api
      .post(`/api/teams/${team._id}/invite`)
      .set(auth(invitee))
      .send({ email: uniqueEmail('blocked') });
    expect(nonLeader.status).toBe(403);
  });

  it('prevents invitations beyond team capacity and updates counts on leave', async () => {
    const leader = await createUser();
    const member = await createUser();
    const extra = await createUser();

    await Team.create({
      name: 'Small Squad',
      leader: leader._id,
      members: [leader._id, member._id],
      membersCount: 2,
      maxSize: 2,
      inviteCode: 'small-squad-code',
    });

    const full = await api
      .post(`/api/teams/${(await Team.findOne({ name: 'Small Squad' }))._id}/invite`)
      .set(auth(leader))
      .send({ userId: extra._id });
    expect(full.status).toBe(400);

    const team = await Team.findOne({ name: 'Small Squad' });
    const left = await api.post(`/api/teams/${team._id}/leave`).set(auth(member)).send({});
    expect(left.status).toBe(200);
    expect(left.body.data.team.membersCount).toBe(1);

    const refreshed = await Team.findById(team._id);
    expect(refreshed.members).toHaveLength(1);
    expect(refreshed.membersCount).toBe(1);
  });
});

describe('challenges and submissions', () => {
  it('filters open challenges and rejects joining closed or full challenges', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const other = await createUser();

    const open = await createChallenge(organizer, { maxParticipants: 1 });
    await createChallenge(organizer, { title: 'Expired Challenge', deadline: pastDate(1), startDate: pastDate(3) });
    await createChallenge(organizer, { title: 'Draft Challenge', status: 'draft' });
    await createChallenge(organizer, { title: 'Future Challenge', startDate: futureDate(2), deadline: futureDate(4) });

    const list = await api.get('/api/challenges');
    const titles = list.body.data.map((challenge) => challenge.title);
    expect(titles).toContain(open.title);
    expect(titles).not.toContain('Expired Challenge');
    expect(titles).not.toContain('Draft Challenge');

    const joined = await api.post(`/api/challenges/${open._id}/join`).set(auth(student)).send({});
    expect(joined.status).toBe(201);
    expect(joined.body.data.participation.status).toBe('active');

    const duplicate = await api.post(`/api/challenges/${open._id}/join`).set(auth(student)).send({});
    expect(duplicate.status).toBe(409);

    const full = await api.post(`/api/challenges/${open._id}/join`).set(auth(other)).send({});
    expect(full.status).toBe(409);

    const future = await createChallenge(organizer, {
      title: 'Upcoming',
      startDate: futureDate(2),
      deadline: futureDate(5),
    });
    const early = await api.post(`/api/challenges/${future._id}/join`).set(auth(student)).send({});
    expect(early.status).toBe(400);
  });

  it('requires joining before submission and blocks duplicate pending work', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer);

    const beforeJoin = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Here is my evidence for the challenge.' });
    expect(beforeJoin.status).toBe(400);

    await api.post(`/api/challenges/${challenge._id}/join`).set(auth(student)).send({});
    const submitted = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Here is my evidence for the challenge.' });
    expect(submitted.status).toBe(201);
    expect(submitted.body.data.submission.attempt).toBe(1);

    const duplicate = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'A second evidence note that should be rejected.' });
    expect(duplicate.status).toBe(409);
  });

  it('rejects submissions after the deadline', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer, {
      startDate: pastDate(5),
      deadline: pastDate(1),
    });

    const res = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Submitted after the deadline has passed.' });
    expect(res.status).toBe(400);
  });

  it('rejects submissions shortly after the deadline even with a joined participation', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer, {
      startDate: pastDate(10),
      deadline: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    await ChallengeParticipation.create({
      challenge: challenge._id,
      user: student._id,
      participantKey: `challenge:${challenge._id}:user:${student._id}`,
      status: 'active',
    });

    const res = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Late evidence after the deadline has passed.' });
    expect(res.status).toBe(400);
  });

  it('awards challenge points, updates participation, and enforces single review', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer);
    await api.post(`/api/challenges/${challenge._id}/join`).set(auth(student)).send({});
    const submitted = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'My challenge evidence is attached.' });

    const reviewed = await api
      .patch(`/api/submissions/${submitted.body.data.submission._id}/review`)
      .set(auth(organizer))
      .send({ decision: 'approved', feedback: 'Nice work' });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.submission.pointsAwarded).toBe(20);

    const refreshed = await User.findById(student._id);
    expect(refreshed.points).toBe(20);

    const participation = await api.get(`/api/challenges/${challenge._id}`).set(auth(student));
    expect(participation.body.data.participation.status).toBe('approved');

    const repeated = await api
      .patch(`/api/submissions/${submitted.body.data.submission._id}/review`)
      .set(auth(organizer))
      .send({ decision: 'approved' });
    expect(repeated.status).toBe(400);

    const afterApproval = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'A replacement submission after approval.' });
    expect(afterApproval.status).toBe(409);

    const outsider = await createUser({ role: 'organizer' });
    const forbidden = await api
      .get('/api/submissions/review-queue')
      .set(auth(outsider));
    expect(forbidden.status).toBe(200);
    expect(forbidden.body.data).toHaveLength(0);
  });

  it('cannot resubmit when resubmission is disabled', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer, { allowResubmission: false });
    await api.post(`/api/challenges/${challenge._id}/join`).set(auth(student)).send({});
    const submitted = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'First attempt evidence for review.' });
    await api
      .patch(`/api/submissions/${submitted.body.data.submission._id}/review`)
      .set(auth(organizer))
      .send({ decision: 'rejected', feedback: 'Try again' });

    const resubmitted = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Second attempt evidence for review.' });
    expect(resubmitted.status).toBe(400);
  });

  it('awards every team member on a team challenge', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const leader = await createUser();
    const mate = await createUser();
    const team = await Team.create({
      name: 'Team Challenge Crew',
      leader: leader._id,
      members: [leader._id, mate._id],
      membersCount: 2,
      maxSize: 5,
      inviteCode: 'team-challenge-code',
    });
    const challenge = await createChallenge(organizer, { type: 'team', rewardPoints: 30 });

    const join = await api.post(`/api/challenges/${challenge._id}/join`).set(auth(leader)).send({});
    expect(join.status).toBe(201);
    expect(String(join.body.data.participation.team)).toBe(String(team._id));

    const submitted = await api
      .post('/api/submissions')
      .set(auth(leader))
      .send({ challengeId: challenge._id, note: 'Team evidence for the team challenge.' });
    expect(submitted.status).toBe(201);

    const reviewed = await api
      .patch(`/api/submissions/${submitted.body.data.submission._id}/review`)
      .set(auth(organizer))
      .send({ decision: 'approved' });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.submission.pointsAwarded).toBe(60);

    expect((await User.findById(leader._id)).points).toBe(30);
    expect((await User.findById(mate._id)).points).toBe(30);
  });
});

describe('achievements', () => {
  it('unlocks an achievement when the metric equals its threshold', async () => {
    const student = await createUser({ points: 10 });
    await Achievement.create({
      code: 'ten-points',
      title: 'Ten Points',
      description: 'Reach ten points.',
      criteriaType: 'points',
      threshold: 10,
    });

    const res = await api.post('/api/achievements/recheck').set(auth(student));
    expect(res.status).toBe(200);
    expect(res.body.data.unlocked.map((entry) => entry.code)).toContain('ten-points');
  });

  it('unlocks achievements and reverses bonus points when approvals are revoked', async () => {
    const organizer = await createUser({ role: 'organizer' });
    const student = await createUser();
    const challenge = await createChallenge(organizer, { rewardPoints: 20 });
    await Achievement.create({
      code: 'first-challenge',
      title: 'First Challenge',
      description: 'Complete your first challenge.',
      criteriaType: 'challenges_completed',
      threshold: 1,
      bonusPoints: 5,
    });

    await api.post(`/api/challenges/${challenge._id}/join`).set(auth(student)).send({});
    const submitted = await api
      .post('/api/submissions')
      .set(auth(student))
      .send({ challengeId: challenge._id, note: 'Achievement earning evidence.' });
    await api
      .patch(`/api/submissions/${submitted.body.data.submission._id}/review`)
      .set(auth(organizer))
      .send({ decision: 'approved' });

    const owned = await UserAchievement.findOne({ user: student._id });
    expect(owned).toBeTruthy();
    expect((await User.findById(student._id)).points).toBe(25);

    const revoked = await api
      .post(`/api/submissions/${submitted.body.data.submission._id}/revoke`)
      .set(auth(organizer))
      .send({ reason: 'Evidence was invalid' });
    expect(revoked.status).toBe(200);

    expect(await UserAchievement.findOne({ user: student._id })).toBeNull();
    expect((await User.findById(student._id)).points).toBe(0);
  });
});

describe('leaderboards', () => {
  it('ranks tied scores equally and paginates after ranking', async () => {
    await createUser({ points: 30 });
    await createUser({ points: 20 });
    await createUser({ points: 20 });
    await createUser({ points: 10 });

    const first = await api.get('/api/leaderboards/individual?limit=2&page=1');
    expect(first.status).toBe(200);
    expect(first.body.data.map((entry) => entry.score)).toEqual([30, 20]);
    expect(first.body.data.map((entry) => entry.rank)).toEqual([1, 2]);

    const second = await api.get('/api/leaderboards/individual?limit=2&page=2');
    expect(second.body.data.map((entry) => entry.score)).toEqual([20, 10]);
    expect(second.body.data.map((entry) => entry.rank)).toEqual([2, 4]);
  });

  it('calculates weekly scores from positive point transactions only', async () => {
    const recent = await createUser({ points: 50 });
    const quiet = await createUser({ points: 40 });
    await awardPoints({
      userId: recent._id,
      amount: 15,
      type: 'bonus',
      reason: 'Weekly test award',
      idempotencyKey: 'weekly-award',
      skipSideEffects: true,
    });
    await PointTransaction.create({
      user: recent._id,
      amount: -5,
      type: 'reversal',
      reason: 'Weekly test reversal',
      idempotencyKey: 'weekly-reversal',
      createdAt: new Date(),
    });

    const res = await api.get('/api/leaderboards/individual?period=weekly');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(String(recent._id));
    expect(res.body.data[0].score).toBe(10);
    expect(res.body.data.some((entry) => entry.id === String(quiet._id))).toBe(false);
  });

  it('keeps point awards idempotent for repeated keys', async () => {
    const student = await createUser();
    const first = await awardPoints({
      userId: student._id,
      amount: 10,
      type: 'bonus',
      reason: 'Idempotency test',
      idempotencyKey: 'idempotency-test-key',
      skipSideEffects: true,
    });
    expect(first.duplicate).toBe(false);

    const second = await awardPoints({
      userId: student._id,
      amount: 10,
      type: 'bonus',
      reason: 'Idempotency test',
      idempotencyKey: 'idempotency-test-key',
      skipSideEffects: true,
    });
    expect(second.duplicate).toBe(true);
    expect((await User.findById(student._id)).points).toBe(10);
  });

  it('broadcasts a leaderboard snapshot after a normal point award', async () => {
    const events = [];
    setSocketServer({
      to: () => ({
        emit: (event, payload) => events.push({ event, payload }),
      }),
    });
    const student = await createUser();

    try {
      await awardPoints({
        userId: student._id,
        amount: 5,
        type: 'bonus',
        reason: 'Broadcast test',
        idempotencyKey: 'broadcast-test-key',
      });
    } finally {
      setSocketServer(null);
    }

    expect(events.some((entry) => entry.event === 'leaderboard:update')).toBe(true);
  });

  it('sums active team member points and excludes suspended members', async () => {
    const active = await createUser({ points: 25 });
    const suspended = await createUser({ points: 100, suspended: true });
    await Team.create({
      name: 'Active Team',
      leader: active._id,
      members: [active._id, suspended._id],
      membersCount: 2,
      maxSize: 5,
      inviteCode: 'active-team-code',
    });

    const res = await api.get('/api/leaderboards/teams');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Active Team');
    expect(res.body.data[0].score).toBe(25);
    expect(res.body.data[0].membersCount).toBe(1);
  });
});

describe('notifications and admin', () => {
  it('tracks unread notifications and marks them all read', async () => {
    const user = await createUser();
    await Notification.create([
      { user: user._id, title: 'One', message: 'First notification' },
      { user: user._id, title: 'Two', message: 'Second notification' },
    ]);

    expect((await api.get('/api/notifications/unread-count').set(auth(user))).body.data.unread).toBe(2);
    const readAll = await api.patch('/api/notifications/read-all').set(auth(user));
    expect(readAll.body.data.updated).toBe(2);
    expect((await api.get('/api/notifications/unread-count').set(auth(user))).body.data.unread).toBe(0);
  });

  it('restricts admin routes and supports suspension and role changes', async () => {
    const admin = await createUser({ role: 'admin' });
    const student = await createUser();

    expect((await api.get('/api/admin/stats').set(auth(student))).status).toBe(403);
    expect((await api.get('/api/admin/stats').set(auth(admin))).status).toBe(200);

    const promoted = await api
      .patch(`/api/admin/users/${student._id}`)
      .set(auth(admin))
      .send({ role: 'organizer' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data.user.role).toBe('organizer');

    const suspended = await api
      .patch(`/api/admin/users/${student._id}`)
      .set(auth(admin))
      .send({ suspended: true, suspendedReason: 'Policy violation' });
    expect(suspended.status).toBe(200);

    const login = await api.post('/api/auth/login').send({ email: student.email, password: PASSWORD });
    expect(login.status).toBe(403);
  });

  it('creates reports and lets admins resolve them', async () => {
    const admin = await createUser({ role: 'admin' });
    const reporter = await createUser();
    const reported = await createUser();

    const created = await api
      .post('/api/reports')
      .set(auth(reporter))
      .send({ targetType: 'user', targetId: reported._id, reason: 'Spam', details: 'Repeated spam' });
    expect(created.status).toBe(201);

    const listed = await api.get('/api/admin/reports').set(auth(admin));
    expect(listed.body.data).toHaveLength(1);

    const resolved = await api
      .patch(`/api/admin/reports/${created.body.data.report._id}`)
      .set(auth(admin))
      .send({ status: 'resolved', resolutionNote: 'Handled' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.report.status).toBe('resolved');
  });
});
