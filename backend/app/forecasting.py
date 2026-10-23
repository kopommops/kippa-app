"""Small ML forecasting baseline for the synthetic hackathon feed.

This is a demonstrator, not a calibrated financial model. It deliberately keeps
feature engineering and fallback behaviour small enough to explain to judges.
"""
from __future__ import annotations

from datetime import date, timedelta
import math
import numpy as np
from sklearn.ensemble import RandomForestRegressor

FEATURE_HISTORY = 14


def _features(values: list[float], target_day: date, index: int) -> list[float]:
    last7 = values[max(0, len(values) - 7):]
    last14 = values[max(0, len(values) - 14):]
    weekday_angle = 2 * math.pi * target_day.weekday() / 7
    return [
        math.sin(weekday_angle),
        math.cos(weekday_angle),
        values[-1] if len(values) >= 1 else 0.0,
        values[-7] if len(values) >= 7 else 0.0,
        values[-14] if len(values) >= 14 else 0.0,
        float(np.mean(last7)) if last7 else 0.0,
        float(np.mean(last14)) if last14 else 0.0,
        float(index),
    ]


def forecast_daily(values: list[float], last_date: date, horizon: int = 7) -> list[float]:
    """Return non-negative daily estimates; use a historic baseline if history is short."""
    clean = [max(0.0, float(value)) for value in values]
    if horizon <= 0:
        return []
    if not clean:
        return [0.0] * horizon
    if len(clean) < 28:
        # Robust, transparent fallback: recent mean with a weekday-matched nudge.
        recent = clean[-min(14, len(clean)):]
        baseline = float(np.mean(recent))
        estimates: list[float] = []
        history = clean.copy()
        for offset in range(1, horizon + 1):
            future_date = last_date + timedelta(days=offset)
            same_weekday = [clean[i] for i in range(len(clean)) if (last_date - timedelta(days=(len(clean) - 1 - i))).weekday() == future_date.weekday()]
            estimate = float(np.median(same_weekday[-4:])) if same_weekday else baseline
            estimate = 0.5 * estimate + 0.5 * baseline
            estimates.append(max(0.0, estimate))
            history.append(estimate)
        return estimates

    x_train: list[list[float]] = []
    y_train: list[float] = []
    for i in range(FEATURE_HISTORY, len(clean)):
        x_train.append(_features(clean[:i], last_date - timedelta(days=(len(clean) - 1 - i)), i))
        y_train.append(clean[i])

    if not y_train or max(y_train) == 0:
        return [0.0] * horizon

    model = RandomForestRegressor(
        n_estimators=70,
        max_depth=4,
        min_samples_leaf=2,
        random_state=17,
        n_jobs=1,
    )
    model.fit(np.asarray(x_train, dtype=float), np.asarray(y_train, dtype=float))

    history = clean.copy()
    output: list[float] = []
    cap = max(float(np.percentile(clean, 95)) * 1.8, float(np.mean(clean[-14:])) * 2.5, 1.0)
    for offset in range(1, horizon + 1):
        target_date = last_date + timedelta(days=offset)
        features = _features(history, target_date, len(history))
        estimate = float(model.predict(np.asarray([features], dtype=float))[0])
        estimate = min(cap, max(0.0, estimate))
        output.append(estimate)
        history.append(estimate)
    return output


def signal_quality(income_history: list[float], days_of_history: int) -> str:
    """Heuristic label only; this is not calibrated statistical confidence."""
    recent = income_history[-28:]
    if days_of_history < 42 or len(recent) < 14 or sum(recent) <= 0:
        return "Limited"
    mean = float(np.mean(recent))
    cv = float(np.std(recent) / mean) if mean > 0 else 99.0
    if cv > 1.15:
        return "Volatile"
    if cv > 0.65:
        return "Cautious"
    return "Steadier"
