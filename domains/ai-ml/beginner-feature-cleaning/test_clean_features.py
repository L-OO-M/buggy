import pandas as pd
import pytest

from clean_features import FEATURE_COLUMNS, clean_features


def test_clean_features_has_stable_schema_and_no_missing_values() -> None:
    data = pd.DataFrame(
        {
            "age": [20, None, 40, 100],
            "monthly_spend": [10.0, None, 30.0, 90.0],
            "plan": ["basic", "premium", "basic", "premium"],
        }
    )

    result = clean_features(data)

    assert list(result.columns) == list(FEATURE_COLUMNS)
    assert result.isna().sum().sum() == 0
    assert result.loc[1, "age"] == 40
    assert result.loc[1, "monthly_spend"] == 30


def test_schema_does_not_depend_on_categories_present_in_batch() -> None:
    data = pd.DataFrame(
        {"age": [30], "monthly_spend": [25.0], "plan": ["basic"]}
    )

    result = clean_features(data)

    assert list(result.columns) == list(FEATURE_COLUMNS)
    assert result.loc[0, "plan_premium"] == 0


def test_missing_required_column_is_reported() -> None:
    with pytest.raises(ValueError, match="required"):
        clean_features(pd.DataFrame({"age": [30], "plan": ["basic"]}))
