import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }
    const instance = io(import.meta.env.VITE_SOCKET_URL || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    setSocket(instance);
    return () => {
      instance.disconnect();
    };
  }, [token, isAuthenticated]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used inside SocketProvider');
  return context;
}
