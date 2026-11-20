"""Feature cleaning helpers.

Your task: make every test in ``test_clean_features.py`` pass.
Read the README first. Do not edit the tests.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Sequence, Tuple

import pandas as pd


def learn_fill_values(
    train_df: pd.DataFrame,
    numeric_cols: Sequence[str],
    categorical_cols: Sequence[str],
) -> Dict[str, object]:
    """Learn one fill value per column from the training data."""
    fill_values: Dict[str, object] = {}

    for col in numeric_cols:
        median = pd.to_numeric(train_df[col], errors="coerce").median()
        if pd.isna(median):
            raise ValueError(f"Cannot learn fill value for all-missing column: {col}")
        fill_values[col] = float(median)

    for col in categorical_cols:
        values = train_df[col].dropna()
        if values.empty:
            raise ValueError(f"Cannot learn fill value for all-missing column: {col}")
        fill_values[col] = values.value_counts().index[0]

    return fill_values


def apply_fill_values(df: pd.DataFrame, fill_values: Dict[str, object]) -> pd.DataFrame:
    """Fill missing values using previously learned fill values."""
    out = df.copy(deep=True)
    out.fillna(value=fill_values, inplace=True)
    return out


def encode_categoricals(
    df: pd.DataFrame,
    categorical_cols: Sequence[str],
    categories: Optional[Dict[str, List[object]]] = None,
) -> Tuple[pd.DataFrame, Dict[str, List[object]]]:
    """One-hot encode categorical columns.

    Returns the encoded frame and the categories that were used.
    """
    if categories is None:
        learned = {
            col: sorted(df[col].dropna().unique().tolist(), key=str)
            for col in categorical_cols
        }
    else:
        learned = {col: list(categories[col]) for col in categorical_cols}

    out = df.copy(deep=True)
    for col in categorical_cols:
        col_categories = learned[col]
        for category in col_categories:
            out[f"{col}_{category}"] = (
                out[col].eq(category).astype("int64")
            )
        out.drop(columns=[col], inplace=True)
    return out, learned


def clean_features(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    numeric_cols: Sequence[str],
    categorical_cols: Sequence[str],
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Clean train and test sets so they can be fed to the same model."""
    fill_values = learn_fill_values(train_df, numeric_cols, categorical_cols)

    train_filled = apply_fill_values(train_df, fill_values)
    test_filled = apply_fill_values(test_df, fill_values)

    train_encoded, categories = encode_categoricals(train_filled, categorical_cols)
    test_encoded, _ = encode_categoricals(test_filled, categorical_cols, categories)

    other_columns = [
        col for col in train_filled.columns
        if col not in categorical_cols
    ]
    dummy_columns = [c for c in train_encoded.columns if c not in other_columns]
    train_encoded = train_encoded[other_columns + dummy_columns]
    test_encoded = test_encoded[other_columns + dummy_columns]
    return train_encoded, test_encoded
