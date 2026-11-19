import api, { unwrap, unwrapWithMeta } from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
};

export const usersApi = {
  stats: () => api.get('/users/me/stats').then(unwrap).then((payload) => payload.stats),
  updateMe: (payload) => api.patch('/users/me', payload).then(unwrap),
  points: (params) => api.get('/users/me/points', { params }).then(unwrapWithMeta),
  submissions: (params) => api.get('/users/me/submissions', { params }).then(unwrapWithMeta),
  profile: (id) => api.get(`/users/${id}`).then(unwrap),
};

export const eventsApi = {
  list: (params) => api.get('/events', { params }).then(unwrapWithMeta),
  mine: (params) => api.get('/events', { params: { mine: true, ...params } }).then(unwrapWithMeta),
  get: (id) => api.get(`/events/${id}`).then(unwrap),
  create: (payload) => api.post('/events', payload).then(unwrap),
  update: (id, payload) => api.patch(`/events/${id}`, payload).then(unwrap),
  cancel: (id, reason) => api.post(`/events/${id}/cancel`, { reason }).then(unwrap),
  participants: (id) => api.get(`/events/${id}/participants`).then(unwrap),
  checkInCode: (id) => api.get(`/events/${id}/checkin-code`).then(unwrap),
  rotateCheckInCode: (id) => api.post(`/events/${id}/checkin-code/rotate`).then(unwrap),
  checkInSettings: (id, payload) => api.patch(`/events/${id}/checkin-settings`, payload).then(unwrap),
  manualCheckIn: (id, payload) => api.post(`/events/${id}/checkin/manual`, payload).then(unwrap),
};

export const registrationsApi = {
  mine: (params) => api.get('/registrations/me', { params }).then(unwrapWithMeta),
  register: (eventId) => api.post(`/registrations/${eventId}`).then(unwrap),
  cancel: (eventId) => api.delete(`/registrations/${eventId}`).then(unwrap),
  checkIn: (token) => api.post('/attendance/checkin', { token }).then(unwrap),
};

export const clubsApi = {
  list: (params) => api.get('/clubs', { params }).then(unwrapWithMeta),
  mine: () => api.get('/clubs/mine').then(unwrap),
  get: (slug) => api.get(`/clubs/${slug}`).then(unwrap),
  create: (payload) => api.post('/clubs', payload).then(unwrap),
  update: (id, payload) => api.patch(`/clubs/${id}`, payload).then(unwrap),
  join: (id, message) => api.post(`/clubs/${id}/join`, { message }).then(unwrap),
  leave: (id) => api.delete(`/clubs/${id}/leave`).then(unwrap),
  requests: (id) => api.get(`/clubs/${id}/requests`).then(unwrap),
  decide: (id, userId, decision) => api.patch(`/clubs/${id}/requests/${userId}`, { decision }).then(unwrap),
  members: (id) => api.get(`/clubs/${id}/members`).then(unwrap),
  archive: (id) => api.post(`/clubs/${id}/archive`).then(unwrap),
};

