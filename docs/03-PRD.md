# Product Requirements Document — NETRA

## AI-Powered Intelligent Emergency Evacuation, Crowd Balancing, and Crisis Response Platform

---

## 1. Product Overview

### Product Name
**NETRA** — Dynamic Emergency Field-Adaptive Navigation & Crowd Evacuation System

### Vision
Transform emergency evacuation from passive alarm notification into active, AI-driven, real-time guidance that saves lives by intelligently distributing crowds across optimal exit routes.

### Target Release
- **MVP (Hackathon Demo)**: 4-6 weeks
- **Beta (Pilot Deployment)**: 3 months
- **V1.0 (Commercial Release)**: 6 months

---

## 2. User Personas

### Persona 1: Evacuee (General Public)
- **Name**: Priya, 28, office worker
- **Context**: Inside a shopping mall when a fire alarm triggers
- **Needs**: Clear, immediate guidance to the nearest safe exit
- **Pain Points**: Panics easily; doesn't know building layout; follows crowds blindly
- **Tech**: Any smartphone with a web browser (no app installation required)

### Persona 2: Authority Operator
- **Name**: Commander Raj, 45, building safety officer
- **Context**: Monitoring the security control room during an emergency
- **Needs**: Real-time crowd visibility, ability to trigger alerts, dynamic control
- **Pain Points**: Current systems show alarms but not crowd behavior; communication is fragmented
- **Tech**: Desktop dashboard in control room

### Persona 3: Disabled Evacuee
- **Name**: Amir, 35, wheelchair user
- **Context**: On the 3rd floor of a corporate building during evacuation
- **Needs**: Accessible route avoiding stairs; assistance alert to responders
- **Pain Points**: Standard evacuation routes include stairs; feels abandoned during drills
- **Tech**: Any smartphone with a web browser; accessibility features enabled on device

### Persona 4: Emergency Responder
- **Name**: Lt. Sarah, 38, fire department captain
- **Context**: Arriving at a multi-story building during active evacuation
- **Needs**: Situational awareness of crowd distribution, blocked routes, people needing rescue
- **Pain Points**: No visibility into building conditions until physically inside
- **Tech**: Tablet or rugged mobile device

---

## 3. Feature Requirements

### 3.1 MVP Features (Must Have)

#### F1: Emergency Trigger Dashboard
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Web-based authority dashboard to activate emergency protocols |
| **Key Functions** | Trigger emergency alert; select affected zone/building; view building layout; monitor evacuation status |
| **Users** | Authority operators, building administrators |
| **Acceptance** | Emergency can be triggered within 2 clicks; dashboard loads in <2 seconds |

#### F2: User Location Detection
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Detect and process user locations using available signals |
| **Key Functions** | GPS positioning (outdoor); WiFi approximation (indoor); last-known fallback; manual confirmation |
| **Users** | System (automated) |
| **Acceptance** | Location acquired within 5 seconds; accuracy within 10m outdoor, 25m indoor |

#### F3: AI Exit Allocation Engine
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Calculate optimal exit assignment for each user based on distance, density, capacity, and safety |
| **Key Functions** | Graph-based routing; weighted edge optimization; capacity-aware distribution; hazard zone avoidance |
| **Users** | System (automated) |
| **Acceptance** | Route calculation for 1,000 users in <3 seconds; exit load variance <20% |

#### F4: Crowd Balancing Engine
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Continuously recalculate exit assignments as crowd density changes |
| **Key Functions** | Real-time density monitoring; dynamic rerouting; blocked exit detection; rebalancing triggers |
| **Users** | System (automated) |
| **Acceptance** | Rebalancing triggered within 5 seconds of threshold breach; no exit exceeds 150% capacity |

#### F5: Web-Based Navigation Interface (Zero Install)
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Lightweight browser-based navigation page (no app installation required) with Google Maps deep link fallback |
| **Key Functions** | Google Maps deep link to assigned exit; browser-based directional arrow; distance indicator; exit identifier; rerouting alerts; hazard warnings |
| **Users** | General public (evacuees) — accessed via link in push notification or SMS |
| **Acceptance** | Navigation page loads in any mobile browser within 3 seconds; Google Maps deep link opens native Maps app; no installation or signup required; WCAG AA contrast |

