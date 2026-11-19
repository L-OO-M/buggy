# CSV averages with missing scores

## What is broken

`average_by_student(rows)` summarises a CSV of student scores. A blank `score`
means "not submitted", not zero, but the current code converts it to `0.0` and
includes it in the average. A student with one 80 and one blank therefore shows
40 instead of 80, and the class average is dragged down by work nobody did.

`average_by_student` therefore returns wrong numbers for the fixture in
`scores.csv`. The parsing itself is fine.

## How to run

Python 3.9 or newer. No third-party packages.

```bash
cd domains/ai-ml/csv-null-rows
python -m unittest -v
```

Expected before the fix: at least one failing assertion in
`test_aggregate.py`.

## Expected behaviour

- A blank or whitespace-only `score` is **missing**: skip that row entirely.
- A student with only missing scores is omitted from the result.
- A student with numeric scores is averaged over those scores only.
- Returned averages are rounded to 2 decimal places.
- A non-numeric, non-blank score such as `"eighty"` may raise `ValueError`; do
  not silently turn it into zero.
- Row order must not change the result.

## How to verify a fix

```bash
python -m unittest -v
```

All tests pass. Then check the fixture by hand: `aarav` has `80` and one blank,
so the answer is `80.0`, not `40.0`.

## Files

| File | Purpose |
| --- | --- |
| `aggregate.py` | the implementation |
| `test_aggregate.py` | executable expected behaviour |
| `scores.csv` | a real fixture with missing values |
