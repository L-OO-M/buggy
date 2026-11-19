export function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function uniqueIds(values = []) {
  return [...new Set(values.map((value) => String(value)))];
}

export function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}
