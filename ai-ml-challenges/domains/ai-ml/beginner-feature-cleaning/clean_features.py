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
        fill_values[col] = float(train_df[col].mean())

    for col in categorical_cols:
        fill_values[col] = train_df[col].value_counts().index[0]

    return fill_values


def apply_fill_values(df: pd.DataFrame, fill_values: Dict[str, object]) -> pd.DataFrame:
    """Fill missing values using previously learned fill values."""
    df.fillna(value=fill_values, inplace=True)
    return df


def encode_categoricals(
    df: pd.DataFrame,
    categorical_cols: Sequence[str],
    categories: Optional[Dict[str, List[object]]] = None,
) -> Tuple[pd.DataFrame, Dict[str, List[object]]]:
    """One-hot encode categorical columns.

    Returns the encoded frame and the categories that were used.
    """
    learned = {
        col: sorted(df[col].dropna().unique().tolist(), key=str)
        for col in categorical_cols
    }
    encoded = pd.get_dummies(df, columns=list(categorical_cols))
    return encoded, learned


def clean_features(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    numeric_cols: Sequence[str],
    categorical_cols: Sequence[str],
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Clean train and test sets so they can be fed to the same model."""
    everything = pd.concat([train_df, test_df], ignore_index=True)
    fill_values = learn_fill_values(everything, numeric_cols, categorical_cols)

    train_filled = apply_fill_values(train_df, fill_values)
    test_filled = apply_fill_values(test_df, fill_values)

    train_encoded, _ = encode_categoricals(train_filled, categorical_cols)
    test_encoded, _ = encode_categoricals(test_filled, categorical_cols)
    return train_encoded, test_encoded
