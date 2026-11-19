import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/emitter.js';

export async function createNotification({ user, type = 'system', title, message, link = '', meta = {} }) {
  const notification = await Notification.create({ user, type, title, message, link, meta });
  emitToUser(user, 'notification:new', notification.toJSON());
  return notification;
}

export async function notifyMany(userIds, payload) {
  return Promise.all(userIds.map((user) => createNotification({ ...payload, user })));
}
