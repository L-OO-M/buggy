# Moderate: Honest Model Evaluation

Repair a binary-classification training script for a support-ticket triage
model. The starter script leaks the target into training and reports a score
that does not represent unseen data.

## Learning goals

- Separate features and target before preprocessing.
- Keep preprocessing inside a scikit-learn `Pipeline`.
- Use a stratified holdout and report a meaningful metric.
- Make evaluation reproducible.

## Run

```bash
python -m pip install -r requirements.txt
python -m pytest
python train.py
```

## Challenge

Fix `train.py` so `train_and_evaluate`:

- never uses `resolved` as a model feature;
- fits transformations only on the training partition;
- uses a stratified, reproducible split;
- returns an accuracy and ROC-AUC between `0` and `1`;
- returns the fitted pipeline and untouched test data for inspection.

The tests intentionally include a distribution shift and a target-correlated
column. A suspiciously perfect score is a sign that leakage remains.

## Expected result

The tests pass and the CLI prints a JSON report containing `accuracy`,
`roc_auc`, and the number of test rows. The model should perform well without
requiring the answer as an input.
