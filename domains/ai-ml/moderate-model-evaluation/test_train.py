import pandas as pd
import pytest

from train import TARGET, train_and_evaluate


def test_target_is_not_used_as_a_feature() -> None:
    data = pd.DataFrame(
        {
            "signal": [0, 0, 0, 1, 1, 1, 1, 0],
            "resolved": [0, 0, 1, 1, 1, 0, 1, 0],
        }
    )

    result = train_and_evaluate(data)

    assert TARGET not in result["pipeline"].feature_names_in_
    assert 0 <= result["accuracy"] <= 1
    assert 0 <= result["roc_auc"] <= 1


def test_missing_target_is_rejected() -> None:
    with pytest.raises(ValueError, match="target"):
        train_and_evaluate(pd.DataFrame({"signal": [1, 2, 3]}))