#### F6: Multi-Channel Alert Delivery
| Attribute | Detail |
|---|---|
| **Priority** | P0 — Critical |
| **Description** | Deliver emergency guidance via push notification (FCM) or SMS, each containing a Google Maps deep link to the assigned exit and a link to the web navigation page |
| **Key Functions** | Push notification with Google Maps deep link; SMS fallback with Google Maps link; link to browser-based navigation page; no app install required |
| **Users** | General public with any mobile phone |
| **Acceptance** | Notification/SMS delivered within 5 seconds of trigger; Google Maps link opens correct exit location; web navigation page accessible without login |

#### F7: Voice Guidance
| Attribute | Detail |
|---|---|
| **Priority** | P1 — Important |
| **Description** | Text-to-speech evacuation instructions using Google TTS API |
| **Key Functions** | Directional voice prompts; distance announcements; rerouting alerts; repeat on demand |
| **Users** | All evacuees (especially visually impaired) |
| **Acceptance** | Clear pronunciation; <500ms latency; instructions match visual guidance |

#### F8: Real-Time Crowd Density Heatmap
| Attribute | Detail |
|---|---|
| **Priority** | P1 — Important |
| **Description** | Visual heatmap overlay on building layout showing crowd concentration |
| **Key Functions** | Color-coded density visualization; exit utilization bars; congestion alerts; refresh every 2 seconds |
| **Users** | Authority operators |
| **Acceptance** | Heatmap reflects location data within 3-second delay; color scale is intuitive |

#### F9: Building Layout Configuration
| Attribute | Detail |
|---|---|
| **Priority** | P1 — Important |
| **Description** | Admin tool to configure building floor plans, exit locations, and route graphs |
| **Key Functions** | Upload floor plan image; mark exits; define route graph; set capacity limits; mark accessible routes |
| **Users** | Building administrators |
| **Acceptance** | Layout configurable without code changes; changes reflected in <30 seconds |

---

### 3.2 Advanced Features (Post-MVP)

#### F10: SMS Navigation Fallback
| Priority | P2 | Send compressed directional instructions via SMS when internet unavailable |

#### F11: IVR Voice Call Guidance
| Priority | P2 | Automated voice call with step-by-step evacuation instructions for basic phone users |

#### F12: CCTV Crowd Analysis
| Priority | P2 | Google Cloud Vision AI integration for crowd density estimation from camera feeds |

#### F13: Accessibility Wearable Support
| Priority | P2 | Directional vibration patterns via smartwatch/band for hearing-impaired users |

#### F14: Multi-Building Management
| Priority | P3 | Single dashboard managing evacuation across multiple buildings/venues |

#### F15: Emergency Drill Mode
| Priority | P3 | Simulate evacuation scenarios without triggering real alerts |

#### F16: Historical Analytics
| Priority | P3 | Post-event analysis dashboard with evacuation performance metrics |

#### F17: Cell Broadcast Integration
| Priority | P3 | Government cell broadcast system integration for area-wide alerts |

#### F18: Third-Party API
| Priority | P3 | Public API for building management systems and IoT integrations |

---

## 4. Non-Functional Requirements

### Performance
| Metric | Target |
|---|---|
| Route calculation latency (1,000 users) | <3 seconds |
| Dashboard page load | <2 seconds |
| Push notification delivery | <5 seconds |
| Heatmap refresh rate | Every 2 seconds |
| API response time (P95) | <500ms |
| Concurrent users supported | 10,000+ per instance |

### Availability
| Metric | Target |
|---|---|
| System uptime | 99.9% |
| Emergency mode availability | 99.99% |
| Graceful degradation | Offline fallback active within 3 seconds |

