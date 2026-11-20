"""Fraud detection pipeline: training and inference.

Your task: make every test in ``test_fraud_pipeline.py`` pass.
Read the README first. Do not edit the tests.

Sections marked PROVIDED are correct. Do not change them.
Your work is in the section marked YOUR WORK.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Union

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_curve
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42
PathLike = Union[str, Path]

# ===========================================================================
# PROVIDED: the data contract
# ===========================================================================

NUMERIC_FEATURES = ["amount", "account_age_days", "tx_count_24h", "distance_from_home_km"]
CATEGORICAL_FEATURES = ["merchant_category", "channel"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
TARGET = "is_fraud"

# Bump this when the feature list or its meaning changes.
SCHEMA_VERSION = 1


class SchemaError(ValueError):
    """Raised when input data breaks the contract."""


# ===========================================================================
# PROVIDED: synthetic data (about 5% fraud, realistic missing values)
# ===========================================================================

def make_transactions(n: int = 8000, seed: int = 7) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    amount = rng.lognormal(mean=3.5, sigma=1.0, size=n)
    account_age = rng.integers(1, 3000, n).astype(float)
    tx_24h = rng.poisson(2.0, n).astype(float)
    distance = rng.lognormal(mean=2.0, sigma=1.2, size=n)
    category = rng.choice(
        ["grocery", "travel", "electronics", "restaurant", "online_services"], n
    )
    channel = rng.choice(["card_present", "online", "mobile"], n, p=[0.5, 0.3, 0.2])

    logit = (
        -5.7
        + 0.012 * amount
        + 0.45 * tx_24h
        + 0.03 * distance
        - 0.0008 * account_age
        + 1.4 * (channel == "online")
        + 1.2 * (category == "electronics")
        + 0.8 * (category == "travel")
    )
    prob = 1 / (1 + np.exp(-logit))
    is_fraud = (rng.random(n) < prob).astype(int)

    df = pd.DataFrame(
        {
            "amount": amount,
            "account_age_days": account_age,
            "tx_count_24h": tx_24h,
            "distance_from_home_km": distance,
            "merchant_category": category.astype(object),
            "channel": channel.astype(object),
            "is_fraud": is_fraud,
        }
    )
    for col in ["amount", "distance_from_home_km", "merchant_category"]:
        df.loc[rng.random(n) < 0.05, col] = np.nan
    return df


# ===========================================================================
# PROVIDED: what gets saved and loaded
# ===========================================================================

@dataclass
class ModelBundle:
    model: Pipeline
    threshold: float
    schema_version: int = SCHEMA_VERSION


# ===========================================================================
# YOUR WORK STARTS HERE
# ===========================================================================

def validate_input(df: pd.DataFrame) -> pd.DataFrame:
    """Check ``df`` against the contract and return a clean frame of FEATURES only."""
    if not isinstance(df, pd.DataFrame):
        raise SchemaError("Input must be a pandas DataFrame")
    if df.empty:
        raise SchemaError("Input frame must not be empty")

    missing = [column for column in FEATURES if column not in df.columns]
    if missing:
        raise SchemaError("Missing required columns: " + ", ".join(missing))

    out = df.loc[:, FEATURES].copy(deep=True)
    for column in NUMERIC_FEATURES:
        out[column] = pd.to_numeric(out[column], errors="coerce")
        out.loc[~np.isfinite(out[column]), column] = np.nan
    for column in CATEGORICAL_FEATURES:
        out[column] = out[column].map(
            lambda value: (
                str(value).strip().lower()
                if isinstance(value, str) and str(value).strip()
                else np.nan
            )
        )
    return out


def build_model(seed: int = RANDOM_STATE) -> Pipeline:
    """Return an unfitted preprocessing + classifier pipeline."""
    numeric = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )
    categorical = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    pre = ColumnTransformer(
        [
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL_FEATURES),
        ]
    )
    return Pipeline([
        ("pre", pre),
        ("clf", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=seed,
        )),
    ])


def choose_threshold(y_true, scores) -> float:
    """Pick the decision threshold. Predict fraud when score >= threshold."""
    y = np.asarray(y_true)
    scores = np.asarray(scores, dtype=float)
    if y.size == 0 or scores.size == 0 or y.size != scores.size:
        return 0.5

    precision, recall, thresholds = precision_recall_curve(y, scores)
    if thresholds.size == 0:
        return 0.5
    f1 = np.divide(
        2 * precision[:-1] * recall[:-1],
        precision[:-1] + recall[:-1],
        out=np.zeros_like(precision[:-1]),
        where=(precision[:-1] + recall[:-1]) != 0,
    )
    threshold = float(thresholds[int(np.argmax(f1))])
    return min(max(threshold, 0.0), 1.0)


def train(df: pd.DataFrame, seed: int = RANDOM_STATE) -> ModelBundle:
    """Train on ``df`` (features + target) and return a ModelBundle."""
    if not isinstance(df, pd.DataFrame):
        raise SchemaError("Input must be a pandas DataFrame")
    if TARGET not in df.columns:
        raise SchemaError(f"Missing required column: {TARGET}")

    X = validate_input(df)
    y = pd.to_numeric(df[TARGET], errors="coerce")
    valid = y.isin([0, 1])
    if not valid.all():
        raise SchemaError("Target must contain only 0 and 1")
    y = y.astype(int)
    if y.nunique() != 2:
        raise SchemaError("Training data must contain both classes")

    model = build_model(seed).fit(X, y)
    scores = model.predict_proba(X)[:, 1]
    threshold = choose_threshold(y, scores)
    return ModelBundle(model=model, threshold=threshold)


def predict(bundle: ModelBundle, df: pd.DataFrame) -> pd.DataFrame:
    """Return a DataFrame with columns ``probability`` and ``label``."""
    X = validate_input(df)
    proba = bundle.model.predict_proba(X)[:, 1]
    return pd.DataFrame(
        {"probability": proba, "label": (proba >= bundle.threshold).astype(int)},
        index=X.index,
    )


def save_bundle(bundle: ModelBundle, path: PathLike) -> None:
    """Persist the bundle to disk."""
    joblib.dump(
        {
            "model": bundle.model,
            "threshold": bundle.threshold,
            "schema_version": bundle.schema_version,
            "features": FEATURES,
        },
        path,
    )


def load_bundle(path: PathLike) -> ModelBundle:
    """Load a bundle saved by ``save_bundle``."""
    payload = joblib.load(path)
    if not isinstance(payload, dict):
        raise SchemaError("Saved bundle must contain ModelBundle metadata")
    if payload.get("schema_version") != SCHEMA_VERSION:
        raise SchemaError("Saved bundle schema version is incompatible")
    if payload.get("features") != FEATURES:
        raise SchemaError("Saved bundle feature contract is incompatible")
    model = payload.get("model")
    threshold = payload.get("threshold")
    if not isinstance(model, Pipeline) or not isinstance(threshold, (int, float)):
        raise SchemaError("Saved bundle is invalid")
    return ModelBundle(
        model=model,
        threshold=float(threshold),
        schema_version=SCHEMA_VERSION,
    )
