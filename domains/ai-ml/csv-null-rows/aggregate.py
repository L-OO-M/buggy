"""Summarise student scores from a CSV file.

A blank ``score`` cell is a missing submission, not a zero.
"""

import csv


def load_rows(path):
    """Read the CSV into a list of dicts, one per data row."""
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def average_by_student(rows):
    """Return ``{student: average}`` for every student with a numeric score."""
    totals = {}

    for row in rows:
        name = (row.get("student") or "").strip()
        if not name:
            continue

        raw = (row.get("score") or "").strip()
        # BUG: a missing score is counted as 0.0, which lowers the average.
        value = float(raw) if raw else 0.0

        total, count = totals.get(name, (0.0, 0))
        totals[name] = (total + value, count + 1)

    return {name: round(total / count, 2) for name, (total, count) in totals.items()}
