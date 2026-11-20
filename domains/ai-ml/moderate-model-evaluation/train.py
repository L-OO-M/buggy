"""Model evaluation on an imbalanced dataset.

Your task: make every test in ``test_train.py`` pass.
Read the README first. Do not edit the tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# Data (provided, correct. Do not change.)
# ---------------------------------------------------------------------------

def make_dataset(n_samples: int = 2000, seed: int = RANDOM_STATE) -> Tuple[pd.DataFrame, pd.Series]:
    """Synthetic fraud-like data: about 10% positives, features on very different scales."""
    X, y = make_classification(
        n_samples=n_samples,
        n_features=10,
        n_informative=5,
        n_redundant=2,
        weights=[0.9, 0.1],
        class_sep=1.0,
        flip_y=0.01,
        random_state=seed,
    )
    scales = np.array([1, 10, 100, 1, 1, 1000, 1, 5, 1, 50], dtype=float)
    X = X * scales
    return pd.DataFrame(X, columns=[f"f{i}" for i in range(10)]), pd.Series(y, name="target")


@dataclass
class EvaluationResult:
    model: object
    metrics: Dict[str, float]
    X_train: pd.DataFrame
    X_test: pd.DataFrame
    y_train: pd.Series
    y_test: pd.Series


# ---------------------------------------------------------------------------
# Your work starts here
# ---------------------------------------------------------------------------

def split_data(X, y, test_size: float = 0.25, seed: int = RANDOM_STATE):
    """Split into train and test. Returns X_train, X_test, y_train, y_test."""
    return train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=y,
        random_state=seed,
    )


def build_model(seed: int = RANDOM_STATE):
    """Return an unfitted model."""
    return Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=seed,
        )),
    ])


def compute_metrics(y_true, y_pred, y_score) -> Dict[str, float]:
    """Return evaluation metrics as a dict of floats."""
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_score)),
    }


def fit_and_evaluate(X, y, seed: int = RANDOM_STATE) -> EvaluationResult:
    """Train a model and evaluate it on held-out data."""
    X_train, X_test, y_train, y_test = split_data(X, y, seed=seed)

    model = build_model(seed).fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_score = model.predict_proba(X_test)[:, 1]
    metrics = compute_metrics(y_test, y_pred, y_score)
    return EvaluationResult(model, metrics, X_train, X_test, y_train, y_test)


def cross_validate_model(X, y, seed: int = RANDOM_STATE, n_splits: int = 5) -> Dict[str, float]:
    """Cross-validate and return mean and std for F1 and ROC-AUC.

    Expected keys: f1_mean, f1_std, roc_auc_mean, roc_auc_std
    """
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    scores = cross_validate(
        build_model(seed),
        X,
        y,
        cv=cv,
        scoring={
            "f1": "f1",
            "roc_auc": "roc_auc",
        },
    )
    return {
        "f1_mean": float(scores["test_f1"].mean()),
        "f1_std": float(scores["test_f1"].std()),
        "roc_auc_mean": float(scores["test_roc_auc"].mean()),
        "roc_auc_std": float(scores["test_roc_auc"].std()),
    }


# ---------------------------------------------------------------------------
# Provided baseline (correct). Use it to see why accuracy misleads.
# ---------------------------------------------------------------------------

def majority_baseline(X, y, seed: int = RANDOM_STATE) -> Dict[str, float]:
    """Metrics of a model that always predicts the majority class."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=seed
    )
    dummy = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
    y_pred = dummy.predict(X_test)
    score = dummy.predict_proba(X_test)[:, 1]
    from sklearn.metrics import f1_score, recall_score

    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "score_min": float(score.min()),
    }
