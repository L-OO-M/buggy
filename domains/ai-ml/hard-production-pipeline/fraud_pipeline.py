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
    return df


def build_model(seed: int = RANDOM_STATE) -> Pipeline:
    """Return an unfitted preprocessing + classifier pipeline."""
    numeric = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )
    categorical = Pipeline([("onehot", OneHotEncoder())])
    pre = ColumnTransformer(
        [
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL_FEATURES),
        ]
    )
    return Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=1000))])


def choose_threshold(y_true, scores) -> float:
    """Pick the decision threshold. Predict fraud when score >= threshold."""
    return 0.5


def train(df: pd.DataFrame, seed: int = RANDOM_STATE) -> ModelBundle:
    """Train on ``df`` (features + target) and return a ModelBundle."""
    X = df[FEATURES]
    y = df[TARGET]
    model = build_model(seed).fit(X, y)
    return ModelBundle(model=model, threshold=0.5)


def predict(bundle: ModelBundle, df: pd.DataFrame) -> pd.DataFrame:
    """Return a DataFrame with columns ``probability`` and ``label``."""
    X = validate_input(df)
    proba = bundle.model.predict_proba(X)[:, 1]
    return pd.DataFrame({"probability": proba, "label": (proba > 0.5).astype(int)})


def save_bundle(bundle: ModelBundle, path: PathLike) -> None:
    """Persist the bundle to disk."""
    joblib.dump(bundle.model, path)


def load_bundle(path: PathLike) -> ModelBundle:
    """Load a bundle saved by ``save_bundle``."""
    model = joblib.load(path)
    return ModelBundle(model=model, threshold=0.5)
