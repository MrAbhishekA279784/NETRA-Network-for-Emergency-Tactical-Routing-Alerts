# System Architecture — NETRA

## AI-Powered Emergency Evacuation & Crisis Response Platform

---

## 1. Architecture Overview

NETRA follows a **serverless, event-driven microservice architecture** built on Google Cloud Platform. The system is designed for high availability, real-time responsiveness, and graceful degradation under network failure.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Web Nav Page │  │  Authority   │  │  SMS/IVR     │  │  Google    │ │
│  │  (Browser)    │  │  Dashboard   │  │  + Maps Link │  │  Maps Deep │ │
│  │  No Install   │  │              │  │              │  │  Link      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
└─────────┼──────────────────┼──────────────────┼───────────────┼─────────┘
          │                  │                  │               │
          ▼                  ▼                  ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Firebase Hosting + Cloud Functions                    │   │
│  │                                                                    │   │
│  │  /api/v1/emergency    /api/v1/location    /api/v1/route           │   │
│  │  /api/v1/building     /api/v1/crowd       /api/v1/notification    │   │
│  │  /api/v1/dashboard    /api/v1/config      /api/v1/analytics       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          ▼                       ▼                        ▼
┌──────────────────┐  ┌────────────────────┐  ┌─────────────────────┐
│   CORE ENGINE    │  │   DATA LAYER       │  │   EXTERNAL SERVICES │
│                  │  │                    │  │                     │
│ ┌──────────────┐ │  │ ┌────────────────┐ │  │ ┌─────────────────┐ │
│ │ Exit         │ │  │ │ Firestore      │ │  │ │ Google Maps     │ │
│ │ Allocation   │ │  │ │ (Primary DB)   │ │  │ │ Platform        │ │
│ │ Engine       │ │  │ └────────────────┘ │  │ └─────────────────┘ │
│ └──────────────┘ │  │ ┌────────────────┐ │  │ ┌─────────────────┐ │
│ ┌──────────────┐ │  │ │ Realtime DB    │ │  │ │ Cloud Vision    │ │
│ │ Crowd        │ │  │ │ (Live Sync)    │ │  │ │ AI              │ │
│ │ Balancing    │ │  │ └────────────────┘ │  │ └─────────────────┘ │
│ │ Engine       │ │  │ ┌────────────────┐ │  │ ┌─────────────────┐ │
│ └──────────────┘ │  │ │ Cloud Storage  │ │  │ │ Google TTS      │ │
│ ┌──────────────┐ │  │ │ (Assets)       │ │  │ │ API             │ │
│ │ Route        │ │  │ └────────────────┘ │  │ └─────────────────┘ │
│ │ Optimizer    │ │  │                    │  │ ┌─────────────────┐ │
│ └──────────────┘ │  │                    │  │ │ FCM             │ │
│ ┌──────────────┐ │  │                    │  │ │ (Push Notifs)   │ │
│ │ CCTV         │ │  │                    │  │ └─────────────────┘ │
│ │ Analyzer     │ │  │                    │  │ ┌─────────────────┐ │
│ └──────────────┘ │  │                    │  │ │ SMS Gateway     │ │
│                  │  │                    │  │ │ (Twilio)        │ │
└──────────────────┘  └────────────────────┘  └─────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Client Layer

#### Web Navigation Page (Evacuee Interface — Zero Install)
```
Technology: React + Vite (lightweight web page, NOT a mandatory PWA)
Hosting: Firebase Hosting
Access: Via unique URL in push notification or SMS — no app install required
Features:
  - Loads in any mobile browser (Chrome, Safari, Firefox, etc.)
  - Browser Geolocation API for one-time positioning (session permission only)
  - Google Maps deep link generation for exit navigation
  - Directional guidance with panic-optimized UI
  - Web Audio API / Web Speech API for voice guidance
  - Optional: Service Worker for offline caching (progressive enhancement)
  - No persistent tracking — location used only during active emergency session
  - Anonymous session ID — no user account or login required

Google Maps Deep Link Strategy:
  - Primary: google.navigation URI → opens Google Maps with walking directions to exit
  - Format: https://www.google.com/maps/dir/?api=1&destination={exit_lat},{exit_lng}&travelmode=walking
  - Fallback: Web navigation page with directional arrow if Maps unavailable
  - Both links included in push notification and SMS messages
```

