import { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useDebounced } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
} from '../../components/ui.jsx';
import { formatDate, roleLabel } from '../../utils/format.js';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const search = useDebounced(q, 300);
  const { data, meta, loading, error, refresh } = useApi(() => adminApi.users({ q: search || undefined, role: role || undefined, page, limit: 20 }), [search, role, page]);

  const update = async (user, payload) => {
    setBusyId(user._id);
    try {
      await adminApi.updateUser(user._id, payload);
      toast.success('User updated.');
      await refresh();
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" description="Search accounts, adjust roles, and suspend policy violators." />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} className="input pl-9" placeholder="Search name, email, or campus" />
          </div>
          <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="sm:max-w-[180px]">
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="organizer">Organizers</option>
            <option value="admin">Admins</option>
          </Select>
        </div>
      </Card>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={UserCog} title="No users found" /> : null}

      <div className="space-y-2">
        {data?.map((user) => {
          const isSelf = user._id === me?._id;
          return (
            <Card key={user._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={user.name} src={user.avatarUrl} size={40} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{user.name}</p>
                    {user.suspended ? <Badge tone="danger">Suspended</Badge> : null}
                    {isSelf ? <Badge tone="info">You</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-ink-400">{user.email} · {user.campus} · joined {formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={user.role} disabled={isSelf || busyId === user._id} onChange={(event) => update(user, { role: event.target.value })} className="w-32 text-xs">
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </Select>
                <span className="hidden text-xs text-ink-400 md:inline">{user.points} pts</span>
                <Button size="sm" variant={user.suspended ? 'secondary' : 'danger'} disabled={isSelf} loading={busyId === user._id} onClick={() => update(user, { suspended: !user.suspended })}>
                  {user.suspended ? <><ShieldCheck size={14} /> Reinstate</> : <><ShieldAlert size={14} /> Suspend</>}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Pagination meta={meta} onPage={setPage} />
      <p className="mt-4 text-xs text-ink-400">Current role: {roleLabel(me?.role)}. You cannot change your own role or suspend yourself.</p>
    </div>
  );
}
