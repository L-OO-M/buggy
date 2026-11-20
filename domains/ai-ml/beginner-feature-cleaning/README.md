# Beginner: Feature Cleaning

**Level:** Beginner  |  **Time:** 45–90 minutes  |  **Libraries:** pandas, pytest

You are given a small feature-cleaning module that *looks* fine but produces
wrong or unstable results. Your job is to find the bugs and fix them in
`clean_features.py` until every test passes.

## What you will practise

- Choosing the right fill value for missing data (and why outliers matter)
- Learning statistics from **training data only**
- Not changing the caller's data by accident
- Building a **stable schema**: same columns, same order, every time
- Handling categories the model has never seen

## Setup

```bash
cd domains/ai-ml/beginner-feature-cleaning
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest
```

At the start, several tests fail. That is expected.

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `clean_features.py` | Starter implementation (contains the bugs) | **Yes** |
| `test_clean_features.py` | Specification of correct behaviour | **No** |

## Expected behaviour

| Function | Contract |
| --- | --- |
| `learn_fill_values(train_df, numeric_cols, categorical_cols)` | Returns a dict. Numeric column → **median**. Categorical column → **most frequent value**. A column with no values at all must raise `ValueError`. |
| `apply_fill_values(df, fill_values)` | Returns a **new** DataFrame with no missing values in the given columns. The input is **never modified**. |
| `encode_categoricals(df, categorical_cols, categories=None)` | One-hot encodes. If `categories` is given, it is used as-is. Otherwise it is learned from `df`. Returns `(encoded_df, categories)`. Output columns are integers (0/1), in a fixed order. A value not in `categories` becomes all zeros. |
| `clean_features(train_df, test_df, numeric_cols, categorical_cols)` | Cleans both sets using information from **train only**. Both outputs have identical columns in identical order. |

## Symptoms you should notice

- A single extreme value (e.g. age 200) drags the fill value far from typical.
- After cleaning, your original DataFrame has changed.
- Train and test end up with different columns after encoding.
- Test data changes what gets filled into train data.
- One-hot columns come out as `True/False` instead of `0/1`.

<details>
<summary>Hints (open only if stuck for 15+ minutes)</summary>

1. Compare `mean()` and `median()` on `[25, 30, 40, 200]`.
2. `inplace=True` changes the caller's data. Use `.copy()`.
3. `pd.get_dummies` decides columns from the data it sees. Build the columns yourself from a saved list of categories.
4. Ask: *"Would this number be available at prediction time?"* If not, do not learn from it.
5. `(series == level).astype(int)` is a simple, safe way to build one column.

</details>

## Definition of done

- [ ] `pytest` shows all tests passing
- [ ] You did not edit `test_clean_features.py`
- [ ] You can explain each bug in one sentence

## Next

Move on to [`../moderate-model-evaluation/`](../moderate-model-evaluation/).
