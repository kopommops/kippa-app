from datetime import date
import math
from app.forecasting import forecast_daily, signal_quality


def test_forecast_returns_requested_non_negative_values():
    history = [0, 0, 220, 0, 160, 80, 0] * 13
    forecast = forecast_daily([float(v) for v in history], date(2026, 10, 23), 7)
    assert len(forecast) == 7
    assert all(math.isfinite(value) and value >= 0 for value in forecast)


def test_empty_history_is_zero_not_fake_precision():
    assert forecast_daily([], date(2026, 10, 23), 7) == [0.0] * 7


def test_short_history_uses_fallback():
    result = forecast_daily([0, 100, 0, 50, 0, 80], date(2026, 10, 23), 3)
    assert len(result) == 3
    assert all(value >= 0 for value in result)


def test_signal_quality_is_labelled_heuristic():
    assert signal_quality([0.0] * 10, 10) == "Limited"
