import crypto from 'node:crypto';
import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { Attendance } from '../models/Attendance.js';
import { Team } from '../models/Team.js';
import { TeamInvitation } from '../models/TeamInvitation.js';
import { Challenge } from '../models/Challenge.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Submission } from '../models/Submission.js';
import { Achievement } from '../models/Achievement.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Notification } from '../models/Notification.js';
import { Report } from '../models/Report.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { awardPoints } from '../services/pointsService.js';
import { evaluateAchievements } from '../services/achievementService.js';

const days = (offset, hour = 10) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
};

const PROJECT = 'campusquest';
const PASSWORD = env.seedPassword;

async function resetCollections() {
  await Promise.all([
    UserAchievement.deleteMany({}),
    PointTransaction.deleteMany({}),
    Notification.deleteMany({}),
    Report.deleteMany({}),
    Submission.deleteMany({}),
    ChallengeParticipation.deleteMany({}),
    TeamInvitation.deleteMany({}),
    Team.deleteMany({}),
    Challenge.deleteMany({}),
    Attendance.deleteMany({}),
    EventRegistration.deleteMany({}),
    Event.deleteMany({}),
    ClubMembership.deleteMany({}),
    Club.deleteMany({}),
    Achievement.deleteMany({}),
    User.deleteMany({ email: /@campusquest\.dev$/ }),
  ]);
}

