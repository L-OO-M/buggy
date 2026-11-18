# Moderate: Model Evaluation Without Fooling Yourself

**Level:** Moderate  |  **Time:** 1–2 hours  |  **Libraries:** scikit-learn, pandas, pytest
**Prerequisite:** finish [`../beginner-feature-cleaning/`](../beginner-feature-cleaning/) first.

A fraud-style dataset has about **10% positives**. The starter script reports a
good-looking number. That number is misleading. Fix the script so the
evaluation is honest.

## What you will practise

- Why **accuracy is a trap** on imbalanced data
- **Data leakage**: preprocessing that peeks at test data
- Stratified splits and reproducible seeds
- Cross-validation that does not leak and does not silently break
- Choosing metrics that match the real goal (finding the minority class)

## Setup

```bash
cd domains/ai-ml/moderate-model-evaluation
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest
```

Several tests fail at the start. That is expected.

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `train.py` | Starter script. Functions marked "provided" are correct. | **Yes** (except provided parts) |
| `test_train.py` | Specification of correct behaviour | **No** |

## Expected behaviour

| Function | Contract |
| --- | --- |
| `split_data` | Train/test split that keeps the class ratio in both parts. Same seed → same split. Different seed → different split. |
| `build_model` | Returns an **unfitted** model that includes its own scaling, so raw data can go in. Must handle imbalance. |
| `compute_metrics` | Returns floats for `accuracy`, `balanced_accuracy`, `precision`, `recall`, `f1`, `roc_auc`. When there are no positive predictions, precision and F1 are `0.0`, with no crash. |
| `fit_and_evaluate` | Splits first, then fits everything (including scaling) on **train only**. Evaluates on test. Does not change the input data. Same seed → same result. |
| `cross_validate_model` | Returns `f1_mean`, `f1_std`, `roc_auc_mean`, `roc_auc_std`. Scaling happens **inside** each fold. Every fold has both classes, even if the rows are sorted by label. Same seed → same result. |

## Symptoms you should notice

- The reported accuracy looks high, but the model may find almost no positives.
- Running the script twice gives different numbers.
- The scaler "knows" the mean of the test set.
- Cross-validation on a sorted file gives `nan` or crashes.

## Questions to answer in your own words

1. `majority_baseline` scores about 0.90 accuracy. Why is that useless?
2. Your fixed model will have **lower accuracy** than that baseline. Why is it still the better model?
3. Why does scaling before splitting count as leakage if it uses no labels?
4. When would you care more about precision than recall? Give a real example.

<details>
<summary>Hints (open only if stuck for 15+ minutes)</summary>

1. `train_test_split` has `stratify=` and `random_state=` arguments.
2. `sklearn.pipeline.Pipeline` lets you chain a scaler and a model into one object. Fit the pipeline, and the scaler only ever sees the training rows.
3. `LogisticRegression(class_weight="balanced")` makes mistakes on the rare class cost more.
4. `StratifiedKFold(shuffle=True, random_state=...)` plus `cross_validate(..., scoring=["f1", "roc_auc"])`.
5. Pass the **whole pipeline** to cross-validation, not pre-scaled data.

</details>

## Definition of done

- [ ] `pytest` shows all tests passing
- [ ] You did not edit `test_train.py` or the "provided" functions
- [ ] You answered the four questions above in writing

## Next

Move on to [`../hard-production-pipeline/`](../hard-production-pipeline/).
