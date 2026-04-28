# Failure Scenarios — NETRA

---

## 1. Infrastructure Failures

### F1: Internet Connectivity Loss During Emergency

| Attribute | Detail |
|---|---|
| **Probability** | HIGH |
| **Impact** | CRITICAL |
| **Scenario** | Cellular/WiFi infrastructure fails during crisis — users lose internet |
| **Detection** | Mobile PWA `navigator.onLine` listener; heartbeat failure |
| **Mitigation** | Offline fallback chain activates automatically |
| **Recovery** | Auto-reconnect when connectivity restored; sync queued data |

**Fallback Chain:**
1. Push notification fails → System sends SMS with directions
2. SMS fails → System initiates IVR voice call
3. All digital fails → User sees cached floor plan + last known directions
4. App not installed → PA system / physical signage (building-level)

---

### F2: Firebase Realtime Database Overload

| Attribute | Detail |
|---|---|
| **Probability** | LOW-MEDIUM |
| **Impact** | HIGH |
| **Scenario** | Thousands of simultaneous location updates exceed RTDB connection limits |
| **Detection** | RTDB connection count monitoring alert at 80% of quota |
| **Mitigation** | Throttle location updates to every 10s (from 5s); batch writes |
| **Recovery** | Scale with RTDB sharding; region-based distribution |

