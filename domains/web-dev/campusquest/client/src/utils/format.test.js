import { describe, expect, it } from 'vitest';
import { categoryLabel } from './constants.js';
import { formatDate, initials, percent, roleLabel, titleCase } from './format.js';

describe('format helpers', () => {
  it('builds initials from the first two name parts', () => {
    expect(initials('Ava Chen')).toBe('AC');
    expect(initials('  jordan   lee  ')).toBe('JL');
    expect(initials('')).toBe('');
  });

  it('humanizes snake case labels', () => {
    expect(titleCase('checked_in')).toBe('Checked In');
    expect(titleCase('pending')).toBe('Pending');
    expect(categoryLabel('technology')).toBe('Technology');
    expect(categoryLabel('')).toBe('');
  });

  it('computes bounded percentages', () => {
    expect(percent(1, 4)).toBe(25);
    expect(percent(5, 0)).toBe(0);
    expect(percent(120, 100)).toBe(100);
  });

  it('labels roles with a readable fallback', () => {
    expect(roleLabel('admin')).toBe('Admin');
    expect(roleLabel('organizer')).toBe('Organizer');
    expect(roleLabel('custom')).toBe('custom');
  });

  it('formats valid dates and tolerates empty input', () => {
    expect(formatDate('2026-11-16T12:00:00.000Z')).toContain('2026');
    expect(formatDate(null)).toBeTruthy();
  });
});
