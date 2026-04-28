"""
NETRA — FastAPI Backend Integration
Team AGNI | Hackathon 2026

Quick start:
    pip install fastapi uvicorn
    uvicorn netra_api:app --reload --port 8000

Endpoints:
    POST /api/v1/route     — compute evacuation routes
    GET  /api/v1/health    — service health check
    POST /api/v1/demo      — run the built-in demo scenario
"""

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

from netra.router import generate_routes
from netra.evaluation import run_comparison

app = FastAPI(
    title="NETRA AI Routing Engine",
    description="Intelligent Crisis Awareness & Evacuation Guidance — API",
    version="1.0.0",
)

# Allow frontend to call this API from any origin (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load demo payload from fixture
_DEMO_PATH = Path(__file__).parent / "tests" / "fixtures" / "demo_payload.json"


# ── Request / Response Models ────────────────────────────────────────────────

class RouteRequest(BaseModel):
    """Accepts the full NETRA layout payload."""
    mode: str = "classic"  # "classic" | "ml" | "compare"
    building: dict
    persons: list[dict]
    exits: list[dict]
    danger_zones: list[dict] = []
    blocked_routes: list[dict] = []
    event_type: str = "unknown"
    timestamp: str = ""


class HealthResponse(BaseModel):
    status: str
    engine: str
    version: str
    ml_available: bool


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Service health check."""
    try:
        from netra.ml.predict import _load_model
        ml_ok = _load_model()
    except Exception:
        ml_ok = False
        
    return HealthResponse(
        status="operational",
        engine="NETRA AI Routing Engine",
        version="1.0.0",
        ml_available=ml_ok
    )


@app.post("/api/v1/route")
async def compute_routes(payload: RouteRequest) -> dict[str, Any]:
    """
    Compute optimal evacuation routes for all persons.
    """
    try:
        raw = payload.model_dump()
        mode = raw.get("mode", "classic")
        
        if mode == "compare":
            result = run_comparison(raw)
            # Remove visualization strings from nested results
            if "raw_classic" in result:
                result["raw_classic"].pop("_visualization", None)
            if "raw_ml" in result:
                result["raw_ml"].pop("_visualization", None)
            return result
        else:    
            result = generate_routes(raw)
            result.pop("_visualization", None)
            return result
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {e}")


@app.post("/api/v1/demo")
async def run_demo(mode: str = "compare") -> dict[str, Any]:
    """
    Run the built-in demo scenario.
    """
    with open(_DEMO_PATH) as f:
        payload = json.load(f)
        
    payload["mode"] = mode
    
    if mode == "compare":
        result = run_comparison(payload)
        if "raw_classic" in result:
            result["raw_classic"].pop("_visualization", None)
        if "raw_ml" in result:
            result["raw_ml"].pop("_visualization", None)
        return result
    else:
        result = generate_routes(payload)
        result.pop("_visualization", None)
        return result


# ── Startup banner ───────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\n🔥 NETRA AI Routing Engine — API Server Ready")
    print("   POST /api/v1/route  → compute evacuation routes")
    print("   POST /api/v1/demo   → run demo scenario (supports ?mode=classic|ml|compare)")
    print("   GET  /api/v1/health → health check\n")
