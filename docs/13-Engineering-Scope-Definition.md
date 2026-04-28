# Engineering Scope Definition — NETRA

---

## 1. Scope Classification

### IN SCOPE — MVP (Phase 1)

| Module | Features | Priority |
|---|---|---|
| **Emergency Trigger** | Activate/deactivate emergency, select building, severity levels, confirmation dialog | P0 |
| **User Location** | GPS detection (outdoor), WiFi fallback (indoor), manual confirmation, anonymous IDs | P0 |
| **Exit Allocation Engine** | Graph-based routing, capacity-weighted Dijkstra, hazard avoidance, accessibility routing | P0 |
| **Crowd Balancing** | Density monitoring, dynamic rerouting, congestion detection, rebalancing triggers | P0 |
| **Mobile Navigation UI** | Directional arrow, distance badge, exit label, reroute alert, panic-optimized design | P0 |
| **Push Notifications** | FCM integration, geofenced alerts, deep link to navigation, high-priority channel | P0 |
| **Dashboard — Core** | Building map view, crowd density heatmap, exit utilization bars, evacuation progress | P0 |
| **Building Config** | Upload floor plan, mark exits, define route graph, set capacity limits | P1 |
| **Voice Guidance** | Google TTS integration, directional voice prompts, reroute alerts | P1 |
| **Authentication** | Firebase Auth, admin login with MFA, anonymous auth for evacuees, RBAC (4 roles) | P0 |
| **Shared Types** | TypeScript types shared across mobile, dashboard, and functions | P0 |
| **Service Worker** | App shell caching, floor plan caching, offline fallback screen | P1 |

### IN SCOPE — Post-MVP (Phase 2-3)

| Module | Features | Priority |
|---|---|---|
| **SMS Fallback** | SMS gateway integration, compressed directions, delivery tracking | P2 |
| **IVR Voice Calls** | Automated voice call with step-by-step instructions | P2 |
| **CCTV Analysis** | Cloud Vision AI crowd estimation, density heatmap, motion detection | P2 |
| **Accessibility Wearable** | Vibration direction patterns, smartwatch integration | P2 |
| **Hazard Zone Editor** | Draw hazard polygons on map, real-time graph updates | P2 |
| **Communication Center** | Broadcast composer, template messages, delivery analytics | P2 |
| **Multi-Building** | Single dashboard managing multiple buildings | P3 |
| **Drill Mode** | Simulate evacuation without real alerts | P3 |
| **Historical Analytics** | Post-event reports, evacuation performance comparison | P3 |
| **Cell Broadcast** | Government cell broadcast system integration | P3 |
| **Third-Party API** | Public API for BMS and IoT integrations | P3 |
| **Multi-Language** | Voice and UI in multiple languages | P3 |

### OUT OF SCOPE

| Item | Reason |
|---|---|
| Hardware beacon deployment | MVP uses existing device capabilities only |
| Custom indoor positioning hardware | Relies on GPS + WiFi; BLE beacons are future expansion |
| Native mobile apps (iOS/Android) | PWA provides cross-platform reach for MVP |
| PA system integration | Requires on-premise hardware integration |
| IoT sensor integration | Future API expansion |
| Video surveillance system management | Only frame analysis; no CCTV system control |
| Emergency service dispatch (911/112) | Complementary to, not replacement for, official systems |
| Medical triage or first-aid guidance | Outside platform scope |
| Insurance claim processing | Outside platform scope |
| Building structural analysis | Outside platform scope |

---

## 2. Technical Boundaries

### Frontend Boundaries
```
Mobile PWA:
  IN:  Navigation UI, emergency alerts, voice playback, offline cache,
       geolocation, settings, accessibility preferences
  OUT: Camera access, NFC, Bluetooth, AR overlays, payment processing

Dashboard:
  IN:  Building management, emergency controls, heatmap visualization,
       communication controls, user management, system settings
  OUT: Video streaming, 3D building models, financial reports
```

### Backend Boundaries
```
Cloud Functions:
  IN:  API handlers, routing engine, notification dispatch, CCTV analysis,
       data validation, audit logging, Firestore/RTDB operations
  OUT: Long-running ML training, video transcoding, file conversion,
       real-time video streaming, blockchain
```

