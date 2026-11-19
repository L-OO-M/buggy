import { Server } from 'socket.io';
import env from '../config/env.js';
import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { setSocketServer } from './emitter.js';

export function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub).select('name role suspended');
      if (!user || user.suspended) return next(new Error('Account unavailable'));
      socket.user = { id: String(user._id), name: user.name, role: user.role };
      return next();
    } catch {
      return next(new Error('Invalid session'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('leaderboard:subscribe', (_payload, ack) => {
      socket.join('leaderboard');
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('leaderboard:unsubscribe', () => {
      socket.leave('leaderboard');
    });

    socket.on('challenge:subscribe', (challengeId, ack) => {
      if (typeof challengeId !== 'string') return;
      socket.join(`challenge:${challengeId}`);
      if (typeof ack === 'function') ack({ ok: true });
    });
  });

  setSocketServer(io);
  return io;
}
