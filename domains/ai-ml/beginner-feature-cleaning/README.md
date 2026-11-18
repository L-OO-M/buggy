# Beginner: Feature Cleaning

Build a reliable preprocessing step for a small customer dataset. The starter
implementation looks plausible, but it mishandles missing values and produces
features whose schema changes between calls.

## Learning goals

- Inspect tabular data and identify numeric versus categorical features.
- Handle missing values without changing the public feature contract.
- Produce deterministic, model-ready data.

## Run

```bash
python -m pip install -r requirements.txt
python -m pytest
python clean_features.py
```

## Challenge

Fix `clean_features.py` so that `clean_features`:

1. Returns the columns `age`, `monthly_spend`, `plan_basic`, and
   `plan_premium`, in that order.
2. Uses numeric medians for missing numeric values.
3. Encodes the known plans consistently, including when a batch contains only
   one plan.
4. Rejects missing required columns with a useful `ValueError`.

Do not edit the tests to hide a failure. The implementation must work for
empty categories and for rows containing missing values.

## Expected result

The command prints a stable feature table with no missing values and exits with
status code `0`. The tests describe the exact behavior expected from the
cleaning function.
