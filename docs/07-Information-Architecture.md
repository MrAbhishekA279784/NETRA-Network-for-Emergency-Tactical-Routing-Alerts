# Information Architecture — NETRA

---

## 1. Application Structure

### Web Navigation Page (Evacuee — Zero Install)

```
NETRA Web Navigation (opens in any mobile browser via link)
│
├── 🚨 Emergency Landing Screen (entry point from push/SMS link)
│   ├── Emergency type & severity indicator
│   ├── Building/zone identification
│   ├── "NAVIGATE WITH GOOGLE MAPS" button (deep link to exit)
│   ├── "USE WEB NAVIGATION" button (in-browser guidance)
│   ├── Voice guidance auto-start toggle
│   ├── Browser location permission prompt (one-time, session only)
│   └── Timestamp of alert
│
├── 🧭 Web Navigation Screen (Core Experience)
│   ├── Large directional arrow (primary)
│   ├── Distance to assigned exit
│   ├── Exit name/identifier
│   ├── "Open in Google Maps" button (persistent)
│   ├── Mini-map (optional, collapsible)
│   ├── Hazard warnings (if applicable)
│   ├── Reroute notification banner
│   ├── Voice guidance indicator (on/off)
│   └── Emergency contact button
│
├── 🔄 Reroute Alert Overlay
│   ├── "Route Changed" banner
│   ├── Reason (congestion/blocked/hazard)
│   ├── New exit identifier + updated Google Maps link
│   ├── Updated directional arrow
│   └── Auto-dismiss after 5 seconds
│
├── ✅ Safe Zone Confirmation
│   ├── "You've reached the exit" message
│   ├── Further instructions (assembly point)
│   ├── "Report Issue" option
│   └── "I need assistance" button
│
├── ♿ Accessibility Options (inline, not a separate settings page)
│   ├── Wheelchair / mobility aid toggle
│   ├── Visual impairment mode
│   ├── High contrast mode toggle
│   └── Stored in sessionStorage (temporary, not persistent)
│
└── 📴 Offline / Degraded Mode
    ├── Last known directions (if page was already open)
    ├── Google Maps deep link (may still work offline in Maps app)
    ├── Static text directions
    └── "Move toward nearest exit sign" fallback

Privacy Note:
  - No app installation required
  - No user account or login
  - Anonymous session ID generated per visit
  - Location permission requested once via browser prompt
  - No background tracking — location stops when page closes
  - All session data cleared after browser tab closes
```

### Authority Dashboard (Web)

```
NETRA Authority Dashboard
│
├── 🔐 Login / Authentication
│   ├── Email + MFA login
│   ├── Role-based redirect (Admin vs Operator vs Viewer)
│   └── Session management
│
├── 📊 Overview / Command Center
│   ├── System health status
│   ├── Active emergencies list
│   ├── Building quick-select
│   ├── Alert notifications feed
│   └── Recent activity log
│
├── 🚨 Emergency Control Panel
│   ├── Building/zone selector
│   ├── Emergency type selector (fire, threat, natural disaster, etc.)
│   ├── Severity level selector
│   ├── "TRIGGER EMERGENCY" button (with confirmation)
│   ├── Active emergency controls
│   │   ├── Mark hazard zones (map overlay)
│   │   ├── Block/unblock exits
│   │   ├── Broadcast message
│   │   └── End emergency
│   └── Emergency timeline log
│
├── 🗺️ Building Map View
│   ├── Floor plan display (pan/zoom)
│   ├── Floor selector tabs
│   ├── Layer toggles
│   │   ├── Crowd density heatmap
│   │   ├── Exit locations & utilization
│   │   ├── Hazard zones
│   │   ├── Route paths
│   │   └── Accessibility users
│   ├── Real-time user dots (anonymized)
│   └── Exit status indicators (green/yellow/red)
│
├── 📈 Evacuation Progress
│   ├── Overall progress bar
│   ├── Per-exit completion stats
│   ├── Estimated completion time
│   ├── Users requiring assistance list
│   ├── Rerouting event log
│   └── Communication delivery stats
│
├── 📢 Communication Center
│   ├── Broadcast message composer
│   ├── Channel selector (push/SMS/voice/all)
│   ├── Message history
│   ├── Delivery status tracking
│   └── Template messages
│
├── 🏗️ Building Management
│   ├── Building list
│   ├── Add/edit building
│   │   ├── Upload floor plans
│   │   ├── Configure exits
│   │   ├── Define route graph
│   │   ├── Set capacity thresholds
│   │   └── Accessibility routing config
│   └── Building configuration history
│
├── 📋 Reports & Analytics (Post-MVP)
│   ├── Historical evacuations
│   ├── Performance metrics
│   ├── Drill comparisons
│   └── Export (PDF/CSV)
│
├── 👥 User Management
│   ├── Operator accounts
│   ├── Role assignments
│   ├── Access control settings
│   └── Activity audit log
│
└── ⚙️ System Settings
    ├── Notification configuration
    ├── API key management
    ├── Density thresholds
    ├── Rebalancing parameters
    ├── Voice language settings
    └── Data retention policies
```

