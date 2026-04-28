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


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Service health check."""
    return HealthResponse(
        status="operational",
        engine="NETRA AI Routing Engine",
        version="1.0.0",
    )


@app.post("/api/v1/route")
async def compute_routes(payload: RouteRequest) -> dict[str, Any]:
    """
    Compute optimal evacuation routes for all persons.

    Accepts the full building state (layout, persons, exits,
    danger zones, blocked routes) and returns an evacuation plan
    with per-person path assignments, costs, and warnings.
    """
    try:
        raw = payload.model_dump()
        result = generate_routes(raw)
        result.pop("_visualization", None)
        return result
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing failed: {e}")


@app.post("/api/v1/demo")
async def run_demo() -> dict[str, Any]:
    """
    Run the built-in demo scenario.
    Useful for frontend testing and hackathon presentations.
    """
    with open(_DEMO_PATH) as f:
        payload = json.load(f)
    result = generate_routes(payload)
    result.pop("_visualization", None)
    return result


# ── Startup banner ───────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\n🔥 NETRA AI Routing Engine — API Server Ready")
    print("   POST /api/v1/route  → compute evacuation routes")
    print("   POST /api/v1/demo   → run demo scenario")
    print("   GET  /api/v1/health → health check\n")
