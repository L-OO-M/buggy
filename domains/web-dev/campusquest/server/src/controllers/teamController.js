import crypto from 'node:crypto';
import { Team } from '../models/Team.js';
import { TeamInvitation } from '../models/TeamInvitation.js';
import { User } from '../models/User.js';
import { ChallengeParticipation } from '../models/ChallengeParticipation.js';
import { Club } from '../models/Club.js';
import { ApiError, asyncHandler, sendSuccess } from '../utils/http.js';
import { awardPoints } from '../services/pointsService.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../sockets/emitter.js';
import { refreshTeamMemberCount } from '../services/teamService.js';

export const createTeam = asyncHandler(async (req, res) => {
  const active = await Team.findOne({ members: req.user._id, status: 'active' });
  if (active) throw ApiError.conflict('Leave your current team before creating a new one');

  if (req.body.club) {
    const club = await Club.findById(req.body.club);
    if (!club || club.status !== 'approved') throw ApiError.badRequest('Select an approved club');
  }

  const team = await Team.create({
    name: req.body.name,
    description: req.body.description || '',
    leader: req.user._id,
    members: [req.user._id],
    membersCount: 1,
    maxSize: req.body.maxSize || 5,
    club: req.body.club || null,
    inviteCode: crypto.randomBytes(6).toString('hex'),
    activity: [{ actor: req.user._id, message: `${req.user.name} created the team` }],
  });

  await awardPoints({
    userId: req.user._id,
    amount: 10,
    type: 'team_create',
    reason: `Created team ${team.name}`,
    sourceType: 'team',
    sourceId: team._id,
    idempotencyKey: `team-create:${team._id}`,
  }).catch(() => null);

  return sendSuccess(res, { team }, 201);
});

export const listMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ members: req.user._id })
    .populate('leader', 'name avatarUrl')
    .populate('members', 'name avatarUrl points level')
    .sort({ createdAt: -1 });
  return sendSuccess(res, teams);
});

export const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('leader', 'name avatarUrl points level')
    .populate('members', 'name avatarUrl points level department year')
    .populate('club', 'name slug logoUrl');
  if (!team) throw ApiError.notFound('Team not found');

  const [invitations, participations] = await Promise.all([
    TeamInvitation.find({ team: team._id, status: 'pending' }).populate('invitee', 'name email avatarUrl'),
    ChallengeParticipation.find({ team: team._id })
      .populate('challenge', 'title category difficulty rewardPoints deadline status')
      .sort({ createdAt: -1 }),
  ]);

  const memberIds = team.members.map((member) => String(member._id ?? member));
  const score = team.members.reduce((sum, member) => sum + (member.points || 0), 0);

  return sendSuccess(res, {
    team,
    invitations,
    participations,
    score,
    isMember: memberIds.includes(String(req.user._id)),
    isLeader: String(team.leader?._id || team.leader) === String(req.user._id),
  });
});

export const inviteToTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.leader) !== String(req.user._id)) throw ApiError.forbidden('Only the team leader can invite students');
  if (team.status !== 'active') throw ApiError.badRequest('This team is not active');
  if (team.membersCount >= team.maxSize) throw ApiError.badRequest('This team is already full');

  const invitee = req.body.userId
    ? await User.findById(req.body.userId)
    : await User.findOne({ email: req.body.email });
  if (!invitee) throw ApiError.notFound('Student not found');
  if (team.members.some((member) => String(member) === String(invitee._id))) {
    throw ApiError.conflict('That student is already on the team');
  }
  if (invitee.suspended) throw ApiError.badRequest('That account is suspended');

  const invitation = await TeamInvitation.create({
    team: team._id,
    inviter: req.user._id,
    invitee: invitee._id,
    message: req.body.message || '',
  }).catch((error) => {
    if (error.code === 11000) throw ApiError.conflict('An invitation is already pending');
    throw error;
  });

  await createNotification({
    user: invitee._id,
    type: 'team_invitation',
    title: `Team invitation: ${team.name}`,
    message: `${req.user.name} invited you to join ${team.name}.`,
    link: '/teams/invitations',
    meta: { teamId: String(team._id), invitationId: String(invitation._id) },
  });

  team.activity.push({ actor: req.user._id, message: `Invited ${invitee.name} to the team` });
  await team.save();

  return sendSuccess(res, { invitation }, 201);
});

export const listMyInvitations = asyncHandler(async (req, res) => {
  const invitations = await TeamInvitation.find({ invitee: req.user._id, status: 'pending' })
    .populate('team', 'name description membersCount maxSize points')
    .populate('inviter', 'name avatarUrl')
    .sort({ createdAt: -1 });
  return sendSuccess(res, invitations);
});

