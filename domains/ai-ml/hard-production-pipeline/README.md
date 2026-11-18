# Hard: Production-Ready Prediction Pipeline

Harden an imbalanced fraud-risk pipeline that must behave identically in
training and inference. The starter implementation has three production
failures: it learns a decision threshold from the test set, mishandles
unknown categories, and returns unstable output when a feature is missing.

## Learning goals

- Use leakage-safe cross-validation and a calibrated decision threshold.
- Build one persisted preprocessing/model pipeline for inference.
- Validate input contracts and preserve prediction order.
- Optimize for recall while keeping false positives measurable.

## Run

```bash
python -m pip install -r requirements.txt
python -m pytest
python fraud_pipeline.py
```

## Challenge

Fix `fraud_pipeline.py` so that:

1. `fit_model` learns preprocessing and the threshold from training data only.
2. `predict` accepts unseen merchant categories without crashing.
3. Missing required features raise `ValueError` rather than producing a
   misleading prediction.
4. Predictions retain the input index and contain `risk_score` and `flagged`.
5. The selected threshold is between `0` and `1` and is not hard-coded.

The test suite checks leakage boundaries, unknown categories, input validation,
and output shape. Do not solve the challenge by weakening those checks.

## Expected result

The complete pipeline can be fit once and used on new batches with different
merchant categories. It returns deterministic, indexed predictions and exposes
the threshold used for the operational decision.
