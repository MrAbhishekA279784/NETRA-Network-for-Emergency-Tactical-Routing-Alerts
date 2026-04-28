# 🔥 NETRA — Intelligent Crisis Awareness & Evacuation Guidance System

> **Team AGNI** · Hackathon 2026

AI-powered evacuation routing engine that detects danger zones, evaluates blocked routes, tracks people positions, and generates the safest possible evacuation path for each person in real time.

---

## ✨ Features

- **A\* Pathfinding** — weighted shortest-path with octile-distance heuristic
- **Danger-Aware Routing** — severity-based penalties (low / medium / high) instead of hard blocks
- **Congestion Balancing** — distributes crowd across exits to prevent bottlenecks
- **Priority Evacuation** — injured, elderly, and children are routed first
- **Trapped Detection** — flags unreachable persons and generates rescue warnings
- **ASCII Visualization** — terminal grid rendering for instant demo impact
- **API-Ready** — FastAPI wrapper with CORS, health check, and demo endpoint

## 📂 Project Structure

```
NETRA/
├── netra/                    # Core AI routing package
│   ├── __init__.py           # Package entry — exports generate_routes()
│   ├── constants.py          # Tunable parameters (penalties, weights, directions)
│   ├── models.py             # Data classes (Coord, Person, Exit, DangerZone, etc.)
│   ├── grid.py               # Cost grid builder (walls, dangers, blockages)
│   ├── pathfinder.py         # A* algorithm with octile heuristic
│   ├── parser.py             # JSON payload → typed BuildingLayout
│   ├── router.py             # Main orchestrator — exit selection & load balancing
│   └── visualizer.py         # ASCII grid renderer + banner
│
├── tests/                    # Test suite
│   ├── __init__.py
│   ├── test_router.py        # 17 tests: heuristic, grid, A*, integration
│   └── fixtures/
│       └── demo_payload.json # Reusable test scenario
│
├── examples/
│   └── demo.py               # CLI demo runner
│
├── netra_api.py              # FastAPI REST API
├── netra_router.py           # Standalone single-file version (legacy)
├── requirements.txt          # Python dependencies
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Run the Demo

```bash
# No dependencies needed — uses only Python stdlib
python examples/demo.py
```

### Run with Custom Payload

```bash
python examples/demo.py my_building.json
```

### Start the API Server

```bash
pip install -r requirements.txt
uvicorn netra_api:app --reload --port 8000
```

### Run Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

## 🔌 API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| POST   | `/api/v1/route`   | Compute evacuation routes          |
| POST   | `/api/v1/demo`    | Run built-in demo scenario         |
| GET    | `/api/v1/health`  | Service health check               |

### Example Request

```bash
curl -X POST http://localhost:8000/api/v1/route \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/demo_payload.json
```

## 📥 Input Schema

```json
{
  "building": {
    "name": "Mall Floor 2",
    "rows": 20,
    "cols": 30,
    "grid": [[0,0,1,0], [0,0,0,0]]
  },
  "persons": [
    { "id": "person_1", "r": 7, "c": 4, "priority": 1, "status": "mobile" }
  ],
  "exits": [
    { "id": "Exit A", "r": 0, "c": 1, "capacity": 15, "status": "open" }
  ],
  "danger_zones": [
    { "r": 3, "c": 10, "type": "fire", "severity": "high" }
  ],
  "blocked_routes": [
    { "r": 6, "c": 5 }
  ],
  "event_type": "fire_incident",
  "timestamp": "2026-04-09T15:30:00Z"
}
```

**Grid values:** `0` = floor, `1` = wall, `2` = blocked, `3` = danger

## 📤 Output Schema

```json
{
  "assignments":  { "person_1": "Exit A" },
  "route_paths":  { "person_1": [{"r": 7, "c": 4}, {"r": 6, "c": 3}] },
  "route_costs":  { "person_1": 12.0 },
  "safe_flags":   { "person_1": true },
  "exit_load":    { "Exit A": 1 },
  "warnings":     [],
  "compute_ms":   7.31
}
```

## ⚙️ Tuning

All routing parameters live in [`netra/constants.py`](netra/constants.py):

| Parameter            | Default | Purpose                                    |
|----------------------|---------|--------------------------------------------|
| `DANGER_PENALTY`     | 5 / 15 / 50 | Cost added to danger cells by severity |
| `DANGER_SPREAD`      | 0.3     | Fraction of penalty applied to neighbors   |
| `CONGESTION_WEIGHT`  | 3.0     | Cost per person already at an exit         |
| `OVERCAPACITY_PENALTY` | 100.0 | Penalty when exit exceeds capacity        |
| `SAFE_ROUTE_BONUS`   | 2.0     | Bonus for routes avoiding all danger       |

## 🛣️ Future Roadmap

- **Multi-floor routing** — stairwell/elevator graph connections
- **Live sensor feeds** — WebSocket updates from CCTV / IoT
- **Predictive crowd risk** — ML-based congestion forecasting
- **Real-time rerouting** — D* Lite for incremental path updates
- **Accessibility paths** — wheelchair-friendly route constraints

## 👥 Team AGNI

Built for Hackathon 2026 🏆