#### Authority Dashboard
```
Technology: React + Vite
Hosting: Firebase Hosting
Features:
  - Real-time Firestore listeners
  - Google Maps JavaScript API integration
  - Canvas-based heatmap rendering
  - WebSocket for live updates
  - Role-based view controls
```

### 2.2 API Layer (Cloud Functions)

All backend logic runs as **Google Cloud Functions (2nd Gen)** with Node.js 20 runtime.

```
Function Groups:
│
├── emergency-functions/
│   ├── triggerEmergency      — Activate emergency protocol
│   ├── deactivateEmergency   — End emergency mode
│   ├── getEmergencyStatus    — Current emergency state
│   └── updateHazardZones     — Mark/unmark hazard areas
│
├── location-functions/
│   ├── reportLocation        — Receive user location update
│   ├── batchLocationUpdate   — Bulk location processing
│   └── getAreaUsers          — Users in geographic area
│
├── routing-functions/
│   ├── calculateRoutes       — Run exit allocation engine
│   ├── getOptimalRoute       — Get route for specific user
│   ├── recalculateRoutes     — Trigger crowd rebalancing
│   └── reportBlockedRoute    — Mark route as blocked
│
├── notification-functions/
│   ├── sendPushNotification  — FCM push to online users
│   ├── sendSMSAlert          — SMS via gateway
│   ├── initiateIVRCall       — Voice call via telephony
│   └── broadcastAlert        — Multi-channel broadcast
│
├── building-functions/
│   ├── createBuilding        — Register new building
│   ├── updateLayout          — Upload/modify floor plan
│   ├── configureExits        — Set exit locations/capacity
│   └── getBuilding           — Retrieve building data
│
├── crowd-functions/
│   ├── getCrowdDensity       — Current density data
│   ├── analyzeCCTVFrame      — Process CCTV image
│   └── getDensityHeatmap     — Heatmap data for dashboard
│
└── dashboard-functions/
    ├── getEvacuationProgress — Evacuation completion stats
    ├── getExitUtilization    — Per-exit load data
    └── getSystemHealth       — Platform health status
```

### 2.3 Core Engine Layer

#### Exit Allocation Engine
```
Input:
  - User positions (lat/lng or indoor coordinates)
  - Building graph (nodes = waypoints, edges = paths)
  - Exit nodes with capacity limits
  - Hazard zones (blocked nodes/edges)
  - Accessibility requirements per user

Algorithm: Modified Dijkstra with capacity-weighted edges
  
Processing:
  1. Build adjacency matrix from building graph
  2. Apply hazard masks (infinite weight on blocked edges)
  3. For each user:
     a. Calculate weighted distance to all reachable exits
     b. Weight = f(distance, current_density, path_width, safety_score)
     c. Select exit with minimum weighted cost AND available capacity
     d. Decrement exit remaining capacity
  4. Balance pass: redistribute from overloaded exits
  5. Output: Map<UserId, ExitAssignment>

Complexity: O(U × E × log(N)) where U=users, E=exits, N=graph nodes
Target: <3 seconds for 1,000 users
```

#### Crowd Balancing Engine
```
Trigger Conditions:
  - Exit queue length exceeds threshold (e.g., >80% capacity)
  - New hazard zone reported
  - Exit becomes blocked
  - Timer-based recheck (every 10 seconds during emergency)

Process:
  1. Snapshot current exit assignments
  2. Identify congested exits (density > threshold)
  3. For users assigned to congested exits:
     a. Recalculate with updated weights (higher penalty on congested exit)
     b. If alternative exit is significantly better (>20% improvement), reassign
     c. Send reroute notification to affected users
  4. Update dashboard with new distribution

Constraints:
  - Never reroute user who is <30m from assigned exit
  - Maximum reroutes per user: 2 (avoid confusion)
  - Reroute only if improvement > 20% in estimated time
```

