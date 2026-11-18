import pandas as pd
import pytest

from fraud_pipeline import FEATURES, FraudModel, fit_model, predict


def training_data() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "amount": [10, 20, 200, 300, 15, 250, 30, 400, 22, 350, 18, 275],
            "account_age_days": [400, 200, 5, 10, 500, 3, 300, 1, 250, 2, 450, 4],
            "merchant_category": [
                "grocery", "grocery", "electronics", "travel",
                "grocery", "travel", "grocery", "electronics",
                "grocery", "travel", "grocery", "electronics",
            ],
            "is_fraud": [0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        }
    )


def test_prediction_supports_unknown_categories_and_preserves_index() -> None:
    model = fit_model(training_data())
    incoming = pd.DataFrame(
        {
            "amount": [55.0],
            "account_age_days": [100],
            "merchant_category": ["new-category"],
        },
        index=["transaction-7"],
    )

    result = predict(model, incoming)

    assert list(result.columns) == ["risk_score", "flagged"]
    assert result.index.tolist() == ["transaction-7"]
    assert result["risk_score"].between(0, 1).all()


def test_missing_feature_is_rejected() -> None:
    model = fit_model(training_data())
    incomplete = training_data().drop(columns=["amount"])

    with pytest.raises(ValueError, match="required features"):
        predict(model, incomplete)


def test_model_exposes_a_learned_threshold() -> None:
    model = fit_model(training_data())

    assert isinstance(model, FraudModel)
    assert 0 < model.threshold < 1
    assert set(FEATURES).issubset(model.pipeline.feature_names_in_)