export const respondToInvitation = asyncHandler(async (req, res) => {
  const invitation = await TeamInvitation.findById(req.params.id).populate('team');
  if (!invitation) throw ApiError.notFound('Invitation not found');
  if (String(invitation.invitee) !== String(req.user._id)) throw ApiError.forbidden('This invitation is not yours');
  if (invitation.status !== 'pending') throw ApiError.badRequest('This invitation has already been answered');

  if (req.body.decision === 'rejected') {
    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();
    await createNotification({
      user: invitation.inviter,
      type: 'team_invitation',
      title: 'Team invitation declined',
      message: `${req.user.name} declined your invitation.`,
      link: `/teams/${invitation.team._id}`,
    });
    return sendSuccess(res, { invitation });
  }

  const team = invitation.team;
  if (team.members.some((member) => String(member) === String(req.user._id))) {
    throw ApiError.conflict('You are already a member of this team');
  }
  const existingTeam = await Team.findOne({ members: req.user._id, status: 'active' });
  if (existingTeam && String(existingTeam._id) !== String(team._id)) {
    throw ApiError.badRequest('Leave your current team before joining another');
  }

  const updated = await Team.findOneAndUpdate(
    { _id: team._id, status: 'active' },
    { $addToSet: { members: req.user._id }, $inc: { membersCount: 1 } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict('This team is already full');

  invitation.status = 'accepted';
  invitation.respondedAt = new Date();
  await invitation.save();
  await TeamInvitation.updateMany(
    { invitee: req.user._id, status: 'pending', _id: { $ne: invitation._id } },
    { status: 'cancelled', respondedAt: new Date() },
  );

  updated.activity.push({ actor: req.user._id, message: `${req.user.name} joined the team` });
  await updated.save();

  await createNotification({
    user: invitation.inviter,
    type: 'team_invitation',
    title: 'Invitation accepted',
    message: `${req.user.name} joined ${team.name}.`,
    link: `/teams/${team._id}`,
  });
  emitToUser(invitation.inviter, 'team:update', { teamId: String(team._id) });

  return sendSuccess(res, { team: updated, invitation });
});

export const cancelInvitation = asyncHandler(async (req, res) => {
  const invitation = await TeamInvitation.findById(req.params.id);
  if (!invitation) throw ApiError.notFound('Invitation not found');
  const team = await Team.findById(invitation.team);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.leader) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only the team leader can cancel invitations');
  }
  invitation.status = 'cancelled';
  invitation.respondedAt = new Date();
  await invitation.save();
  return sendSuccess(res, { invitation });
});

export const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.leader) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only the team leader can remove members');
  }
  const targetId = req.params.userId;
  if (String(team.leader) === String(targetId)) {
    throw ApiError.badRequest('Transfer leadership before removing the team leader');
  }
  if (!team.members.some((member) => String(member) === targetId)) {
    throw ApiError.notFound('That student is not on this team');
  }

  const updated = await Team.findOneAndUpdate(
    { _id: team._id, members: targetId },
    { $pull: { members: targetId }, $inc: { membersCount: -1 } },
    { new: true },
  );
  if (!updated) throw ApiError.badRequest('Could not remove that member');
  await refreshTeamMemberCount(updated._id);
  updated.activity.push({ actor: req.user._id, message: 'A member was removed from the team' });
  await updated.save();

  await createNotification({
    user: targetId,
    type: 'team_invitation',
    title: `Removed from ${team.name}`,
    message: 'The team leader removed you from the team.',
    link: '/teams',
  });
  emitToUser(targetId, 'team:update', { teamId: String(team._id), removed: true });

  return sendSuccess(res, { team: updated });
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  if (!team.members.some((member) => String(member) === String(req.user._id))) {
    throw ApiError.badRequest('You are not on this team');
  }
  if (String(team.leader) === String(req.user._id)) {
    throw ApiError.badRequest('Team leaders must transfer leadership or archive the team');
  }

  const updated = await Team.findOneAndUpdate(
    { _id: team._id, members: req.user._id },
    { $pull: { members: req.user._id }, $inc: { membersCount: -1 } },
    { new: true },
  );
  await refreshTeamMemberCount(updated._id);
  updated.activity.push({ actor: req.user._id, message: `${req.user.name} left the team` });
  await updated.save();
  await createNotification({
    user: team.leader,
    type: 'team_invitation',
    title: 'Team member left',
    message: `${req.user.name} left ${team.name}.`,
    link: `/teams/${team._id}`,
  });
  return sendSuccess(res, { team: updated });
});

export const transferLeadership = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.leader) !== String(req.user._id)) throw ApiError.forbidden('Only the team leader can transfer leadership');
  const { userId } = req.body;
  if (!team.members.some((member) => String(member) === String(userId))) {
    throw ApiError.badRequest('Choose a current team member');
  }
  team.leader = userId;
  team.activity.push({ actor: req.user._id, message: 'Team leadership was transferred' });
  await team.save();
  await TeamInvitation.updateMany(
    { team: team._id, status: 'pending' },
    { status: 'cancelled', respondedAt: new Date() },
  );
  await createNotification({
    user: userId,
    type: 'team_invitation',
    title: `You now lead ${team.name}`,
    message: 'Team leadership was transferred to you.',
    link: `/teams/${team._id}`,
  });
  return sendSuccess(res, { team });
});

export const archiveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw ApiError.notFound('Team not found');
  if (String(team.leader) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only the team leader can archive the team');
  }
  team.status = 'archived';
  await team.save();
  await TeamInvitation.updateMany({ team: team._id, status: 'pending' }, { status: 'cancelled', respondedAt: new Date() });
  return sendSuccess(res, { team });
});

export const teamProgress = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id).populate('members', 'name avatarUrl points');
  if (!team) throw ApiError.notFound('Team not found');
  const participations = await ChallengeParticipation.find({ team: team._id })
    .populate('challenge', 'title rewardPoints status')
    .sort({ createdAt: -1 });
  const completed = participations.filter((entry) => entry.status === 'approved').length;
  const score = team.members.reduce((sum, member) => sum + (member.points || 0), 0);
  return sendSuccess(res, {
    team: { id: team._id, name: team.name, membersCount: team.membersCount, maxSize: team.maxSize },
    score,
    completed,
    joined: participations.length,
    participations,
  });
});