#### Route Optimizer
```
Graph Structure:
  - Nodes: Intersections, waypoints, exit points, stairwells, elevators
  - Edges: Corridors, paths, doorways
  - Edge Properties:
    - distance (meters)
    - width (meters) — affects capacity
    - accessibility (boolean — wheelchair passable)
    - current_density (0-1 normalized)
    - safety_score (0-1, 0 = hazardous)

Weight Function:
  w(edge) = distance × (1 + density_penalty) × (1 / safety_score) × accessibility_factor

Where:
  density_penalty = max(0, (current_density - 0.5) × 4)  // exponential penalty above 50%
  accessibility_factor = 1.0 for standard, 0.0 (blocked) for non-accessible when user needs accessible
```

---

## 3. Data Flow Architecture

### Emergency Activation Flow
```
Authority Dashboard                Cloud Functions              Firestore/RTDB
      │                                  │                          │
      │  POST /emergency/trigger         │                          │
      ├─────────────────────────────────►│                          │
      │                                  │  Write emergency record  │
      │                                  ├─────────────────────────►│
      │                                  │                          │
      │                                  │  Trigger onWrite:        │
      │                                  │  - Fetch area users      │
      │                                  │  - Run exit allocation   │
      │                                  │  - Send notifications    │
      │                                  │  - Start crowd monitor   │
      │                                  │                          │
      │  SSE: emergency activated        │                          │
      │◄─────────────────────────────────┤                          │
      │                                  │                          │
    [Dashboard updates in real-time via Firestore onSnapshot listeners]
```

### User Location & Navigation Flow
```
User's Browser                 Cloud Functions              RTDB / Firestore
(Web Nav Page)                       │                          │
    │                                │                          │
    │  User opens link from          │                          │
    │  push notification or SMS      │                          │
    │  ─────────────────────────     │                          │
    │                                │                          │
    │  Browser prompts for           │                          │
    │  one-time location permission  │                          │
    │  ─────────────────────────     │                          │
    │                                │                          │
    │  POST /location/report         │                          │
    │  (anonymous session ID)        │                          │
    ├───────────────────────────────►│                          │
    │                                │  Write to RTDB           │
    │                                ├─────────────────────────►│
    │                                │                          │
    │  GET /route/optimal            │                          │
    ├───────────────────────────────►│                          │
    │                                │  Read building graph     │
    │                                │  Read user location      │
    │                                │  Run route calculation   │
    │                                │                          │
    │  Response: {exit, path, ETA,   │                          │
    │   googleMapsDeepLink}          │                          │
    │◄───────────────────────────────┤                          │
    │                                │                          │
    │  User can:                     │                          │
    │  1. Follow web nav page arrows │                          │
    │  2. Tap "Open in Google Maps" → launches Maps app         │
    │  3. Listen to voice guidance   │                          │
    │                                │                          │
    │  [Poll for reroutes or RTDB]   │                          │
    │◄─────────────────────────────────────────────────────────┤
```

### Privacy-Preserving Location Flow
```
Design Principles:
  - Location permission requested ONLY when user opens navigation link
  - Browser displays standard permission dialog (user can deny)
  - Location is session-only — NOT stored beyond emergency TTL
  - No background tracking — only active while page is open
  - Anonymous session ID generated per emergency (no PII)
  - All location data auto-deleted after emergency resolution + TTL
  - No user account, login, or registration required
```

---

## 4. Real-Time Synchronization Architecture

