let ioRef = null;

export function setSocketServer(io) {
  ioRef = io;
}

export function getSocketServer() {
  return ioRef;
}

export function emitToUser(userId, event, payload) {
  if (!ioRef) return;
  ioRef.to(`user:${String(userId)}`).emit(event, payload);
}

export function emitToRoom(room, event, payload) {
  if (!ioRef) return;
  ioRef.to(room).emit(event, payload);
}

export function broadcastLeaderboard(payload) {
  emitToRoom('leaderboard', 'leaderboard:update', payload);
}
