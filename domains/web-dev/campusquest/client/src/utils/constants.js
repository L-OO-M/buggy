export const CATEGORIES = [
  'technology',
  'sports',
  'arts',
  'academic',
  'service',
  'wellness',
  'entrepreneurship',
  'culture',
];

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'elite'];
export const EVENT_STATUS_OPTIONS = ['draft', 'published', 'cancelled'];
export const CHALLENGE_STATUS_OPTIONS = ['draft', 'published', 'closed'];
export const TEAM_TYPES = ['individual', 'team'];

export const categoryLabel = (value = '') => (value ? value[0].toUpperCase() + value.slice(1) : '');
