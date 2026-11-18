"""Feature cleaning challenge for a small customer dataset."""

from __future__ import annotations

import pandas as pd

REQUIRED_COLUMNS = ("age", "monthly_spend", "plan")
FEATURE_COLUMNS = ("age", "monthly_spend", "plan_basic", "plan_premium")


def clean_features(customers: pd.DataFrame) -> pd.DataFrame:
    """Return deterministic numeric features for customer records.

    This starter implementation contains intentional bugs for learners to
    diagnose and fix.
    """
    if not set(REQUIRED_COLUMNS).issubset(customers.columns):
        raise ValueError("customer data is missing required columns")

    features = customers.copy()
    features["age"] = features["age"].fillna(features["age"].median())
    features["monthly_spend"] = features["monthly_spend"].fillna(
        features["monthly_spend"].median()
    )
    encoded = pd.get_dummies(features["plan"], prefix="plan", dtype=int).reindex(
        columns=["plan_basic", "plan_premium"], fill_value=0
    )
    return pd.concat(
        [features[["age", "monthly_spend"]], encoded], axis=1
    )[list(FEATURE_COLUMNS)]


if __name__ == "__main__":
    sample = pd.DataFrame(
        {
            "age": [24, None, 41],
            "monthly_spend": [19.99, 44.50, None],
            "plan": ["basic", "premium", "basic"],
        }
    )
    print(clean_features(sample).to_string(index=False))