async function seed() {
  await connectDatabase();
  await resetCollections();

  const userDocs = [
    { name: 'Alex Morgan', email: 'admin@campusquest.dev', role: 'admin', campus: 'Northfield University', department: 'Student Affairs', year: 4 },
    { name: 'Maya Chen', email: 'maya@campusquest.dev', role: 'organizer', campus: 'Northfield University', department: 'Computer Science', year: 4 },
    { name: 'Jordan Alvarez', email: 'jordan@campusquest.dev', role: 'organizer', campus: 'Northfield University', department: 'Sports Science', year: 3 },
    { name: 'Priya Nair', email: 'priya@campusquest.dev', role: 'organizer', campus: 'Northfield University', department: 'Fine Arts', year: 4 },
    { name: 'Sam Okafor', email: 'sam@campusquest.dev', role: 'organizer', campus: 'Northfield University', department: 'Business', year: 2 },
    { name: 'Ava Patel', email: 'ava@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Computer Science', year: 2 },
    { name: 'Leo Martinez', email: 'leo@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Mechanical Engineering', year: 3 },
    { name: 'Zara Ahmed', email: 'zara@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Design', year: 2 },
    { name: 'Noah Kim', email: 'noah@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Data Science', year: 3 },
    { name: 'Isabella Rossi', email: 'isa@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Psychology', year: 1 },
    { name: 'Mia Thompson', email: 'mia@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Biology', year: 2 },
    { name: 'Ethan Brooks', email: 'ethan@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Economics', year: 3 },
    { name: 'Sofia Hernandez', email: 'sofia@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Computer Science', year: 1 },
    { name: 'Kai Nakamura', email: 'kai@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Electrical Engineering', year: 4 },
    { name: 'Lena Fischer', email: 'lena@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Environmental Science', year: 3 },
    { name: 'Omar Haddad', email: 'omar@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Business', year: 2 },
    { name: 'Ruby Singh', email: 'ruby@campusquest.dev', role: 'student', campus: 'Northfield University', department: 'Journalism', year: 2 },
  ];

  const users = {};
  for (const [index, entry] of userDocs.entries()) {
    const user = await User.create({
      ...entry,
      passwordHash: PASSWORD,
      bio:
        entry.role === 'student'
          ? 'Always looking for the next campus challenge.'
          : 'Building experiences that bring the campus together.',
      streak: (index % 5) + 1,
      longestStreak: (index % 7) + 2,
    });
    users[entry.email] = user;
  }

  const studentEmails = userDocs.filter((entry) => entry.role === 'student').map((entry) => entry.email);
  const students = studentEmails.map((email) => users[email]);

  const achievementDocs = await Achievement.insertMany([
    { code: 'first_steps', title: 'First Steps', description: 'Complete your first challenge.', icon: 'footprints', category: 'challenge', criteriaType: 'challenges_completed', threshold: 1, bonusPoints: 10 },
    { code: 'challenge_explorer', title: 'Challenge Explorer', description: 'Complete three challenges.', icon: 'compass', category: 'challenge', criteriaType: 'challenges_completed', threshold: 3, bonusPoints: 25 },
    { code: 'event_rookie', title: 'Event Rookie', description: 'Attend your first campus event.', icon: 'ticket', category: 'event', criteriaType: 'events_attended', threshold: 1, bonusPoints: 5 },
    { code: 'campus_regular', title: 'Campus Regular', description: 'Attend five campus events.', icon: 'calendar-check', category: 'event', criteriaType: 'events_attended', threshold: 5, bonusPoints: 30 },
    { code: 'club_joiner', title: 'Join the Movement', description: 'Become an approved member of a club.', icon: 'users', category: 'club', criteriaType: 'clubs_joined', threshold: 1, bonusPoints: 10 },
    { code: 'team_builder', title: 'Team Builder', description: 'Create your first team.', icon: 'shield', category: 'team', criteriaType: 'teams_created', threshold: 1, bonusPoints: 15 },
    { code: 'century_club', title: 'Century Club', description: 'Reach 100 campus points.', icon: 'star', category: 'points', criteriaType: 'points', threshold: 100, bonusPoints: 20 },
    { code: 'points_500', title: 'High Achiever', description: 'Reach 500 campus points.', icon: 'trophy', category: 'points', criteriaType: 'points', threshold: 500, bonusPoints: 50 },
    { code: 'streak_3', title: 'Momentum', description: 'Maintain a three-day activity streak.', icon: 'flame', category: 'streak', criteriaType: 'streak', threshold: 3, bonusPoints: 15 },
  ]);

  const clubs = await Club.insertMany([
    {
      name: 'Coding Guild',
      slug: 'coding-guild',
      description:
        'A student-run community for builders, hackers, and designers. Weekly build nights, interview prep, and open-source sprints.',
      tagline: 'Build something worth shipping.',
      category: 'technology',
      organizer: users['maya@campusquest.dev']._id,
      status: 'approved',
      membersCount: 9,
      meetingSchedule: 'Wednesdays 6pm, Innovation Lab',
      activity: [{ actor: users['maya@campusquest.dev']._id, message: 'Published the spring build season', kind: 'update' }],
    },
    {
      name: 'Campus Sports Council',
      slug: 'campus-sports-council',
      description: 'Intramural leagues, fitness challenges, and game-day events for every skill level.',
      tagline: 'Move together.',
      category: 'sports',
      organizer: users['jordan@campusquest.dev']._id,
      status: 'approved',
      membersCount: 7,
      meetingSchedule: 'Fridays 5pm, Main Gym',
    },
    {
      name: 'Art Collective',
      slug: 'art-collective',
      description: 'Open studios, exhibitions, and creative collaborations across campus.',
      tagline: 'Make room for weird ideas.',
      category: 'arts',
      organizer: users['priya@campusquest.dev']._id,
      status: 'approved',
      membersCount: 6,
      meetingSchedule: 'Thursdays 4pm, Studio B',
    },
    {
      name: 'Innovation Hub',
      slug: 'innovation-hub',
      description: 'Entrepreneurship community for student founders: pitch nights, mentor hours, and launch support.',
      tagline: 'From dorm room to demo day.',
      category: 'entrepreneurship',
      organizer: users['sam@campusquest.dev']._id,
      status: 'approved',
      membersCount: 8,
      meetingSchedule: 'Tuesdays 7pm, Founders Hall',
    },
    {
      name: 'Wellness Circle',
      slug: 'wellness-circle',
      description: 'Peer-led wellness: mindfulness walks, study breaks, and mental health awareness events.',
      tagline: 'Slow down to go further.',
      category: 'wellness',
      organizer: users['jordan@campusquest.dev']._id,
      status: 'approved',
      membersCount: 5,
      meetingSchedule: 'Mondays 8am, Lakeside Lawn',
    },
    {
      name: 'Debate Society',
      slug: 'debate-society',
      description: 'Competitive and casual debate for students who like a good argument.',
      tagline: 'Steel sharpens steel.',
      category: 'academic',
      organizer: users['priya@campusquest.dev']._id,
      status: 'approved',
      membersCount: 4,
      meetingSchedule: 'Sundays 3pm, Room 204',
    },
    {
      name: 'Robotics Underground',
      slug: 'robotics-underground',
      description: 'A proposed club for competitive robotics and hardware tinkering.',
      tagline: 'Hardware is not dead.',
      category: 'technology',
      organizer: users['sam@campusquest.dev']._id,
      status: 'pending',
      membersCount: 1,
    },
  ]);

  const clubByName = Object.fromEntries(clubs.map((club) => [club.name, club]));

  for (const club of clubs.filter((entry) => entry.status === 'approved')) {
    await ClubMembership.create({
      club: club._id,
      user: club.organizer,
      role: 'organizer',
      status: 'approved',
      decidedBy: club.organizer,
      decidedAt: days(-40),
    });
  }
  await ClubMembership.create({
    club: clubByName['Robotics Underground']._id,
    user: users['sam@campusquest.dev']._id,
    role: 'organizer',
    status: 'approved',
    decidedBy: users['sam@campusquest.dev']._id,
    decidedAt: days(-2),
  });

  const clubAssignments = {
    'Coding Guild': ['ava@campusquest.dev', 'noah@campusquest.dev', 'sofia@campusquest.dev', 'kai@campusquest.dev', 'zara@campusquest.dev', 'leo@campusquest.dev'],
    'Campus Sports Council': ['leo@campusquest.dev', 'mia@campusquest.dev', 'ethan@campusquest.dev', 'omar@campusquest.dev', 'ruby@campusquest.dev'],
    'Art Collective': ['zara@campusquest.dev', 'isa@campusquest.dev', 'ruby@campusquest.dev', 'lena@campusquest.dev'],
    'Innovation Hub': ['omar@campusquest.dev', 'ethan@campusquest.dev', 'ava@campusquest.dev', 'sofia@campusquest.dev'],
    'Wellness Circle': ['mia@campusquest.dev', 'isa@campusquest.dev', 'lena@campusquest.dev', 'noah@campusquest.dev'],
    'Debate Society': ['ruby@campusquest.dev', 'kai@campusquest.dev', 'zara@campusquest.dev'],
  };

  for (const [clubName, emails] of Object.entries(clubAssignments)) {
    const club = clubByName[clubName];
    for (const email of emails) {
      const existing = await ClubMembership.findOne({ club: club._id, user: users[email]._id });
      if (existing) continue;
      await ClubMembership.create({
        club: club._id,
        user: users[email]._id,
        status: 'approved',
        decidedBy: club.organizer,
        decidedAt: days(-20),
      });
      await awardPoints({
        userId: users[email]._id,
        amount: 5,
        type: 'club_join',
        reason: `Joined ${club.name}`,
        sourceType: 'club',
        sourceId: club._id,
        idempotencyKey: `club-join:${club._id}:${users[email]._id}`,
        skipSideEffects: true,
      });
    }
  }

  for (const club of clubs) {
    const approvedCount = await ClubMembership.countDocuments({ club: club._id, status: 'approved' });
    await Club.updateOne({ _id: club._id }, { membersCount: approvedCount });
  }

  await ClubMembership.create({
    club: clubByName['Coding Guild']._id,
    user: users['isabella.rossi@campusquest.dev']?._id || users['isa@campusquest.dev']._id,
    status: 'pending',
    message: 'I would love to join the build nights.',
  });

  const eventSpecs = [
    { title: 'Spring Hackathon: Build for Campus', category: 'technology', club: 'Coding Guild', venue: 'Innovation Lab', start: -1, end: 1, capacity: 120, points: 40, organizer: 'maya@campusquest.dev' },
    { title: 'Robotics Open Lab', category: 'technology', club: 'Coding Guild', venue: 'Engineering Annex', start: 4, end: 4, capacity: 40, points: 20, organizer: 'maya@campusquest.dev' },
    { title: 'Midnight Basketball League', category: 'sports', club: 'Campus Sports Council', venue: 'Main Gym', start: 2, end: 2, capacity: 60, points: 25, organizer: 'jordan@campusquest.dev' },
    { title: 'Sunrise Yoga on the Lawn', category: 'wellness', club: 'Wellness Circle', venue: 'Lakeside Lawn', start: 6, end: 6, capacity: 50, points: 15, organizer: 'jordan@campusquest.dev' },
    { title: 'Open Mic Night', category: 'arts', club: 'Art Collective', venue: 'Student Union Stage', start: 9, end: 9, capacity: 150, points: 20, organizer: 'priya@campusquest.dev' },
    { title: 'Founder Pitch Night', category: 'entrepreneurship', club: 'Innovation Hub', venue: 'Founders Hall', start: 12, end: 12, capacity: 100, points: 35, organizer: 'sam@campusquest.dev' },
    { title: 'Campus Culture Fest', category: 'culture', club: 'Art Collective', venue: 'Quad', start: 16, end: 18, capacity: 500, points: 30, organizer: 'priya@campusquest.dev' },
    { title: 'Interview Prep Bootcamp', category: 'technology', club: 'Coding Guild', venue: 'Library Seminar Room', start: 21, end: 21, capacity: 45, points: 20, organizer: 'maya@campusquest.dev' },
    { title: 'Community Garden Volunteer Day', category: 'service', club: 'Wellness Circle', venue: 'North Garden', start: 8, end: 8, capacity: 35, points: 25, organizer: 'jordan@campusquest.dev' },
    { title: 'Chess Blitz Tournament', category: 'academic', club: 'Debate Society', venue: 'Room 204', start: 14, end: 14, capacity: 32, points: 20, organizer: 'priya@campusquest.dev' },
    { title: 'Retro Game Jam', category: 'technology', club: 'Coding Guild', venue: 'Innovation Lab', start: -22, end: -20, capacity: 80, points: 30, organizer: 'maya@campusquest.dev' },
    { title: 'Spring Dance Showcase', category: 'arts', club: 'Art Collective', venue: 'Auditorium', start: 26, end: 26, capacity: 240, points: 20, organizer: 'priya@campusquest.dev', status: 'draft' },
    { title: 'Beach Cleanup Relay', category: 'service', club: 'Wellness Circle', venue: 'City Beach', start: 30, end: 30, capacity: 70, points: 25, organizer: 'jordan@campusquest.dev', status: 'cancelled' },
  ];

  const events = [];
  for (const spec of eventSpecs) {
    const event = await Event.create({
      title: spec.title,
      description: `${spec.title} brings together students from across campus for a hands-on, high-energy experience. Hosted by ${clubByName[spec.club].name}, this event is designed for participation, not spectating. Bring your student ID and arrive ten minutes early.`,
      category: spec.category,
      venue: spec.venue,
      startDate: days(spec.start, 10),
      endDate: days(spec.end, 18),
      capacity: spec.capacity,
      points: spec.points,
      organizer: users[spec.organizer]._id,
      club: clubByName[spec.club]._id,
      status: spec.status || 'published',
      checkInSecret: crypto.randomBytes(32).toString('hex'),
      tags: [spec.category, 'campus'],
    });
    events.push(event);
  }

  const registrationsByEvent = {};
  const assignmentPool = [
    ['Spring Hackathon: Build for Campus', 12],
    ['Robotics Open Lab', 7],
    ['Midnight Basketball League', 9],
    ['Sunrise Yoga on the Lawn', 6],
    ['Open Mic Night', 10],
    ['Founder Pitch Night', 8],
    ['Campus Culture Fest', 11],
    ['Interview Prep Bootcamp', 9],
    ['Community Garden Volunteer Day', 6],
    ['Chess Blitz Tournament', 5],
    ['Retro Game Jam', 10],
  ];

  for (const [title, count] of assignmentPool) {
    const event = events.find((entry) => entry.title === title);
    const attendees = students.slice(0, count);
    registrationsByEvent[title] = [];
    for (const [index, student] of attendees.entries()) {
      const checkedIn = event.startDate < new Date() && index % 3 !== 2;
      const registration = await EventRegistration.create({
        event: event._id,
        user: student._id,
        status: checkedIn ? 'checked_in' : 'registered',
        checkedInAt: checkedIn ? event.startDate : null,
      });
      registrationsByEvent[title].push(registration);
      if (checkedIn) {
        await Attendance.create({
          event: event._id,
          user: student._id,
          registration: registration._id,
          checkedInAt: event.startDate,
          method: 'qr',
        });
        await awardPoints({
          userId: student._id,
          amount: event.points,
          type: 'event_checkin',
          reason: `Checked in to ${event.title}`,
          sourceType: 'event',
          sourceId: event._id,
          idempotencyKey: `checkin:${event._id}:${student._id}`,
          skipSideEffects: true,
        });
      }
      await awardPoints({
        userId: student._id,
        amount: 5,
        type: 'event_registration',
        reason: `Registered for ${event.title}`,
        sourceType: 'event',
        sourceId: event._id,
        idempotencyKey: `event-registration:${event._id}:${student._id}`,
        skipSideEffects: true,
      });
    }
    await Event.updateOne({ _id: event._id }, { registrationCount: attendees.length });
  }

  const teams = [];
  const teamSpecs = [
    { name: 'Byte Brigade', leader: 'ava@campusquest.dev', members: ['ava@campusquest.dev', 'noah@campusquest.dev', 'sofia@campusquest.dev'], maxSize: 5, desc: 'Shipping fast, learning faster.' },
    { name: 'Hoop Dreams', leader: 'leo@campusquest.dev', members: ['leo@campusquest.dev', 'ethan@campusquest.dev', 'omar@campusquest.dev', 'mia@campusquest.dev'], maxSize: 6, desc: 'Three-pointers and good vibes.' },
    { name: 'Studio Kids', leader: 'zara@campusquest.dev', members: ['zara@campusquest.dev', 'isa@campusquest.dev', 'ruby@campusquest.dev'], maxSize: 5, desc: 'Design collective for campus events.' },
  ];
  for (const spec of teamSpecs) {
    const team = await Team.create({
      name: spec.name,
      description: spec.desc,
      leader: users[spec.leader]._id,
      members: spec.members.map((email) => users[email]._id),
      membersCount: spec.members.length,
      maxSize: spec.maxSize,
      inviteCode: crypto.randomBytes(6).toString('hex'),
      activity: [{ actor: users[spec.leader]._id, message: `${users[spec.leader].name} created the team` }],
    });
    await awardPoints({
      userId: users[spec.leader]._id,
      amount: 10,
      type: 'team_create',
      reason: `Created team ${team.name}`,
      sourceType: 'team',
      sourceId: team._id,
      idempotencyKey: `team-create:${team._id}`,
      skipSideEffects: true,
    });
    teams.push(team);
  }
  const teamByName = Object.fromEntries(teams.map((team) => [team.name, team]));

  await TeamInvitation.insertMany([
    {
      team: teamByName['Byte Brigade']._id,
      inviter: users['ava@campusquest.dev']._id,
      invitee: users['kai@campusquest.dev']._id,
      message: 'We need a hardware person for the next build.',
    },
    {
      team: teamByName['Studio Kids']._id,
      inviter: users['zara@campusquest.dev']._id,
      invitee: users['lena@campusquest.dev']._id,
      message: 'Want to design the culture fest visuals with us?',
    },
  ]);

  const challengeSpecs = [
    { title: '30-Day Code Streak', category: 'technology', difficulty: 'medium', type: 'individual', reward: 60, days: 14, organizer: 'maya@campusquest.dev', club: 'Coding Guild', requirements: 'Commit code on 20 separate days. Submit a screenshot of your contribution graph.' },
    { title: 'Campus Cleanup Sprint', category: 'service', difficulty: 'easy', type: 'team', reward: 80, days: 9, organizer: 'jordan@campusquest.dev', club: 'Wellness Circle', requirements: 'Collect at least five bags of litter with your team. Submit a before/after photo.' },
    { title: 'Pitch Deck Teardown', category: 'entrepreneurship', difficulty: 'hard', type: 'individual', reward: 120, days: 18, organizer: 'sam@campusquest.dev', club: 'Innovation Hub', requirements: 'Analyze a real startup pitch deck and submit a one-page critique.' },
    { title: 'Design a Club Poster', category: 'arts', difficulty: 'easy', type: 'individual', reward: 45, days: 7, organizer: 'priya@campusquest.dev', club: 'Art Collective', requirements: 'Create an original event poster and upload a link to the image.' },
    { title: 'Hack the Library Catalog', category: 'technology', difficulty: 'elite', type: 'team', reward: 180, days: 25, organizer: 'maya@campusquest.dev', club: 'Coding Guild', requirements: 'Prototype a better search experience for the library catalog. Submit repo and demo video.' },
    { title: 'Wellness Walk Challenge', category: 'wellness', difficulty: 'easy', type: 'individual', reward: 30, days: 5, organizer: 'jordan@campusquest.dev', club: 'Wellness Circle', requirements: 'Walk 10,000 steps for three days. Submit a summary screenshot.' },
    { title: 'Debate a Hot Topic', category: 'academic', difficulty: 'medium', type: 'individual', reward: 55, days: 11, organizer: 'priya@campusquest.dev', club: 'Debate Society', requirements: 'Record a three-minute argument with sources cited.' },
    { title: 'Startup Customer Interviews', category: 'entrepreneurship', difficulty: 'medium', type: 'team', reward: 90, days: 15, organizer: 'sam@campusquest.dev', club: 'Innovation Hub', requirements: 'Interview five potential customers and submit a findings doc.' },
    { title: 'Campus Mural Miniature', category: 'arts', difficulty: 'hard', type: 'team', reward: 110, days: 20, organizer: 'priya@campusquest.dev', club: 'Art Collective', requirements: 'Produce a mural concept with a scale sketch and material plan.' },
    { title: 'Intramural Fitness Bingo', category: 'sports', difficulty: 'easy', type: 'individual', reward: 25, days: 4, organizer: 'jordan@campusquest.dev', club: 'Campus Sports Council', requirements: 'Complete five fitness activities and submit your bingo card.' },
    { title: 'Open Source First PR', category: 'technology', difficulty: 'hard', type: 'individual', reward: 100, days: 30, organizer: 'maya@campusquest.dev', club: 'Coding Guild', requirements: 'Get a pull request merged in an open-source project. Submit the PR link.' },
    { title: 'Flash Art Jam', category: 'arts', difficulty: 'medium', type: 'individual', reward: 50, days: -4, organizer: 'priya@campusquest.dev', club: 'Art Collective', requirements: 'Create a piece in under two hours and submit it.', status: 'closed' },
  ];

  const challenges = [];
  for (const spec of challengeSpecs) {
    const challenge = await Challenge.create({
      title: spec.title,
      description: `${spec.title} is a ${spec.difficulty} ${spec.type} challenge designed to push you slightly beyond your comfort zone. Work through the requirements, collect evidence, and submit before the deadline.`,
      category: spec.category,
      difficulty: spec.difficulty,
      type: spec.type,
      startDate: days(-3),
      deadline: days(spec.days, 23),
      maxParticipants: spec.type === 'team' ? 20 : 60,
      rewardPoints: spec.reward,
      xpReward: spec.reward,
      requirements: spec.requirements,
      evidenceHint: 'Links to public files, repos, or image hosts work best. Do not include private personal data.',
      organizer: users[spec.organizer]._id,
      club: clubByName[spec.club]._id,
      status: spec.status || 'published',
      allowResubmission: true,
    });
    challenges.push(challenge);
  }
  const challengeByTitle = Object.fromEntries(challenges.map((challenge) => [challenge.title, challenge]));

  async function seedParticipation(challenge, { userEmail, teamName, status, note, feedback = '' }) {
    const user = userEmail ? users[userEmail] : null;
    const team = teamName ? teamByName[teamName] : null;
    const participantKey = team
      ? `challenge:${challenge._id}:team:${team._id}`
      : `challenge:${challenge._id}:user:${user._id}`;
    const participation = await ChallengeParticipation.create({
      challenge: challenge._id,
      user: team ? null : user._id,
      team: team ? team._id : null,
      participantKey,
      status: status === 'approved' ? 'approved' : status === 'pending' ? 'submitted' : status,
      lastSubmissionAt: days(-1),
      approvedAt: status === 'approved' ? days(-1) : null,
    });
    const submission = await Submission.create({
      challenge: challenge._id,
      participation: participation._id,
      submittedBy: user ? user._id : users[team.leader]._id,
      team: team ? team._id : null,
      evidence: { note },
      status,
      feedback: status === 'approved' ? feedback || 'Great work — evidence is clear and complete.' : feedback,
      reviewedBy: status === 'pending' ? null : users[challenge.organizer.toString()]?._id || users['maya@campusquest.dev']._id,
      reviewedAt: status === 'pending' ? null : days(-1),
      pointsAwarded: status === 'approved' ? challenge.rewardPoints * (team ? team.members.length : 1) : 0,
    });

    if (status === 'approved') {
      const recipients = team ? team.members : [user._id];
      for (const recipient of recipients) {
        await awardPoints({
          userId: recipient,
          amount: challenge.rewardPoints,
          type: 'challenge_reward',
          reason: `Challenge approved: ${challenge.title}`,
          sourceType: 'challenge',
          sourceId: challenge._id,
          idempotencyKey: `challenge-reward:${submission._id}:${recipient}`,
          skipSideEffects: true,
        });
      }
      participation.pointsAwarded = challenge.rewardPoints * recipients.length;
      await participation.save();
    }
  }

  await seedParticipation(challengeByTitle['30-Day Code Streak'], { userEmail: 'ava@campusquest.dev', status: 'approved', note: 'Contribution graph screenshot: github.com/ava/streak-proof' });
  await seedParticipation(challengeByTitle['30-Day Code Streak'], { userEmail: 'noah@campusquest.dev', status: 'pending', note: 'Dashboard export from my code tracker.' });
  await seedParticipation(challengeByTitle['30-Day Code Streak'], { userEmail: 'sofia@campusquest.dev', status: 'approved', note: 'Public commit history and daily log.' });
  await seedParticipation(challengeByTitle['Campus Cleanup Sprint'], { teamName: 'Byte Brigade', status: 'approved', note: 'Before and after photos at the north gate.' });
  await seedParticipation(challengeByTitle['Campus Cleanup Sprint'], { teamName: 'Studio Kids', status: 'pending', note: 'Team photo and scale readings from the cleanup.' });
  await seedParticipation(challengeByTitle['Pitch Deck Teardown'], { userEmail: 'omar@campusquest.dev', status: 'approved', note: 'One-page critique of a seed-stage fintech deck.' });
  await seedParticipation(challengeByTitle['Design a Club Poster'], { userEmail: 'zara@campusquest.dev', status: 'approved', note: 'Figma link to the spring showcase poster.' });
  await seedParticipation(challengeByTitle['Design a Club Poster'], { userEmail: 'isa@campusquest.dev', status: 'pending', note: 'Poster draft in Figma, v3.' });
  await seedParticipation(challengeByTitle['Hack the Library Catalog'], { teamName: 'Byte Brigade', status: 'pending', note: 'Repo and two-minute demo video.' });
  await seedParticipation(challengeByTitle['Wellness Walk Challenge'], { userEmail: 'mia@campusquest.dev', status: 'approved', note: 'Three-day step count summary.' });
  await seedParticipation(challengeByTitle['Wellness Walk Challenge'], { userEmail: 'lena@campusquest.dev', status: 'pending', note: 'Screenshots from my fitness app.' });
  await seedParticipation(challengeByTitle['Debate a Hot Topic'], { userEmail: 'ruby@campusquest.dev', status: 'approved', note: 'Three-minute recorded argument with source list.' });
  await seedParticipation(challengeByTitle['Startup Customer Interviews'], { teamName: 'Studio Kids', status: 'approved', note: 'Interview notes from five students.' });
  await seedParticipation(challengeByTitle['Campus Mural Miniature'], { teamName: 'Studio Kids', status: 'pending', note: 'Scale sketch and material budget.' });
  await seedParticipation(challengeByTitle['Intramural Fitness Bingo'], { userEmail: 'leo@campusquest.dev', status: 'approved', note: 'Completed bingo card scan.' });
  await seedParticipation(challengeByTitle['Intramural Fitness Bingo'], { userEmail: 'ethan@campusquest.dev', status: 'approved', note: 'Bingo card with five stamped activities.' });
  await seedParticipation(challengeByTitle['Open Source First PR'], { userEmail: 'kai@campusquest.dev', status: 'approved', note: 'Merged PR link in the campus docs repo.' });
  await seedParticipation(challengeByTitle['Open Source First PR'], { userEmail: 'ava@campusquest.dev', status: 'pending', note: 'PR submitted, awaiting maintainer review.' });
  await seedParticipation(challengeByTitle['Flash Art Jam'], { userEmail: 'zara@campusquest.dev', status: 'approved', note: 'Two-hour speed painting timelapse.' });
  await seedParticipation(challengeByTitle['Flash Art Jam'], { userEmail: 'ruby@campusquest.dev', status: 'rejected', note: 'Sketch photo.', feedback: 'Please submit the final piece, not the sketch.' });

  for (const challenge of challenges) {
    const count = await ChallengeParticipation.countDocuments({ challenge: challenge._id });
    await Challenge.updateOne({ _id: challenge._id }, { participationCount: count });
  }

  await Notification.insertMany([
    {
      user: users['ava@campusquest.dev']._id,
      type: 'achievement',
      title: 'Achievement unlocked: First Steps',
      message: 'Complete your first challenge.',
      link: '/achievements',
      read: true,
    },
    {
      user: users['ava@campusquest.dev']._id,
      type: 'team_invitation',
      title: 'Team invitation: Byte Brigade',
      message: 'Maya invited you to lead the Byte Brigade build team.',
      link: '/teams/invitations',
    },
    {
      user: users['noah@campusquest.dev']._id,
      type: 'submission_status',
      title: 'Submission awaiting review',
      message: 'Your 30-Day Code Streak evidence is in the review queue.',
      link: '/submissions',
    },
    {
      user: users['maya@campusquest.dev']._id,
      type: 'announcement',
      title: 'Hackathon check-in is live',
      message: 'Open the event workspace to display the QR check-in code.',
      link: '/organizer/events',
    },
    {
      user: users['admin@campusquest.dev']._id,
      type: 'system',
      title: 'Club approval pending',
      message: 'Robotics Underground is waiting for review.',
      link: '/admin/clubs',
    },
  ]);

  await Report.create({
    reporter: users['ruby@campusquest.dev']._id,
    targetType: 'submission',
    targetId: (await Submission.findOne({ status: 'rejected' }))._id,
    reason: 'Feedback appears to reference the wrong file',
    details: 'The reviewer mentioned a sketch, but the final piece was attached.',
    status: 'open',
  });

  for (const user of Object.values(users)) {
    await evaluateAchievements(user._id);
  }

  const counts = {
    users: await User.countDocuments({ email: /@campusquest\.dev$/ }),
    clubs: await Club.countDocuments(),
    memberships: await ClubMembership.countDocuments({ status: 'approved' }),
    events: await Event.countDocuments(),
    registrations: await EventRegistration.countDocuments(),
    attendance: await Attendance.countDocuments(),
    teams: await Team.countDocuments(),
    invitations: await TeamInvitation.countDocuments(),
    challenges: await Challenge.countDocuments(),
    participations: await ChallengeParticipation.countDocuments(),
    submissions: await Submission.countDocuments(),
    points: await PointTransaction.countDocuments(),
    achievements: achievementDocs.length,
    userAchievements: await UserAchievement.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  console.log(`\nCampusQuest seed complete (${PROJECT}).`);
  console.table(counts);
  console.log('\nDemo accounts (password: %s)', PASSWORD);
  console.table([
    { role: 'Admin', email: 'admin@campusquest.dev' },
    { role: 'Organizer', email: 'maya@campusquest.dev' },
    { role: 'Organizer', email: 'jordan@campusquest.dev' },
    { role: 'Student', email: 'ava@campusquest.dev' },
    { role: 'Student', email: 'noah@campusquest.dev' },
  ]);

  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect().catch(() => null);
  process.exit(1);
});
