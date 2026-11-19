import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { notificationsApi } from '../api/index.js';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refresh = () => {
      notificationsApi
        .unreadCount()
        .then(({ unread: count }) => setUnread(count))
        .catch(() => null);
    };
    refresh();
    window.addEventListener('campusquest:notifications-read', refresh);
    return () => window.removeEventListener('campusquest:notifications-read', refresh);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (notification) => {
      setUnread((current) => current + 1);
      toast.info(notification.title || 'New notification', { title: 'CampusQuest' });
    };
    const refresh = () => {
      notificationsApi
        .unreadCount()
        .then(({ unread: count }) => setUnread(count))
        .catch(() => null);
    };
    socket.on('notification:new', handler);
    socket.on('connect', refresh);
    return () => {
      socket.off('notification:new', handler);
      socket.off('connect', refresh);
    };
  }, [socket, toast]);

  return (
    <Link
      to="/notifications"
      className="relative rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
    >
      <Bell size={19} />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
