import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trophy, Trash2, UserPlus } from 'lucide-react';
import { notificationsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
} from '../../components/ui.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

const iconFor = {
  team_invitation: UserPlus,
  achievement: Trophy,
  submission_status: CheckCheck,
  announcement: Bell,
  club: UserPlus,
  registration: Bell,
};

export default function Notifications() {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refresh } = useApi(
    () => notificationsApi.list({ unread: filter === 'unread' ? 'true' : undefined, page, limit: 15 }),
    [filter, page],
  );
  const [busy, setBusy] = useState(false);

  const markAll = async () => {
    setBusy(true);
    try {
      await notificationsApi.markAllRead();
      toast.success('All notifications marked as read.');
      await refresh();
      window.dispatchEvent(new CustomEvent('campusquest:notifications-read'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const markOne = async (notification) => {
    if (notification.read) return;
    try {
      await notificationsApi.markRead(notification._id);
      await refresh();
      window.dispatchEvent(new CustomEvent('campusquest:notifications-read'));
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  };

  const remove = async (notification) => {
    try {
      await notificationsApi.remove(notification._id);
      toast.info('Notification removed.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Invitations, submission decisions, achievements, and organizer announcements."
        actions={<Button variant="secondary" loading={busy} onClick={markAll}><CheckCheck size={15} /> Mark all read</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" className={`chip ${filter === 'all' ? 'chip-active' : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
        <button type="button" className={`chip ${filter === 'unread' ? 'chip-active' : ''}`} onClick={() => { setFilter('unread'); setPage(1); }}>Unread {meta?.unread ? `(${meta.unread})` : ''}</button>
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={Bell} title="You are all caught up" description="New invitations, challenge decisions, and reminders will appear here." />
      ) : null}

      <div className="space-y-2">
        {data?.map((notification) => {
          const Icon = iconFor[notification.type] || Bell;
          return (
            <div key={notification._id} className={`surface flex items-start gap-3 p-4 ${notification.read ? '' : 'border-brand-200 bg-brand-50/40 dark:border-brand-400/20 dark:bg-brand-500/5'}`}>
              <span className={`mt-0.5 inline-flex rounded-xl p-2 ${notification.read ? 'bg-ink-100 text-ink-400 dark:bg-white/10' : 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'}`}>
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink-900 dark:text-white">{notification.title}</p>
                  {!notification.read ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-label="Unread" /> : null}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{titleCase(notification.type)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{notification.message}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
                  <span>{formatRelative(notification.createdAt)}</span>
                  {notification.link ? (
                    <Link to={notification.link} onClick={() => markOne(notification)} className="font-semibold text-brand-600 dark:text-brand-300">
                      Open
                    </Link>
                  ) : null}
                  {!notification.read ? (
                    <button type="button" onClick={() => markOne(notification)} className="font-semibold text-ink-500 hover:text-ink-800 dark:text-ink-400">Mark read</button>
                  ) : null}
                </div>
              </div>
              <button type="button" onClick={() => remove(notification)} className="rounded-lg p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label="Delete notification">
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
