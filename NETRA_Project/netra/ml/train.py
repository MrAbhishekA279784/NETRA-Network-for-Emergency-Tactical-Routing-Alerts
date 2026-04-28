"""
Training pipeline for NETRA ML model.
Generates synthetic disaster scenarios and trains a Random Forest regressor.
"""

import math
import random
import pickle
from pathlib import Path
import numpy as np

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error, r2_score
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

from netra.models import BuildingLayout, Person, Exit, DangerZone, Coord
from netra.grid import build_cost_grid
from netra.ml.features import compute_features_for_cell
from netra.constants import CELL_FREE, CELL_WALL, CELL_BLOCKED, CELL_DANGER

MODEL_PATH = Path(__file__).parent / "model.pkl"

def _synthetic_target(features: list[float]) -> float:
    """
    Simulate the 'true' risk cost of traversing a cell.
    In real life this would be gathered from historical evacuation logs.
    """
    (
        dist_to_exit,
        nearby_blocked,
        nearby_danger,
        severity_score,
        mobility_score,
        base_cost,
        congestion_est
    ) = features
    
    if base_cost >= 1000.0:
        return 1000.0  # Wall/Blocked
        
    # Base real cost
    cost = 1.0
    
    # Low mobility persons find distance and congestion much worse
    cost += (dist_to_exit * 0.1) * (1.5 - mobility_score)
    cost += (congestion_est * 2.0) * (1.5 - mobility_score)
    
    # Neighborhood hazard amplifies non-linearly
    if nearby_danger > 0:
        cost += (nearby_danger ** 1.5) * 2.0
    
    # Direct danger penalizes severely based on lack of mobility
    if severity_score > 0:
        cost += (severity_score * 10.0) / (mobility_score + 0.1)
        
    # Chokepoints (many nearby walls + congestion)
    if nearby_blocked >= 3 and congestion_est > 0:
        cost += 5.0
        
    return min(cost, 999.0)


def generate_synthetic_data(num_scenarios: int = 20) -> tuple[np.ndarray, np.ndarray]:
    """Generates X and Y arrays for ML training via simulation."""
    X, Y = [], []
    
    rows, cols = 15, 20
    
    for _ in range(num_scenarios):
        # Create random grid
        grid = [[CELL_FREE for _ in range(cols)] for _ in range(rows)]
        for r in range(rows):
            for c in range(cols):
                if random.random() < 0.15:
                    grid[r][c] = CELL_WALL
        
        # Danger zones
        danger_zones = []
        for _ in range(random.randint(1, 5)):
            r, c = random.randint(0, rows-1), random.randint(0, cols-1)
            grid[r][c] = CELL_DANGER
            severity = random.choice(["low", "medium", "high"])
            danger_zones.append(DangerZone(Coord(r, c), "fire", severity))
            
        exits = [
            Exit("E1", Coord(0, cols//2), 50, "open"),
            Exit("E2", Coord(rows-1, cols//2), 50, "open")
        ]
        
        persons = []
        for i in range(random.randint(5, 15)):
            r, c = random.randint(0, rows-1), random.randint(0, cols-1)
            status = random.choice(["mobile", "elderly", "injured", "child"])
            persons.append(Person(f"p{i}", Coord(r, c), 1, status))
            
        layout = BuildingLayout(
            name="Synthetic", rows=rows, cols=cols, grid=grid,
            persons=persons, exits=exits, danger_zones=danger_zones,
            blocked_routes=[], event_type="test", timestamp=""
        )
        
        base_grid = build_cost_grid(layout)
        
        # Extract samples for a couple random persons
        for p in persons[:3]:
            # For training speed, we only sample a fraction of cells
            for r in range(rows):
                for c in range(cols):
                    if random.random() < 0.3: # Sample 30% of cells
                        feats = compute_features_for_cell(r, c, layout, p, base_grid)
                        target = _synthetic_target(feats)
                        X.append(feats)
                        Y.append(target)
                        
    return np.array(X), np.array(Y)


def train_and_save_model() -> dict:
    """Train Random Forest and save to disk."""
    if not ML_AVAILABLE:
        raise RuntimeError("scikit-learn not available. Please install it.")
        
    print("Generating synthetic data...")
    X, Y = generate_synthetic_data(num_scenarios=50)
    print(f"Generated {len(X)} samples. Training model...")
    
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=50, max_depth=10, n_jobs=-1, random_state=42)
    model.fit(X_train, Y_train)
    
    preds = model.predict(X_test)
    mse = mean_squared_error(Y_test, preds)
    r2 = r2_score(Y_test, preds)
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
        
    print(f"Model saved to {MODEL_PATH}")
    print(f"Evaluation — MSE: {mse:.2f}, R2: {r2:.2f}")
    
    return {"mse": mse, "r2": r2, "samples": len(X)}


if __name__ == "__main__":
    train_and_save_model()
