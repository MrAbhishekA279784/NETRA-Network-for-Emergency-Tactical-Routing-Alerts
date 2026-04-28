from __future__ import annotations
from typing import Any
import copy

from netra.router import generate_routes

def run_comparison(layout_payload: dict) -> dict[str, Any]:
    """
    Run routing on both 'classic' and 'ml' modes and compare the results.
    """
    # Defensive copies so we don't mutate the internal structures somehow
    payload_classic = copy.deepcopy(layout_payload)
    payload_ml = copy.deepcopy(layout_payload)
    
    classic_result = generate_routes(payload_classic, force_mode="classic")
    ml_result = generate_routes(payload_ml, force_mode="ml")
    
    if "error" in classic_result or "error" in ml_result:
        return {
            "error": "Cannot compare, one or both modes failed.",
            "classic": classic_result,
            "ml": ml_result
        }
        
    def _compute_metrics(res: dict) -> dict:
        total_cost = sum(res["route_costs"].values()) if res["route_costs"] else 0.0
        avg_cost = total_cost / max(1, len(res["route_costs"]))
        
        trapped_count = sum(1 for p in res["route_paths"] if len(res["route_paths"][p]) == 0)
        safe_count = sum(1 for safe in res["safe_flags"].values() if safe)
        
        return {
            "compute_ms": res["compute_ms"],
            "avg_cost": round(avg_cost, 2),
            "trapped_count": trapped_count,
            "safe_routes_count": safe_count,
            "exit_load": res["exit_load"],
            "total_warnings": len(res.get("warnings", []))
        }
        
    metrics_classic = _compute_metrics(classic_result)
    metrics_ml = _compute_metrics(ml_result)
    
    return {
        "event_type": classic_result.get("event_type", "unknown"),
        "total_persons": classic_result.get("total_persons", 0),
        "comparison": {
            "classic": metrics_classic,
            "ml": metrics_ml,
        },
        "raw_classic": classic_result,
        "raw_ml": ml_result
    }