---

## 2. Navigation Patterns

### Web Navigation Page — User Flow During Emergency

```
User receives Push Notification or SMS
    │
    ├── [Contains two links:]
    │   ├── 1. Google Maps deep link (direct to exit location)
    │   └── 2. Web navigation page link (full guidance experience)
    │
    ├── [User taps Google Maps link]
    │       │
    │       ▼
    │   Google Maps opens with walking directions to assigned exit
    │   (No NETRA interaction needed — standalone navigation)
    │
    └── [User taps Web Navigation link]
            │
            ▼
        Emergency Landing Screen (browser)
            │
            ├── Browser prompts for location permission (one-time)
            │
            ├── [TAP: Navigate with Google Maps]
            │       → Opens Google Maps deep link
            │
            ├── [TAP: Use Web Navigation]
            │       │
            │       ▼
            │   Web Navigation Screen
            │       │
            │       ├── [Reroute Event] → Reroute Overlay → Updated Google Maps link
            │       │
            │       ├── [Reach Exit] → Safe Zone Confirmation
            │       │
            │       └── [Connection Lost] → Static directions + cached Google Maps link
            │
            └── [No Action for 10s] → Auto-start web navigation
```

### Authority Dashboard — Navigation Flow

```
Login
  │
  ▼
Overview (Command Center)
  │
  ├── Emergency Control Panel ←→ Building Map View
  │       │                           │
  │       ├── Evacuation Progress     │
  │       │                           │
  │       └── Communication Center    │
  │                                   │
  ├── Building Management ────────────┘
  │
  ├── Reports & Analytics
  │
  ├── User Management
  │
  └── System Settings
```

> **Current implementation note**: The dashboard is built as a **unified single-screen command center** (`App.tsx`). All panels—isometric map, analytics cards, crowd stats, exit utilization, alert feed, and emergency controls—render on a single fixed viewport without sidebar navigation or page routing. The multi-page structure above represents the planned production architecture.

---

## 3. Content Hierarchy

### Evacuee Interface — Priority Order
1. **Google Maps link** (one-tap exit navigation) — highest-value action
2. **Direction** (where to go) — largest visual element on web page
3. **Distance** (how far) — secondary prominence
4. **Exit identifier** (which exit) — supporting context
5. **Hazard warning** (what to avoid) — conditional alert
6. **Reroute notice** (route changed + updated Maps link) — interrupt priority

### Authority Dashboard — Priority Order
1. **Emergency status** (is there an active emergency?) — always visible
2. **Crowd distribution** (where are people?) — primary visualization
3. **Exit utilization** (are exits balanced?) — key decision data
4. **Assistance requests** (who needs help?) — critical action items
5. **Communication status** (did messages deliver?) — verification
6. **System health** (is the platform working?) — operational awareness

---

## 4. Data Architecture Summary

### Real-Time Data (Firebase Realtime Database)
- User locations (anonymized)
- Exit density counts
- Emergency status
- Route assignments
- Crowd balancing signals

### Persistent Data (Firestore)
- Building configurations
- Floor plans and route graphs
- User accessibility profiles
- Emergency event logs
- Audit trail
- System configuration

### Static Assets (Cloud Storage)
- Floor plan images
- Pre-rendered map tiles
- Voice instruction audio cache
- UI assets

---

## 5. URL Structure

### Web Navigation Page (Evacuee)
```
/e/{emergencyId}            → Emergency landing (entry from push/SMS link)
/e/{emergencyId}/nav        → Active web navigation
/e/{emergencyId}/safe       → Safe zone confirmation
/e/{emergencyId}/offline    → Degraded/offline fallback

Note: All evacuee URLs are sessionized — no login required.
Anonymous session ID generated on first visit.
URLs are unique per emergency (not per user) for shareability.
Google Maps deep links are separate external URLs.
```

### Authority Dashboard
```
/login                  → Authentication
/dashboard              → Overview / Command center
/emergency              → Emergency control panel
/emergency/:id          → Active emergency details
/map/:buildingId        → Building map view
/progress/:emergencyId  → Evacuation progress
/communications         → Communication center
/buildings              → Building management list
/buildings/:id/edit     → Building configuration editor
/reports                → Reports & analytics
/users                  → User management
/settings               → System settings
```

> **Current state**: The dashboard currently renders all panels inline within a single route (`/`). The route structure above is the planned production layout.
