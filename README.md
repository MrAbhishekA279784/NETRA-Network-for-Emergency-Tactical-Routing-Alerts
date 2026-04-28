# NETRA — Network for Emergency Tactical Routing & Alerts

<div align="center">

**AI-Powered Dynamic Evacuation Routing**

*Google Solution Challenge 2026 · Team AGNI*

![Build with AI](https://img.shields.io/badge/Google-Build%20with%20AI-4285F4?style=flat&logo=google)
![Solution Challenge](https://img.shields.io/badge/Solution%20Challenge-2026-EA4335?style=flat)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=flat&logo=python)

</div>

---

## The Problem

Passive fire alarms and static exit signs fail during real emergencies. When panic sets in, **80% of occupants converge on just 20% of known exits** — ignoring safer, less-crowded alternatives. The result: dangerous bottlenecks, stampedes, and over **2,000 preventable deaths globally every year**.

Existing "smart" systems only broadcast alerts. They leave actual navigation to chance and adrenaline-fueled decisions.

---

## What NETRA Does

NETRA turns panic into coordinated movement.

When a crisis is triggered, NETRA calculates a **personalized, congestion-aware escape route for every occupant** and delivers it directly to their phone — via push notification or SMS — with real-time directional arrows and voice guidance. No app download required.

```
Crisis Detected → AI Calculates Routes → Personalized Alerts Sent → Occupants Guided Out
       3s               <7s                       <10s total
```

### Core Capabilities

| Capability | Description |
|---|---|
| **AI Exit Allocation** | Graph-based routing using A\* and Dijkstra algorithms, weighted by exit capacity and hazard severity |
| **Congestion Control** | Continuous density monitoring; auto-reroutes before any exit exceeds 80% capacity |
| **Multi-Channel Delivery** | Redundant FCM push + SMS ensures 100% reachability |
| **Priority Evacuation** | Dedicated routing logic for elderly, mobility-impaired, and other vulnerable groups |
| **Danger-Aware Routing** | Severity-based path penalties for segments near active hazard zones |
| **Responder Dashboard** | Live heatmaps and exit utilization bars for emergency coordinators |

---

## How It Works (The 10-Second Window)

1. **Trigger** — Authority activates emergency via Secure Dashboard (2 clicks)
2. **Analysis** — System loads building graph; fetches live user locations from Firebase RTDB
3. **Allocation** — AI Engine assigns optimal exits using capacity-weighted Dijkstra
4. **Broadcast** — Personalized Google Maps deep links dispatched via Push + SMS
5. **Guidance** — Users follow real-time directional arrows and voice instructions

Total end-to-end latency: **under 10 seconds.**

---

## Results — Simulated Mall Evacuation

| Metric | Without NETRA | With NETRA |
|---|---|---|
| Total evacuation time | 400 seconds | **210 seconds** |
| Improvement | — | **56% faster** |
| Hazard identification | Manual | **3 seconds** |
| Occupants evacuated | Partial | **100%** |

---

## Tech Stack

### Frontend
- **React 18 + Vite** — Authority dashboard with isometric maps and real-time crowd density
- **Leaflet + Zustand** — Interactive map rendering and app state management
- **Google Maps Native** — Deep links for zero-install user navigation

### Backend
- **Python FastAPI** — High-performance exit allocation and crowd balancing logic
- **Cloud Functions (Node.js 20, 2nd Gen)** — Serverless emergency trigger processing, batching, notification dispatch
- **Firebase Firestore** — Persistent building graph and configuration data
- **Firebase RTDB** — Hot-path live location synchronization

### AI & Data
- **scikit-learn + NumPy** — Exit assignment optimization and route scoring
- **Google Cloud Vision AI** — Automated CCTV crowd density estimation
- **Google Maps Platform** — Turn-by-turn directions and distance calculation
- **Google Text-to-Speech** — Voice guidance delivery

### Infrastructure
- Fully serverless and event-driven — no always-on servers
- Google Cloud Run for FastAPI deployment
- Firebase Hosting for the zero-install user navigation page

---

## Architecture

```
[Authority Dashboard (React)]
        │
        ▼ 2-click trigger
[Cloud Functions — Emergency Trigger]
        │
        ├── Loads building graph (Firestore)
        └── Fetches live locations (RTDB)
                │
                ▼
        [FastAPI — AI Routing Engine]
          A*/Dijkstra + Capacity Weights
                │
                ▼
        [Broadcast Layer]
          ├── FCM Push Notifications
          └── SMS (Twilio / Firebase Extensions)
                │
                ▼
        [User — Zero-Install Web Page]
          Google Maps Deep Link + Voice Guidance
```

---

## Project Structure

```
NETRA/
├── dashboard/          # React + Vite authority dashboard
│   ├── src/
│   │   ├── components/ # Map, heatmap, exit utilization UI
│   │   └── store/      # Zustand state management
│   └── public/
├── api/                # Python FastAPI routing engine
│   ├── routing/        # A* and Dijkstra implementations
│   ├── models/         # Building graph, user, exit models
│   └── main.py
├── functions/          # Firebase Cloud Functions (Node.js)
│   ├── trigger.js      # Emergency activation handler
│   ├── broadcast.js    # Notification dispatch
│   └── index.js
├── navigation/         # Zero-install user web page
│   └── index.html      # Launched from SMS link
└── firebase.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase CLI (`npm install -g firebase-tools`)
- A Google Cloud project with Maps, Vision AI, and Firebase enabled

### 1. Clone the repo

```bash
git clone https://github.com/MrAbhishekA279784/NETRA-.git
cd NETRA-
```

### 2. Set up Firebase

```bash
firebase login
firebase use --add   # select your project
```

### 3. Run the API

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Run the dashboard

```bash
cd dashboard
npm install
npm run dev
```

### 5. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## vs. Legacy Evacuation Systems

| Feature | Legacy Systems | NETRA |
|---|---|---|
| Primary Function | Notification-Only | Active AI Routing |
| Crowd Balancing | None | Dynamic Weighting |
| User Access | App Required | **Zero-Install** |
| Vulnerable Groups | Generic Alerts | **Accessibility-First** |
| Response Time | N/A | **< 10 seconds** |
| Evacuation Improvement | Baseline | **56% faster** |

---

## Roadmap

**Phase 1 — Current (Prototype)**
- Simulated building environments
- Firebase RTDB + Firestore backend
- A\*/Dijkstra routing engine
- SMS + push notification delivery

**Phase 2 — Q3 2026 (Pilot)**
- Live IoT sensor integration
- CCTV crowd density via Cloud Vision AI
- Pilot with 1–2 Mumbai venues
- Authority dashboard public launch

**Phase 3 — 2027 (Scale)**
- Municipal government partnerships
- Multi-building campus support
- International expansion
- Wearable device integration

---

## Team AGNI

Built for the **Google Solution Challenge 2026**.

| Name | Role |
|---|---|
| Haseeb Khot | Senior Product Designer |

---

## License

MIT License — see [LICENSE](LICENSE) for details.
