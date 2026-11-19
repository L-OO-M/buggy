import { Team } from '../models/Team.js';

export async function refreshTeamMemberCount(teamId) {
  const team = await Team.findById(teamId).select('members');
  if (!team) return null;
  const count = Array.isArray(team.members) ? team.members.length : 0;
  await Team.updateOne({ _id: teamId }, { membersCount: count });
  return count;
}