### Firebase Realtime Database Structure (Hot Path)
```
/emergencies/{emergencyId}/
  ├── status: "ACTIVE" | "RESOLVED"
  ├── triggeredAt: timestamp
  ├── buildingId: string
  ├── hazardZones: [...]
  └── updatedAt: timestamp

/locations/{emergencyId}/{anonymousUserId}/
  ├── lat: number
  ├── lng: number
  ├── floor: number
  ├── accuracy: number
  ├── timestamp: number
  └── deviceType: string

/assignments/{emergencyId}/{anonymousUserId}/
  ├── exitId: string
  ├── route: [{lat, lng}, ...]
  ├── estimatedTime: number
  ├── version: number
  └── updatedAt: timestamp

/crowd/{emergencyId}/{exitId}/
  ├── currentDensity: number (0-1)
  ├── queueLength: number
  ├── assignedUsers: number
  ├── capacity: number
  └── status: "OPEN" | "CONGESTED" | "BLOCKED"
```

### Firestore Structure (Cold Path)
```
buildings/{buildingId}/
  ├── name, address, metadata
  ├── floors/{floorId}/
  │   ├── planImageUrl
  │   ├── graphData (nodes, edges)
  │   └── exits/{exitId}/
  │       ├── location, name
  │       ├── capacity
  │       ├── accessible: boolean
  │       └── type: "DOOR" | "STAIRWELL" | "ELEVATOR"
  └── config/
      ├── densityThresholds
      ├── notificationPreferences
      └── accessibilityRouting

emergencies_log/{emergencyId}/
  ├── buildingId, triggeredBy
  ├── startTime, endTime
  ├── totalEvacuees
  ├── avgEvacuationTime
  └── exitUtilization: {exitId: count}

users/{anonymousId}/
  ├── deviceType
  ├── accessibilityNeeds
  └── lastKnownLocation
```

---

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FIREBASE HOSTING                    │
│                                                       │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │  Web Nav Page    │      │  Authority Dashboard  │  │
│  │  (nav.netra       │      │  (admin.netra        │  │
│  │   .app)          │      │   .app)               │  │
│  │  No install req. │      │                       │  │
│  └─────────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              GOOGLE CLOUD PLATFORM                    │
│                                                       │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Cloud        │  │ Firestore │  │ Realtime DB   │  │
│  │ Functions    │  │          │  │               │  │
│  │ (2nd Gen)    │  │          │  │               │  │
│  │ Node.js 20   │  │          │  │               │  │
│  └──────────────┘  └──────────┘  └───────────────┘  │
│                                                       │
│  ┌──────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Cloud        │  │ Cloud    │  │ Secret        │  │
│  │ Storage      │  │ Vision   │  │ Manager       │  │
│  │ (Assets)     │  │ AI       │  │               │  │
│  └──────────────┘  └──────────┘  └───────────────┘  │
│                                                       │
│  ┌──────────────┐  ┌──────────┐                      │
│  │ Cloud        │  │ Cloud    │                      │
│  │ Monitoring   │  │ Logging  │                      │
│  └──────────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────┘
```

### Environment Configuration
```
Environments:
  ├── development (dev)
  │   ├── Firebase project: netra-dev
  │   │   ├── Hosting: nav.netra-dev (Mobile PWA)
  │   │   └── Hosting: admin.netra-dev (Dashboard)
  │   │
  │   ├── Firebase project: netra-staging
  │   │   ├── Hosting: nav.netra-staging
  │   │   └── Hosting: admin.netra-staging
  │   │
  │   └── Production Environment (Stable)
      ├── Firebase project: netra-prod
      ├── Firestore: production data
      ├── Functions: production deploy (multi-region)
      └── Cloud Armor: WAF protection
```

---

## 6. Offline & Fallback Architecture

### Progressive Enhancement Strategy
```
The web navigation page works WITHOUT installation.
Optional progressive enhancement for users who keep the page open:

Online Mode (Primary):
  ├── Full web navigation with real-time updates
  ├── Google Maps deep link for native navigation
  ├── Voice guidance via Web Speech API
  └── Live reroute notifications

Degraded Connectivity:
  ├── Google Maps deep link still works (Maps caches offline)
  ├── Last known route displayed on web page
  ├── Static directional text guidance
  └── SMS fallback with Google Maps link

Fully Offline:
  ├── SMS with text directions + Google Maps link
  ├── IVR voice call with step-by-step instructions
  ├── PA system broadcast (building-level)
  └── CCTV-detected user — authority-directed rescue
