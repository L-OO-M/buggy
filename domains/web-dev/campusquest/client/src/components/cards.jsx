import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock, MapPin, Trophy, Users, Zap } from 'lucide-react';
import { Avatar, CategoryBadge, DifficultyBadge, ProgressBar, StatusBadge } from './ui.jsx';
import { formatDate, formatRelative, percent } from '../utils/format.js';

function Cover({ src, title, className = 'h-40' }) {
  if (src) return <img src={src} alt="" className={`w-full object-cover ${className}`} loading="lazy" />;
  const seed = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palettes = [
    'from-brand-500 via-indigo-500 to-fuchsia-500',
    'from-emerald-500 via-teal-500 to-sky-500',
    'from-amber-400 via-orange-500 to-rose-500',
    'from-sky-500 via-blue-500 to-indigo-600',
    'from-fuchsia-500 via-pink-500 to-rose-500',
  ];
  return (
    <div className={`relative flex w-full items-end bg-gradient-to-br ${palettes[seed % palettes.length]} p-4 ${className}`}>
      <div className="absolute inset-0 hero-grid opacity-30" />
      <p className="relative font-display text-lg font-bold leading-snug text-white drop-shadow">{title}</p>
    </div>
  );
}

export function EventCard({ event }) {
  const fill = percent(event.registrationCount, event.capacity);
  return (
    <Link
      to={`/events/${event._id}`}
      className="group surface flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative">
        <Cover src={event.coverUrl} title={event.title} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <CategoryBadge category={event.category} />
        </div>
        <div className="absolute right-3 top-3">
          <StatusBadge status={event.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-300">
          <CalendarDays size={14} />
          {formatDate(event.startDate, { weekday: 'short' })}
          <span className="text-ink-300">·</span>
          <Clock size={14} />
          {formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-base font-bold text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
          {event.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
          <MapPin size={13} /> {event.venue}
        </p>
        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex justify-between text-[11px] text-ink-400">
            <span>{event.registrationCount} / {event.capacity} registered</span>
            <span className="inline-flex items-center gap-1 font-semibold text-accent"><Zap size={11} /> {event.points} pts</span>
          </div>
          <ProgressBar value={fill} tone={fill >= 90 ? 'danger' : fill >= 65 ? 'warning' : 'brand'} />
        </div>
      </div>
    </Link>
  );
}

export function ClubCard({ club }) {
  return (
    <Link
      to={`/clubs/${club.slug || club._id}`}
      className="group surface flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 font-display text-lg font-bold text-white">
            {club.name?.[0]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {club.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500 dark:text-ink-400">{club.tagline || 'Student club'}</p>
        </div>
        <ArrowUpRight size={17} className="text-ink-300 transition group-hover:text-brand-500" />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{club.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <CategoryBadge category={club.category} />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-ink-300">
          <Users size={14} /> {club.membersCount} members
        </span>
      </div>
    </Link>
  );
}

export function ChallengeCard({ challenge, compact = false }) {
  const closed = new Date(challenge.deadline) < new Date() || challenge.status === 'closed';
  return (
    <Link
      to={`/challenges/${challenge._id}`}
      className="group surface flex flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge category={challenge.category} />
        <DifficultyBadge difficulty={challenge.difficulty} />
      </div>
      <h3 className="mt-3 line-clamp-2 font-display text-base font-bold text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
        {challenge.title}
      </h3>
      {!compact ? (
        <p className="mt-2 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{challenge.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 font-medium dark:bg-white/10">
          <Users size={12} /> {challenge.type}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 font-medium dark:bg-white/10">
          <Users size={12} /> {challenge.participationCount}/{challenge.maxParticipants}
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            {closed ? 'Closed' : 'Deadline'}
          </p>
          <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">
            {closed ? formatDate(challenge.deadline) : formatRelative(challenge.deadline)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Trophy size={14} /> {challenge.rewardPoints}
        </span>
      </div>
    </Link>
  );
}

export function TeamCard({ team }) {
  const members = team.members || [];
  return (
    <Link
      to={`/teams/${team._id}`}
      className="group surface block p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
            {team.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-500 dark:text-ink-400">{team.description || 'Campus team'}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <Trophy size={12} /> {team.points ?? team.score ?? 0}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <Avatar key={member._id || member} name={member.name || '?'} src={member.avatarUrl} size={28} className="ring-2" />
          ))}
          {team.membersCount > 4 ? (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-200 text-[10px] font-bold text-ink-600 dark:bg-white/10 dark:text-ink-300">
              +{team.membersCount - 4}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-ink-400">
          {team.membersCount}/{team.maxSize} members
        </span>
      </div>
    </Link>
  );
}