### Data Boundaries
```
Data We Store:
  - Anonymous user positions (temporary, auto-expiring)
  - Building configurations (permanent)
  - Emergency event logs (365-day retention)
  - Admin user accounts (permanent)
  - System configuration (permanent)
  - Audit logs (730-day retention)

Data We Do NOT Store:
  - User names, emails, or phone numbers (evacuees)
  - Biometric data
  - CCTV video recordings (only individual frames analyzed)
  - Personal health information
  - Financial information
  - Social media profiles
```

---

## 3. Integration Boundaries

### Google Services Used

| Service | Purpose | MVP | Post-MVP |
|---|---|---|---|
| Firebase Firestore | Primary persistent database | ✅ | ✅ |
| Firebase Realtime DB | Real-time location & assignment sync | ✅ | ✅ |
| Firebase Auth | User & admin authentication | ✅ | ✅ |
| Firebase Cloud Messaging | Push notifications | ✅ | ✅ |
| Firebase Hosting | Frontend deployment | ✅ | ✅ |
| Cloud Functions (2nd Gen) | Backend logic | ✅ | ✅ |
| Google Maps Platform | Maps, directions, geolocation | ✅ | ✅ |
| Google Cloud Vision AI | CCTV crowd analysis | ❌ | ✅ |
| Google Text-to-Speech | Voice evacuation guidance | ✅ | ✅ |
| Cloud Storage | Floor plan images, assets | ✅ | ✅ |
| Cloud Monitoring | System health | ✅ | ✅ |
| Cloud Logging | Structured logs | ✅ | ✅ |
| Secret Manager | API key storage | ✅ | ✅ |

### Third-Party Integrations

| Service | Purpose | MVP | Post-MVP |
|---|---|---|---|
| Twilio (or equivalent) | SMS gateway | ❌ | ✅ |
| Twilio Voice (or equivalent) | IVR calls | ❌ | ✅ |

---

## 4. Team Responsibilities

### Ideal Team Structure (4-6 engineers)

| Role | Scope |
|---|---|
| **Full-Stack Lead** | Architecture, core engine, API design, code review |
| **Frontend (Mobile)** | Mobile PWA, navigation UI, voice integration, offline support |
| **Frontend (Dashboard)** | Authority dashboard, heatmap, building editor, charts |
| **Backend** | Cloud Functions, Firestore/RTDB logic, notification services |
| **DevOps/Infra** | Firebase config, CI/CD, monitoring, security rules |
| **QA/Testing** | Test strategy, load testing, accessibility audit |

### Hackathon Team (2-3 people)

| Person | Scope |
|---|---|
| **Person 1** | Backend engine + API + Firebase setup |
| **Person 2** | Mobile PWA + navigation UI |
| **Person 3** | Dashboard + building config + demo data |

---

## 5. Deliverables Checklist

### MVP Deliverables
- [x] Monorepo structure setup ✅
- [x] Firebase project configured (netra-dev/staging/prod) ✅
- [x] High-fidelity Dashboard UI implemented ✅
- [x] Emergency trigger + simulation logic ✅
- [x] Exit allocation engine logic ✅
- [x] Crowd balancing logic ✅
- [ ] Mobile navigation PWA 📋
- [ ] Push notification delivery via FCM 📋
- [ ] Voice guidance via Google TTS 📋
- [ ] Real-time data sync with Firestore/RTDB 📋
- [ ] Service worker with offline fallback 📋
- [ ] Authentication with RBAC 📋
- [x] Seed/simulation scripts ✅
- [x] Project documentation (18 files) ✅
- [ ] Unit tests for core engine (≥90% coverage) 📋

### Post-MVP Deliverables
- [ ] SMS fallback communication
- [ ] IVR voice call integration
- [ ] CCTV crowd analysis with Vision AI
- [ ] Hazard zone drawing tool
- [ ] Communication broadcast center
- [ ] Multi-building management
- [ ] Emergency drill mode
- [ ] Historical analytics dashboard
- [ ] Load testing report (10K concurrent users)
- [ ] Security audit report
- [ ] Accessibility audit (WCAG 2.1 AA)
