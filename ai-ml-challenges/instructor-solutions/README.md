# Instructor solutions (DO NOT PUBLISH)

Reference solutions for the three `domains/ai-ml` projects. Keep this folder
out of the student repository. Each file replaces the starter of the same name.

| Project | Solution file | Replaces |
| --- | --- | --- |
| Beginner | `beginner-feature-cleaning/clean_features.py` | `domains/ai-ml/beginner-feature-cleaning/clean_features.py` |
| Moderate | `moderate-model-evaluation/train.py` | `domains/ai-ml/moderate-model-evaluation/train.py` |
| Hard | `hard-production-pipeline/fraud_pipeline.py` | `domains/ai-ml/hard-production-pipeline/fraud_pipeline.py` |

## Verified results (Python 3.12, pandas 3.0, scikit-learn 1.9)

| Project | Starter | With solution |
| --- | --- | --- |
| Beginner | 9 of 18 tests fail | 18 pass |
| Moderate | 12 or 13 of 18 fail (the starter split is unseeded, so one test is random) | 18 pass |
| Hard | 21 of 32 tests fail | 32 pass |

## Bugs planted in each starter

**Beginner:** mean instead of median; in-place mutation; `get_dummies` gives
unstable columns and bool dtype; fill values learned from train+test.

**Moderate:** no stratify, no seed; scaler fitted before the split; accuracy as
the only metric; no class weights; plain `KFold` with pre-scaled data.

**Hard:** no input validation; strict `OneHotEncoder`; no categorical imputer;
no class weights; threshold hardcoded to 0.5; threshold ignored in `predict`;
index lost; bare model saved with no threshold or version.