### Security
| Requirement | Detail |
|---|---|
| Authentication | Firebase Auth with MFA for admin users |
| Authorization | Role-based access control (RBAC) |
| Data encryption | TLS 1.3 in transit; AES-256 at rest |
| Audit logging | All emergency triggers, route changes, broadcasts logged |
| PII handling | Anonymous session IDs only; no persistent tracking; no continuous background monitoring; location used only during active emergency; auto-expiry |
| API security | API key rotation; rate limiting; CORS policy |
| Privacy design | No app installation required; no persistent user accounts for evacuees; temporary session-based location; data deleted after emergency resolution + configured TTL |

### Accessibility
| Requirement | Detail |
|---|---|
| Zero-install access | Navigation works in any mobile browser; no app installation required |
| Mobile UI | WCAG 2.1 AA compliance |
| Dashboard | WCAG 2.1 AA compliance |
| Voice guidance | Clear TTS with adjustable speed |
| Color contrast | Minimum 4.5:1 ratio for text; 3:1 for large elements |
| Screen reader | Full ARIA support in dashboard |

### Scalability
| Dimension | Target |
|---|---|
| Horizontal scaling | Auto-scale Cloud Functions based on load |
| Database scaling | Firestore auto-scaling with sharding strategy |
| Real-time sync | Firebase Realtime Database for sub-second updates |
| Multi-region | Deploy across 2+ GCP regions for resilience |

---

## 5. Technology Stack (Mandated)

| Layer | Technology |
|---|---|
| Frontend (Evacuee) | Lightweight web navigation page (React) — no install required; Google Maps deep linking |
| Frontend (Dashboard) | React + Vite |
| Backend | Google Cloud Functions (Node.js) |
| Database | Firebase Firestore |
| Real-time Sync | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Maps & Navigation | Google Maps Platform (Directions, Distance Matrix, Geolocation APIs) |
| Computer Vision | Google Cloud Vision AI |
| Voice/TTS | Google Text-to-Speech API |
| Hosting | Firebase Hosting |
| Monitoring | Google Cloud Monitoring + Cloud Logging |
| CI/CD | GitHub Actions → Firebase Deploy |

---

## 6. Release Plan

| Phase | Timeline | Deliverables |
|---|---|---|
| **MVP Alpha** | Weeks 1-4 | Emergency trigger, location detection, exit allocation, mobile navigation, push notifications, basic dashboard |
| **MVP Beta** | Weeks 5-8 | Voice guidance, crowd density heatmap, building layout config, SMS fallback |
| **V1.0** | Weeks 9-16 | CCTV integration, IVR calls, accessibility enhancements, analytics, multi-building support |
| **V1.5** | Weeks 17-24 | Drill mode, historical analytics, cell broadcast, third-party API |

---

## 7. Assumptions & Dependencies

### Assumptions
- Users have smartphones with a web browser and GPS capability (primary scenario)
- No app installation is required — navigation delivered via web links and Google Maps deep links
- Users grant temporary location permission via browser prompt (session-only, not persistent)
- Building floor plans are available or can be digitized
- Google Cloud services maintain published SLAs
- Cellular networks maintain basic SMS/voice capability during emergencies
- CCTV feeds can be accessed via IP streaming (for Vision AI features)

### Dependencies
- Google Maps Platform API availability and quotas
- Firebase Cloud Messaging delivery reliability
- Google Cloud Vision AI model accuracy for crowd estimation
- Telecom provider SMS gateway integration
- Building management cooperation for layout data and CCTV access

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Indoor GPS inaccuracy | High | Medium | WiFi triangulation + manual confirmation fallback |
| Internet outage during emergency | High | High | SMS/IVR fallback; cached maps; offline-first mobile architecture |
| User has no app installed | N/A | N/A | Not a risk — system requires no app installation. Navigation delivered via browser link and Google Maps deep link in push/SMS |
| Google Cloud service outage | Low | Critical | Multi-region deployment; edge caching; offline engine fallback |
| Privacy regulation conflict | Medium | Medium | Privacy-by-design; anonymized IDs; configurable data retention |
| False alarm fatigue | Medium | Medium | Multi-step activation; confirmation dialogs; drill mode separation |
