# Hard: Production-Ready Fraud Pipeline

**Level:** Hard  |  **Time:** 2–4 hours  |  **Libraries:** scikit-learn, pandas, joblib, pytest
**Prerequisites:** finish the beginner and moderate projects first.

A card-fraud model trains fine on your laptop. In production it crashes on
new data, gives answers you did not expect, and misses most of the fraud.
Your job is to make training and inference **robust, honest, and safe to
ship**. Only about **5% of transactions are fraud**.

## What you will practise

- A **data contract**: clear rules for what input is allowed, with clear errors
- Imbalanced classification: class weights and a **tuned decision threshold**
- Unseen categories, missing values, messy text and wrong types at inference time
- Not leaking: the threshold must be chosen on data the model was **not** fitted on
- Saving a model **with** its threshold and version, and refusing to load a bad file
- Writing code that does not change the caller's data

## Setup

```bash
cd domains/ai-ml/hard-production-pipeline
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest
```

Many tests fail at the start. That is expected.

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `fraud_pipeline.py` | Starter pipeline. Sections marked `PROVIDED` are correct. Your work is below the `YOUR WORK STARTS HERE` banner. | **Yes** (only your section) |
| `test_fraud_pipeline.py` | Specification of correct behaviour | **No** |

## The contract

The contract is defined at the top of `fraud_pipeline.py`.

| Item | Rule |
| --- | --- |
| Required columns | `amount`, `account_age_days`, `tx_count_24h`, `distance_from_home_km`, `merchant_category`, `channel` |
| Target (training only) | `is_fraud`, values `0` or `1` |
| Extra columns | Allowed. They are ignored. |
| Column order | Does not matter. |
| Numeric columns | Anything not convertible to a finite number becomes missing. |
| Text columns | Trimmed and lower-cased. Empty text counts as missing. |
| Missing values | Allowed in any feature. The model must handle them. |
| Unseen categories | Allowed at prediction time. The model must not crash. |
| Missing column, empty input, wrong type of input | Raise `SchemaError` with a message that names the problem. |

## Expected behaviour

| Function | Contract |
| --- | --- |
| `validate_input(df)` | Enforces the contract. Returns a **new** frame with exactly the `FEATURES` columns, in contract order, with the same index as the input. |
| `build_model(seed)` | Unfitted pipeline. Handles missing values in numeric **and** categorical features, ignores unseen categories, and compensates for class imbalance. |
| `choose_threshold(y_true, scores)` | Returns a plain `float` in `[0, 1]` that gives the best F1. Predict fraud when `score >= threshold`. |
| `train(df, seed)` | Checks the target (only 0/1, both classes present, else `SchemaError`). Holds out 20% (stratified, seeded). Fits on the rest. Picks the threshold on the held-out part. Same seed gives the same result. |
| `predict(bundle, df)` | Returns `probability` and `label`, with the same index as the input. Uses the **bundle's** threshold. Works for a single row. Never changes the input. |
| `save_bundle` / `load_bundle` | Saves model, threshold, schema version and feature list together. Loading rejects a wrong version, a wrong feature list, or a bare model file with `SchemaError`. |

## Symptoms you should notice

- `predict` crashes on a merchant category the model has never seen.
- `predict` crashes when a categorical value is missing.
- Text like `" GROCERY "` is treated as a different category from `"grocery"`.
- Strings in numeric columns crash the model.
- Almost no fraud is flagged, even though the AUC looks fine.
- The threshold you chose is ignored after saving and loading.
- Predictions come back with a different index than the input.
- Errors from bad input are confusing and not specific.

## Questions to answer in your own words

1. The model is fitted on 80% of the data and the threshold is chosen on the other 20%. What goes wrong if you pick the threshold on the same rows you fitted on?
2. Why save the threshold and schema version **inside** the model file?
3. `joblib.load` can run arbitrary code from a file. What does that mean for loading model files someone else gave you?
4. Why is a `SchemaError` with a clear message better than letting pandas or scikit-learn fail?
5. F1 is one way to pick a threshold. Name a fraud-team situation where you would choose a different rule, and say which one.

<details>
<summary>Hints (open only if stuck for 30+ minutes)</summary>

1. Do all cleaning in `validate_input` and call it from **both** `train` and `predict`, so both paths are identical.
2. `OneHotEncoder(handle_unknown="ignore")` and a `most_frequent` imputer in front of it.
3. `pd.to_numeric(..., errors="coerce")` and `Series.str.strip().str.lower()`.
4. `LogisticRegression(class_weight="balanced")`.
5. `sklearn.metrics.precision_recall_curve` returns one more precision/recall value than thresholds. Drop the last one before computing F1.
6. In `predict`, build the result with `index=X.index`.
7. Save a `dict`, not the bare model.

</details>

## Definition of done

- [ ] `pytest` shows all tests passing
- [ ] You did not edit `test_fraud_pipeline.py` or any `PROVIDED` section
- [ ] You answered the five questions above in writing
- [ ] You can explain, in two minutes, how a bad request travels through your code