```

### Fallback Communication Chain
```
Priority 1: Push Notification with Google Maps deep link + web nav page link
    ↓ (if user has no push subscription or no internet)
Priority 2: SMS with Google Maps deep link + text directions
    ↓ (if SMS fails)
Priority 3: Automated voice call (IVR) with step-by-step directions
    ↓ (if no phone capability)
Priority 4: PA system integration (building-level)
    ↓ (fallback)
Priority 5: CCTV-detected user — authority-directed rescue

Note: Google Maps deep links work even without the NETRA web page.
Users can navigate using only Google Maps if they click the link.
The web navigation page provides additional value (rerouting, voice,
heatmap) but is NOT required for basic evacuation guidance.
```

---

## 7. Security Architecture

```
┌─────────────────────────────────────────┐
│           SECURITY LAYERS                 │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  Layer 1: Network Security          │ │
│  │  - HTTPS/TLS 1.3 everywhere         │ │
│  │  - Cloud Armor WAF (production)     │ │
│  │  - DDoS protection                  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Layer 2: Authentication            │ │
│  │  - Firebase Auth (email, SSO)       │ │
│  │  - MFA for admin users              │ │
│  │  - Anonymous session tokens for     │ │
│  │    evacuees (no login required)      │ │
│  │  - No persistent user accounts      │ │
│  │    for evacuees                      │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Layer 3: Authorization             │ │
│  │  - Firestore Security Rules         │ │
│  │  - RBAC (Admin, Operator, Viewer)   │ │
│  │  - Custom Claims in JWT             │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Layer 4: Data Protection           │ │
│  │  - AES-256 encryption at rest       │ │
│  │  - Anonymous session IDs only       │ │
│  │  - No persistent tracking           │ │
│  │  - No continuous background         │ │
│  │    monitoring                        │ │
│  │  - Location used ONLY during        │ │
│  │    active emergency session          │ │
│  │  - Auto-expiry of location data     │ │
│  │  - Secret Manager for API keys      │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Layer 5: Audit & Compliance        │ │
│  │  - Cloud Audit Logs                 │ │
│  │  - Emergency trigger audit trail    │ │
│  │  - Data access logging              │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 8. Scalability Strategy

| Component | Scaling Mechanism | Limits |
|---|---|---|
| Cloud Functions | Auto-scale (0 to 1000 instances) | Configurable max instances per function |
| Firestore | Auto-scale reads/writes | 10,000 writes/sec per database |
| Realtime Database | Auto-scale with sharding | 200,000 concurrent connections per shard |
| Firebase Hosting | CDN-backed, auto-scale | Unlimited bandwidth |
| Cloud Vision AI | Auto-scale API | Quota-based (configurable) |
| Google Maps API | Auto-scale | Quota-based (configurable) |

### Sharding Strategy for Large Deployments
```
For city-level deployment:
  - Shard RTDB by geographic zone
  - Each building/venue gets dedicated Firestore subcollection
  - Cloud Functions deployed per-region for latency
  - Independent emergency contexts prevent cross-contamination
```

---

## 9. Dashboard Simulation Mode (Current State)

The authority dashboard currently operates in **client-side simulation mode**. The `generateScenarioData()` function in `App.tsx` acts as a mock of the backend Core Engine, producing:

- **Crowd distribution**: Random placement of 45–70 people across predefined walkable zone bounding boxes (SVG coordinates, not geospatial).
- **Danger zones**: Randomized position within the isometric map grid.
- **Route congestion flags**: Boolean values (`exitACongested`, `exitBCongested`) determined by `Math.random()` thresholds, not computed from Dijkstra-based density.
- **Exit utilization**: Randomized percentage bars correlated to crowd count.

The `handleRegenerate` action triggers a full re-execution of this mock, updating all dashboard panels (analytics cards, crowd stats, alert feed, and the isometric map) via React `useState`.

**Transition to production**: Replace `generateScenarioData()` with Firestore `onSnapshot` listeners and RTDB subscriptions connected to the Cloud Functions Core Engine described in sections 3–4.