**Prevention:**
- Location updates batched: collect 5 seconds of data, send single write
- RTDB sharded by building/zone for large deployments
- Cloud Functions use admin SDK (doesn't count against connection limit)

---

### F3: Cloud Functions Cold Start During Emergency

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | MEDIUM |
| **Scenario** | First emergency trigger hits cold function — slow response |
| **Detection** | Function invocation latency exceeds 5-second threshold |
| **Mitigation** | `minInstances: 1` for critical functions (emergency, routing) |
| **Recovery** | Automatic — subsequent calls hit warm instances |

**Prevention:** Keep critical functions warm:
```typescript
export const triggerEmergency = onRequest({
  minInstances: 1,  // Always warm
  memory: "512MiB",
  timeoutSeconds: 30,
});
```

---

### F4: Google Maps API Quota Exhaustion

| Attribute | Detail |
|---|---|
| **Probability** | LOW |
| **Impact** | MEDIUM |
| **Scenario** | Maps API requests exceed daily quota during large-scale event |
| **Detection** | API returns 429 status; Cloud Monitoring alert |
| **Mitigation** | Cache map tiles and geocoding results; use pre-computed building graphs |
| **Recovery** | Request quota increase from Google Cloud; use cached data |

**Prevention:**
- Building route graphs pre-computed and stored in Firestore (no runtime Maps API calls for indoor routing)
- Maps API used only for outdoor geolocation verification
- Session-based billing for Maps JavaScript API

---

### F5: Firestore Write Contention

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | MEDIUM |
| **Scenario** | Multiple Cloud Functions update same Firestore document simultaneously (e.g., emergency log) |
| **Detection** | Firestore returns ABORTED/UNAVAILABLE errors; retry count spikes |
| **Mitigation** | Use distributed counters for evacuation progress; batch subcollection writes |
| **Recovery** | Exponential backoff retry; transaction conflict resolution |

**Prevention:**
- Evacuation counts use sharded counters (10 shards per building)
- Per-user assignments in subcollections (no document contention)
- Realtime Database used for hot-path data (better for frequent small writes)

---

## 2. Application Failures

### F6: Route Calculation Timeout

| Attribute | Detail |
|---|---|
| **Probability** | LOW |
| **Impact** | HIGH |
| **Scenario** | Complex building graph with 5,000+ users causes route calculation to exceed timeout |
| **Detection** | Cloud Function timeout (60s); error logged |
| **Mitigation** | Batch users into chunks of 500; parallel calculation per zone/floor |
| **Recovery** | Assign users to nearest exit (simplified fallback); retry with smaller batch |

**Prevention:**
- Graph optimization: merge unnecessary nodes, simplify long corridors
- Zone-based calculation: divide building into sectors, calculate independently
- Pre-compute distance matrix during building setup

---

### F7: Push Notification Delivery Failure

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | HIGH |
| **Scenario** | FCM fails to deliver to some users (invalid tokens, network issues) |
| **Detection** | FCM response includes failure count; delivery receipt monitoring |
| **Mitigation** | Failed push → auto-trigger SMS fallback within 10 seconds |
| **Recovery** | Retry FCM once; escalate to SMS/IVR for persistent failures |

**Cascade Logic:**
```
Push sent → Wait 10s → Check delivery receipt
  → If delivered: Done
  → If failed: Send SMS
    → Wait 30s → Check SMS delivery
      → If delivered: Done
      → If failed: Initiate IVR call
```

---

### F8: GPS/Location Accuracy Failure

| Attribute | Detail |
|---|---|
| **Probability** | HIGH (indoor) |
| **Impact** | MEDIUM |
| **Scenario** | Indoor GPS accuracy is poor (50-100m error); user assigned to wrong exit |
| **Detection** | Location accuracy field > 30m; position inconsistent with building bounds |
| **Mitigation** | WiFi positioning fallback; manual location confirmation UI; floor-level routing |
| **Recovery** | User taps approximate location on floor plan; system assigns based on floor/zone |

**Prevention:**
- Accept low-accuracy positions for floor/zone-level routing
- Design routing algorithm to be tolerant of 25m position error
- Provide "I'm on Floor X" quick selector as backup

---

### F9: Incorrect Building Graph Data

| Attribute | Detail |
|---|---|
| **Probability** | LOW-MEDIUM |
| **Impact** | HIGH |
| **Scenario** | Building admin misconfigures route graph — impossible routes or missing connections |
| **Detection** | Graph validation during save (connectivity check) |
| **Mitigation** | Validation rules: all areas must connect to ≥1 exit; no orphan nodes |
| **Recovery** | Dashboard highlights validation errors; blocks save until resolved |

**Validation Checks:**
- All non-exit nodes reachable from at least one exit (bidirectional)
- All exits have at least one connecting edge
- No negative or zero edge distances
- Capacity values are positive integers
- Accessible flag consistency (accessible node not connected only by non-accessible edges)

---

### F10: Simultaneous Emergency Conflicts

| Attribute | Detail |
|---|---|
| **Probability** | LOW |
| **Impact** | MEDIUM |
| **Scenario** | Two operators trigger conflicting emergencies for same building |
| **Detection** | API returns 409 Conflict for duplicate active emergency |
| **Mitigation** | Only one active emergency per building; must resolve before creating new one |
| **Recovery** | Display active emergency to operator; offer to modify existing one |

---

## 3. Security Failures

### F11: Unauthorized Emergency Trigger

| Attribute | Detail |
|---|---|
| **Probability** | LOW |
| **Impact** | CRITICAL |
| **Scenario** | Attacker gains access to operator account and triggers false emergency |
| **Detection** | Audit log; MFA challenge on trigger; unusual IP/time patterns |
| **Mitigation** | MFA required for all admin accounts; confirmation dialog with reason |
| **Recovery** | Immediate emergency deactivation; incident investigation; credential rotation |

**Prevention:**
- MFA enforced on all operator accounts
- Emergency trigger requires 2-step confirmation
- Audit log captures IP, device, timestamp for every trigger
- Optional: require 2-person authorization for trigger (configurable)

---

### F12: Data Breach of Location Data

| Attribute | Detail |
|---|---|
| **Probability** | LOW |
| **Impact** | HIGH |
| **Scenario** | Location data exposed through misconfigured security rules or API vulnerability |
| **Detection** | Cloud Audit Logs; unusual data access patterns |
| **Mitigation** | Anonymized user IDs; auto-expiring location data (24h TTL); encryption at rest |
| **Recovery** | Revoke access; rotate keys; notify affected parties per regulations |

**Prevention:**
- Location data uses anonymous IDs (no PII linkage)
- RTDB security rules restrict read access
- Location data auto-deleted 24 hours post-emergency
- All data encrypted in transit (TLS) and at rest (Google-managed encryption)

---

## 4. User Experience Failures

### F13: User Panic — App Confusion

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | MEDIUM |
| **Scenario** | User can't understand navigation interface due to extreme stress |
| **Detection** | User stationary for >30 seconds with active navigation |
| **Mitigation** | Auto-trigger voice guidance; simplify UI to single arrow; increase font size |
| **Recovery** | Repeat voice instructions; offer "Call for help" button |

**Prevention:**
- UI tested specifically for high-stress comprehension
- Maximum 2 visual elements on screen during navigation
- Voice guidance auto-starts (user doesn't need to find controls)
- 3x larger than standard touch targets

---

### F14: Excessive Rerouting Confusion

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | MEDIUM |
| **Scenario** | User gets rerouted repeatedly, loses trust in the system |
| **Detection** | User reroute count ≥2 |
| **Mitigation** | Hard limit: 2 reroutes per user per emergency; 20% improvement threshold |
| **Recovery** | After 2 reroutes, lock assignment (no further changes) |

---

### F15: Voice Guidance Audio Failure

| Attribute | Detail |
|---|---|
| **Probability** | MEDIUM |
| **Impact** | MEDIUM |
| **Scenario** | TTS API fails, audio doesn't play, or environment too noisy |
| **Detection** | TTS API error response; Web Audio API playback state check |
| **Mitigation** | Pre-cache common instructions; visual-primary design (voice is supplementary) |
| **Recovery** | Display text-based instructions; increase visual arrow size |

---

## 5. Failure Response Matrix

| Severity | Response Time | Escalation |
|---|---|---|
| **CRITICAL** (system down during emergency) | Immediate (auto-failover) | All engineers + management |
| **HIGH** (degraded service during emergency) | <5 minutes | On-call engineer + lead |
| **MEDIUM** (feature failure, workaround available) | <30 minutes | On-call engineer |
| **LOW** (non-emergency feature issue) | Next business day | Ticket queue |

### Incident Response Procedure
```
1. DETECT → Automated alert triggers (Cloud Monitoring)
2. TRIAGE → On-call classifies severity
3. MITIGATE → Apply immediate workaround (e.g., force offline fallback)
4. RESOLVE → Fix root cause and deploy
5. REVIEW → Post-incident review within 48 hours
6. PREVENT → Update monitoring, tests, or architecture to prevent recurrence
```
