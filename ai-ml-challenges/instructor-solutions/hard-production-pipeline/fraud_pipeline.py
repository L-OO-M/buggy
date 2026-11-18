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
# REFERENCE SOLUTION. Do NOT publish to students.
# ===========================================================================

def validate_input(df: pd.DataFrame) -> pd.DataFrame:
    if not isinstance(df, pd.DataFrame):
        raise SchemaError(f"expected a DataFrame, got {type(df).__name__}")
    if df.empty:
        raise SchemaError("input has no rows")
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise SchemaError(f"missing required columns: {missing}")

    out = df[FEATURES].copy()

    for col in NUMERIC_FEATURES:
        out[col] = pd.to_numeric(out[col], errors="coerce").astype(float)
    out[NUMERIC_FEATURES] = out[NUMERIC_FEATURES].replace([np.inf, -np.inf], np.nan)

    for col in CATEGORICAL_FEATURES:
        s = out[col].astype("string").str.strip().str.lower()
        s = s.mask(s.eq("").fillna(False))
        out[col] = s.astype(object).where(s.notna(), np.nan)

    return out


def build_model(seed: int = RANDOM_STATE) -> Pipeline:
    numeric = Pipeline(
        [
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )
    categorical = Pipeline(
        [
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    pre = ColumnTransformer(
        [
            ("num", numeric, NUMERIC_FEATURES),
            ("cat", categorical, CATEGORICAL_FEATURES),
        ]
    )
    clf = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=seed)
    return Pipeline([("pre", pre), ("clf", clf)])


def choose_threshold(y_true, scores) -> float:
    y_true = np.asarray(y_true)
    scores = np.asarray(scores, dtype=float)
    precision, recall, thresholds = precision_recall_curve(y_true, scores)
    p, r = precision[:-1], recall[:-1]
    denom = p + r
    f1 = np.divide(2 * p * r, denom, out=np.zeros_like(denom), where=denom > 0)
    return float(thresholds[int(np.argmax(f1))])


def train(df: pd.DataFrame, seed: int = RANDOM_STATE) -> ModelBundle:
    if not isinstance(df, pd.DataFrame) or TARGET not in df.columns:
        raise SchemaError(f"training data must contain the target column '{TARGET}'")

    y = pd.to_numeric(df[TARGET], errors="coerce")
    if y.isna().any() or set(y.unique()) != {0, 1}:
        raise SchemaError("target must contain only 0 and 1, and both classes must be present")
    y = y.astype(int)

    X = validate_input(df)
    X_fit, X_val, y_fit, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=seed
    )
    # Fit on X_fit only, so the threshold chosen on X_val stays honest.
    model = build_model(seed).fit(X_fit, y_fit)
    threshold = choose_threshold(y_val, model.predict_proba(X_val)[:, 1])
    return ModelBundle(model=model, threshold=threshold)


def predict(bundle: ModelBundle, df: pd.DataFrame) -> pd.DataFrame:
    X = validate_input(df)
    proba = bundle.model.predict_proba(X)[:, 1]
    return pd.DataFrame(
        {"probability": proba, "label": (proba >= bundle.threshold).astype(int)},
        index=X.index,
    )


def save_bundle(bundle: ModelBundle, path: PathLike) -> None:
    joblib.dump(
        {
            "model": bundle.model,
            "threshold": float(bundle.threshold),
            "schema_version": bundle.schema_version,
            "features": list(FEATURES),
        },
        path,
    )


def load_bundle(path: PathLike) -> ModelBundle:
    payload = joblib.load(path)
    if not isinstance(payload, dict) or "schema_version" not in payload:
        raise SchemaError("file is not a valid model bundle")
    if payload["schema_version"] != SCHEMA_VERSION:
        raise SchemaError(
            f"schema version mismatch: file has {payload['schema_version']}, "
            f"code expects {SCHEMA_VERSION}"
        )
    if payload.get("features") != list(FEATURES):
        raise SchemaError("feature list in file does not match the contract")
    return ModelBundle(
        model=payload["model"],
        threshold=float(payload["threshold"]),
        schema_version=payload["schema_version"],
    )
