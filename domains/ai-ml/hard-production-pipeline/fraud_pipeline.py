"""Production pipeline challenge for imbalanced fraud-risk predictions."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

FEATURES = ("amount", "account_age_days", "merchant_category")
TARGET = "is_fraud"


@dataclass
class FraudModel:
    pipeline: Pipeline
    threshold: float


def fit_model(data: pd.DataFrame) -> FraudModel:
    """Fit a fraud model and select a recall-oriented threshold."""
    missing = set((*FEATURES, TARGET)) - set(data.columns)
    if missing:
        raise ValueError(f"missing required columns: {sorted(missing)}")

    train, test = train_test_split(
        data, test_size=0.25, random_state=42, stratify=data[TARGET]
    )
    preprocessor = ColumnTransformer(
        [
            (
                "categories",
                OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1),
                ["merchant_category"],
            ),
            ("numbers", "passthrough", ["amount", "account_age_days"]),
        ]
    )
    pipeline = Pipeline(
        [
            ("preprocessor", preprocessor),
            ("classifier", HistGradientBoostingClassifier(random_state=42)),
        ]
    )
    pipeline.fit(train[list(FEATURES)], train[TARGET])

    # Intentional bug: test labels influence the production threshold.
    scores = pipeline.predict_proba(test[list(FEATURES)])[:, 1]
    threshold = _choose_threshold(test[TARGET], scores)
    return FraudModel(pipeline=pipeline, threshold=threshold)


def _choose_threshold(labels: pd.Series, scores: np.ndarray) -> float:
    candidates = np.linspace(0.1, 0.9, 17)
    recalls = [recall_score(labels, scores >= candidate, zero_division=0) for candidate in candidates]
    return float(candidates[int(np.argmax(recalls))])


def predict(model: FraudModel, transactions: pd.DataFrame) -> pd.DataFrame:
    """Return indexed fraud scores and decisions for a new transaction batch."""
    missing = set(FEATURES) - set(transactions.columns)
    if missing:
        raise ValueError(f"missing required features: {sorted(missing)}")
    scores = model.pipeline.predict_proba(transactions[list(FEATURES)])[:, 1]
    return pd.DataFrame(
        {"risk_score": scores, "flagged": scores >= model.threshold},
        index=transactions.index,
    )


if __name__ == "__main__":
    training = pd.DataFrame(
        {
            "amount": [10, 20, 200, 300, 15, 250, 30, 400],
            "account_age_days": [400, 200, 5, 10, 500, 3, 300, 1],
            "merchant_category": ["grocery", "grocery", "electronics", "travel"] * 2,
            "is_fraud": [0, 0, 1, 1, 0, 1, 0, 1],
        }
    )
    model = fit_model(training)
    print(predict(model, training.drop(columns=TARGET)).head())
