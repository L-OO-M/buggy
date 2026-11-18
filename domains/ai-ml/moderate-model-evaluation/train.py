"""Model-evaluation challenge with an intentionally leaky starter pipeline."""

from __future__ import annotations

import json
from typing import Any

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TARGET = "resolved"


def train_and_evaluate(data: pd.DataFrame) -> dict[str, Any]:
    """Train a classifier and evaluate it on a held-out test set."""
    if TARGET not in data:
        raise ValueError(f"missing target column: {TARGET}")

    features = data.drop(columns=[TARGET])
    labels = data[TARGET]
    numeric = features.select_dtypes(include="number").columns.tolist()
    categorical = features.select_dtypes(exclude="number").columns.tolist()
    preprocessor = ColumnTransformer(
        [
            ("numeric", StandardScaler(), numeric),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
        ]
    )
    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.25, random_state=7, stratify=labels
    )
    model = Pipeline(
        [("preprocessor", preprocessor), ("classifier", LogisticRegression(max_iter=500))]
    ).fit(x_train, y_train)
    probabilities = model.predict_proba(x_test)[:, 1]
    return {
        "pipeline": model,
        "x_test": x_test,
        "y_test": y_test,
        "accuracy": accuracy_score(y_test, probabilities >= 0.5),
        "roc_auc": roc_auc_score(y_test, probabilities),
    }


def sample_data() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "message_length": [10, 12, 80, 90, 15, 70, 18, 85],
            "priority": ["low", "low", "high", "high", "low", "high", "low", "high"],
            "resolved": [0, 0, 1, 1, 0, 1, 0, 1],
        }
    )


if __name__ == "__main__":
    result = train_and_evaluate(sample_data())
    print(json.dumps({key: result[key] for key in ("accuracy", "roc_auc")}, indent=2))
