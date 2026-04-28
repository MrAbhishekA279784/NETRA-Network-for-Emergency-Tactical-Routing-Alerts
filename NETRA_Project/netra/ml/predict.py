"""
ML Predictor.
Loads trained model and generates dynamic cost grids.
"""

import pickle
import numpy as np
import warnings
from pathlib import Path
from typing import Optional

from netra.models import BuildingLayout, Person
from netra.ml.features import compute_features_for_cell

try:
    from sklearn.ensemble import RandomForestRegressor
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

MODEL_PATH = Path(__file__).parent / "model.pkl"
_MODEL: Optional[RandomForestRegressor] = None

def _load_model():
    global _MODEL
    if not ML_AVAILABLE:
        return False
    if _MODEL is not None:
        return True
    if not MODEL_PATH.exists():
        warnings.warn("NETRA ML Model not found! Falling back to classical routing.")
        return False
    try:
        with open(MODEL_PATH, "rb") as f:
            _MODEL = pickle.load(f)
        return True
    except Exception as e:
        warnings.warn(f"Failed to load ML model: {e}")
        return False


def predict_cost_grid(
    layout: BuildingLayout,
    person: Person,
    base_cost_grid: list[list[float]]
) -> list[list[float]]:
    """
    Returns an ML-predicted cost grid tailored for this specific person's profile
    and the current building context.
    Falls back to base_cost_grid if ML model is unavailable.
    """
    if not _load_model():
        return base_cost_grid
        
    rows, cols = layout.rows, layout.cols
    X = []
    
    # 1. Gather features for every cell in the grid
    for r in range(rows):
        for c in range(cols):
            feats = compute_features_for_cell(r, c, layout, person, base_cost_grid)
            X.append(feats)
            
    # 2. Vectorized prediction
    X_np = np.array(X)
    preds = _MODEL.predict(X_np)
    
    # 3. Reconstruct into 2D grid
    ml_grid = [[1.0] * cols for _ in range(rows)]
    idx = 0
    for r in range(rows):
        for c in range(cols):
            val = float(preds[idx])
            # Snap extreme values back to infinity for walls
            if val >= 999.0 or base_cost_grid[r][c] == float("inf"):
                ml_grid[r][c] = float("inf")
            else:
                ml_grid[r][c] = val
            idx += 1
            
    return ml_grid