export const teamsApi = {
  mine: () => api.get('/teams/mine').then(unwrap),
  get: (id) => api.get(`/teams/${id}`).then(unwrap),
  create: (payload) => api.post('/teams', payload).then(unwrap),
  invite: (id, payload) => api.post(`/teams/${id}/invite`, payload).then(unwrap),
  invitations: () => api.get('/teams/invitations').then(unwrap),
  respond: (invitationId, decision) => api.patch(`/teams/invitations/${invitationId}/respond`, { decision }).then(unwrap),
  cancelInvitation: (id) => api.delete(`/teams/invitations/${id}`).then(unwrap),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`).then(unwrap),
  leave: (id) => api.post(`/teams/${id}/leave`).then(unwrap),
  transfer: (id, userId) => api.post(`/teams/${id}/transfer`, { userId }).then(unwrap),
  archive: (id) => api.post(`/teams/${id}/archive`).then(unwrap),
  progress: (id) => api.get(`/teams/${id}/progress`).then(unwrap),
};

export const challengesApi = {
  list: (params) => api.get('/challenges', { params }).then(unwrapWithMeta),
  mine: (params) => api.get('/challenges', { params: { mine: true, ...params } }).then(unwrapWithMeta),
  get: (id) => api.get(`/challenges/${id}`).then(unwrap),
  create: (payload) => api.post('/challenges', payload).then(unwrap),
  update: (id, payload) => api.patch(`/challenges/${id}`, payload).then(unwrap),
  close: (id) => api.post(`/challenges/${id}/close`).then(unwrap),
  join: (id) => api.post(`/challenges/${id}/join`).then(unwrap),
  participations: (params) => api.get('/challenges/mine/participations', { params }).then(unwrap),
  participants: (id) => api.get(`/challenges/${id}/participants`).then(unwrap),
};

export const submissionsApi = {
  create: (payload) => api.post('/submissions', payload).then(unwrap),
  mine: (params) => api.get('/submissions/mine', { params }).then(unwrapWithMeta),
  get: (id) => api.get(`/submissions/${id}`).then(unwrap),
  reviewQueue: (params) => api.get('/submissions/review-queue', { params }).then(unwrapWithMeta),
  review: (id, payload) => api.patch(`/submissions/${id}/review`, payload).then(unwrap),
  revoke: (id, reason) => api.post(`/submissions/${id}/revoke`, { reason }).then(unwrap),
};

export const leaderboardsApi = {
  individual: (params) => api.get('/leaderboards/individual', { params }).then(unwrapWithMeta),
  teams: (params) => api.get('/leaderboards/teams', { params }).then(unwrapWithMeta),
  me: () => api.get('/leaderboards/me').then(unwrap),
};

export const achievementsApi = {
  list: () => api.get('/achievements').then(unwrap),
  mine: () => api.get('/achievements/me').then(unwrap),
  recheck: () => api.post('/achievements/recheck').then(unwrap),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrapWithMeta),
  unreadCount: () => api.get('/notifications/unread-count').then(unwrap),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.patch('/notifications/read-all').then(unwrap),
  remove: (id) => api.delete(`/notifications/${id}`).then(unwrap),
  announce: (payload) => api.post('/notifications/announcements', payload).then(unwrap),
};

export const reportsApi = {
  create: (payload) => api.post('/reports', payload).then(unwrap),
  mine: () => api.get('/reports/mine').then(unwrap),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then(unwrap),
  users: (params) => api.get('/admin/users', { params }).then(unwrapWithMeta),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then(unwrap),
  clubs: (params) => api.get('/admin/clubs', { params }).then(unwrapWithMeta),
  reviewClub: (id, decision, reason) => api.patch(`/admin/clubs/${id}`, { decision, reason }).then(unwrap),
  events: (params) => api.get('/admin/events', { params }).then(unwrapWithMeta),
  moderateEvent: (id, payload) => api.patch(`/admin/events/${id}`, payload).then(unwrap),
  challenges: (params) => api.get('/admin/challenges', { params }).then(unwrapWithMeta),
  moderateChallenge: (id, payload) => api.patch(`/admin/challenges/${id}`, payload).then(unwrap),
  submissions: (params) => api.get('/admin/submissions', { params }).then(unwrapWithMeta),
  achievements: () => api.get('/admin/achievements').then(unwrap),
  upsertAchievement: (payload) => api.post('/admin/achievements', payload).then(unwrap),
  points: (params) => api.get('/admin/points', { params }).then(unwrapWithMeta),
  adjustPoints: (payload) => api.post('/admin/points/adjust', payload).then(unwrap),
  reports: (params) => api.get('/admin/reports', { params }).then(unwrapWithMeta),
  resolveReport: (id, payload) => api.patch(`/admin/reports/${id}`, payload).then(unwrap),
  broadcast: (payload) => api.post('/admin/broadcast', payload).then(unwrap),
};
