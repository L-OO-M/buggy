"""Reference solution. Do NOT publish to students."""

from __future__ import annotations

from typing import Dict, List, Optional, Sequence, Tuple

import pandas as pd


def learn_fill_values(
    train_df: pd.DataFrame,
    numeric_cols: Sequence[str],
    categorical_cols: Sequence[str],
) -> Dict[str, object]:
    fill_values: Dict[str, object] = {}

    for col in list(numeric_cols) + list(categorical_cols):
        if train_df[col].dropna().empty:
            raise ValueError(f"Column '{col}' has no non-missing values to learn from.")

    for col in numeric_cols:
        fill_values[col] = float(train_df[col].median())

    for col in categorical_cols:
        # mode() is sorted, so ties resolve deterministically
        fill_values[col] = train_df[col].mode(dropna=True).iloc[0]

    return fill_values


def apply_fill_values(df: pd.DataFrame, fill_values: Dict[str, object]) -> pd.DataFrame:
    out = df.copy()
    for col, value in fill_values.items():
        out[col] = out[col].fillna(value)
    return out


def encode_categoricals(
    df: pd.DataFrame,
    categorical_cols: Sequence[str],
    categories: Optional[Dict[str, List[object]]] = None,
) -> Tuple[pd.DataFrame, Dict[str, List[object]]]:
    if categories is None:
        categories = {
            col: sorted(df[col].dropna().unique().tolist(), key=str)
            for col in categorical_cols
        }

    out = df.drop(columns=list(categorical_cols)).copy()
    for col in categorical_cols:
        for level in categories[col]:
            out[f"{col}_{level}"] = (df[col] == level).astype(int)
    return out, categories


def clean_features(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    numeric_cols: Sequence[str],
    categorical_cols: Sequence[str],
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    fill_values = learn_fill_values(train_df, numeric_cols, categorical_cols)

    train_filled = apply_fill_values(train_df, fill_values)
    test_filled = apply_fill_values(test_df, fill_values)

    train_encoded, categories = encode_categoricals(train_filled, categorical_cols)
    test_encoded, _ = encode_categoricals(test_filled, categorical_cols, categories)
    return train_encoded, test_encoded
