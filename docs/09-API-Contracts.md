# API Contracts — NETRA

## RESTful API Specification (Cloud Functions)

**Base URL**: `https://{region}-{project-id}.cloudfunctions.net/api/v1`

**Authentication**: Firebase Auth JWT Bearer Token (all endpoints except public health check)

**Content-Type**: `application/json`

---

## 1. Emergency Management APIs

### POST `/emergency/trigger`
Activate an emergency evacuation protocol.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "buildingId": "bldg_abc123",
  "type": "FIRE",
  "severity": "HIGH",
  "affectedFloors": ["floor_1", "floor_2"],
  "message": "Fire detected on Level 2. Evacuate immediately."
}
```

**Response (201):**
```json
{
  "emergencyId": "emg_xyz789",
  "status": "ACTIVE",
  "buildingId": "bldg_abc123",
  "triggeredAt": "2026-03-31T16:30:00Z",
  "triggeredBy": "admin_user_001",
  "notificationsSent": 342,
  "exitsActivated": 5
}
```

**Errors:**
| Code | Description |
|---|---|
| 400 | Invalid building ID or missing required fields |
| 401 | Unauthorized — invalid or missing token |
| 403 | Forbidden — insufficient role |
| 409 | Emergency already active for this building |

---

### POST `/emergency/{emergencyId}/resolve`
End an active emergency.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "resolution": "RESOLVED",
  "notes": "Fire contained. Building cleared."
}
```

**Response (200):**
```json
{
  "emergencyId": "emg_xyz789",
  "status": "RESOLVED",
  "resolvedAt": "2026-03-31T17:15:00Z",
  "resolvedBy": "admin_user_001",
  "totalEvacuated": 338,
  "avgEvacuationTimeSeconds": 185
}
```

---

### GET `/emergency/{emergencyId}`
Get current emergency status and stats.

**Authorization**: `ADMIN`, `OPERATOR`, `VIEWER`

**Response (200):**
```json
{
  "emergencyId": "emg_xyz789",
  "buildingId": "bldg_abc123",
  "status": "ACTIVE",
  "type": "FIRE",
  "severity": "HIGH",
  "triggeredAt": "2026-03-31T16:30:00Z",
  "totalDetectedUsers": 342,
  "totalEvacuated": 156,
  "percentComplete": 45.6,
  "estimatedCompletionSeconds": 180,
  "hazardZones": [...],
  "blockedExits": ["exit_b"],
  "exitUtilization": {
    "exit_a": { "assigned": 120, "evacuated": 68, "density": 0.72 },
    "exit_c": { "assigned": 110, "evacuated": 52, "density": 0.58 },
    "exit_d": { "assigned": 112, "evacuated": 36, "density": 0.45 }
  }
}
```

---

### PUT `/emergency/{emergencyId}/hazard-zones`
Add or update hazard zones during an active emergency.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "hazardZones": [
    {
      "floorId": "floor_2",
      "polygon": [
        { "x": 120, "y": 80 },
        { "x": 200, "y": 80 },
        { "x": 200, "y": 160 },
        { "x": 120, "y": 160 }
      ],
      "type": "FIRE"
    }
  ]
}
```

**Response (200):**
```json
{
  "emergencyId": "emg_xyz789",
  "hazardZonesUpdated": 1,
  "usersRerouted": 23,
  "updatedAt": "2026-03-31T16:45:00Z"
}
```

---

### PUT `/emergency/{emergencyId}/block-exit`
Mark an exit as blocked during emergency.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "exitId": "exit_b",
  "reason": "Structural damage — exit unsafe"
}
```

**Response (200):**
```json
{
  "exitId": "exit_b",
  "status": "BLOCKED",
  "usersRerouted": 45,
  "updatedAt": "2026-03-31T16:40:00Z"
}
```

---

## 2. Location APIs

### POST `/location/report`
Report user's current location during an emergency.

**Authorization**: Anonymous Auth (Firebase Anonymous)

**Request:**
```json
{
  "emergencyId": "emg_xyz789",
  "lat": 28.6139,
  "lng": 77.2090,
  "floor": 2,
  "accuracy": 8.5,
  "deviceType": "SMARTPHONE_ONLINE",
  "accessibilityNeeds": "NONE"
}
```

**Response (200):**
```json
{
  "userId": "anon_a1b2c3",
  "locationReceived": true,
  "assignment": {
    "exitId": "exit_c",
    "exitName": "Exit C — North Wing",
    "route": [
      { "x": 150, "y": 200, "floor": 2 },
      { "x": 150, "y": 150, "floor": 2 },
      { "x": 100, "y": 150, "floor": 2 },
      { "x": 100, "y": 50, "floor": 2 }
    ],
    "estimatedTimeSeconds": 95,
    "distanceMeters": 120
  }
}
```

---

### POST `/location/batch`
Bulk location update (for CCTV-estimated positions).

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "emergencyId": "emg_xyz789",
  "source": "CCTV",
  "locations": [
    { "estimatedLat": 28.6140, "estimatedLng": 77.2091, "floor": 1, "estimatedCount": 15 },
    { "estimatedLat": 28.6138, "estimatedLng": 77.2089, "floor": 1, "estimatedCount": 8 }
  ]
}
```

**Response (200):**
```json
{
  "locationsProcessed": 2,
  "totalEstimatedUsers": 23,
  "routingUpdated": true
}
```

---

## 3. Routing APIs

### GET `/route/optimal`
Get optimal route for a specific user.

**Authorization**: Anonymous Auth

**Query Params**: `emergencyId`, `userId`

**Response (200):**
```json
{
  "userId": "anon_a1b2c3",
  "emergencyId": "emg_xyz789",
  "assignment": {
    "exitId": "exit_c",
    "exitName": "Exit C — North Wing",
    "route": [
      { "x": 150, "y": 200, "floor": 2, "instruction": "Move straight" },
      { "x": 150, "y": 150, "floor": 2, "instruction": "Turn left" },
      { "x": 100, "y": 50, "floor": 2, "instruction": "Exit ahead" }
    ],
    "estimatedTimeSeconds": 95,
    "distanceMeters": 120,
    "version": 1
  },
  "voiceInstructions": [
    "Move straight for 50 meters",
    "Turn left toward Exit C",
    "Exit is 70 meters ahead"
  ]
}
```

---

### POST `/route/recalculate`
Trigger crowd rebalancing for an emergency.

**Authorization**: `ADMIN`, `OPERATOR` (also triggered automatically)

**Request:**
```json
{
  "emergencyId": "emg_xyz789",
  "reason": "EXIT_CONGESTED",
  "triggerExitId": "exit_a"
}
```

**Response (200):**
```json
{
  "recalculationId": "recalc_001",
  "usersRerouted": 34,
  "previousDistribution": { "exit_a": 150, "exit_c": 100, "exit_d": 92 },
  "newDistribution": { "exit_a": 115, "exit_c": 120, "exit_d": 107 },
  "calculationTimeMs": 1250
}
```

---

## 4. Building Management APIs

### POST `/building`
Create a new building configuration.

**Authorization**: `ADMIN`

**Request:**
```json
{
  "name": "City Centre Mall",
  "address": "123 Main Street, New Delhi",
  "city": "New Delhi",
  "country": "India",
  "type": "MALL",
  "totalCapacity": 5000,
  "geoLocation": { "lat": 28.6139, "lng": 77.2090 },
  "geofenceRadius": 500
}
```

**Response (201):**
```json
{
  "buildingId": "bldg_abc123",
  "name": "City Centre Mall",
  "createdAt": "2026-03-31T10:00:00Z"
}
```

---

### GET `/building/{buildingId}`
Get building details with floors and exits.

### PUT `/building/{buildingId}`
Update building configuration.

### POST `/building/{buildingId}/floor`
Add a floor with plan image and graph data.

### PUT `/building/{buildingId}/floor/{floorId}`
Update floor plan or graph data.

### POST `/building/{buildingId}/exit`
Add an exit to a building.

### PUT `/building/{buildingId}/exit/{exitId}`
Update exit configuration.

---

## 5. Notification APIs

### POST `/notification/broadcast`
Send broadcast message to all users in emergency area.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "emergencyId": "emg_xyz789",
  "message": "Avoid Level 2 East Wing. Use Exit C or Exit D.",
  "channels": ["PUSH", "SMS"],
  "priority": "HIGH"
}
```

**Response (200):**
```json
{
  "broadcastId": "bcast_001",
  "channelResults": {
    "PUSH": { "sent": 280, "delivered": 265, "failed": 15 },
    "SMS": { "sent": 62, "queued": 62 }
  },
  "sentAt": "2026-03-31T16:50:00Z"
}
```

---

## 6. Crowd Analysis APIs

### POST `/crowd/analyze-frame`
Submit CCTV frame for crowd density analysis.

**Authorization**: `ADMIN`, `OPERATOR`

**Request:**
```json
{
  "emergencyId": "emg_xyz789",
  "cameraId": "cam_floor1_north",
  "imageBase64": "<base64 encoded image>",
  "floorId": "floor_1",
  "cameraCoverage": {
    "topLeft": { "x": 0, "y": 0 },
    "bottomRight": { "x": 200, "y": 150 }
  }
}
```

**Response (200):**
```json
{
  "cameraId": "cam_floor1_north",
  "estimatedPeopleCount": 35,
  "densityLevel": "HIGH",
  "densityScore": 0.78,
  "motionDirection": "SOUTH",
  "congestionDetected": true,
  "analyzedAt": "2026-03-31T16:55:00Z"
}
```

---

## 7. Dashboard APIs

### GET `/dashboard/evacuation-progress/{emergencyId}`
**Response (200):**
```json
{
  "totalUsers": 342,
  "evacuatedUsers": 220,
  "percentComplete": 64.3,
  "estimatedCompletionSeconds": 135,
  "usersNeedingAssistance": 3,
  "perExit": {
    "exit_a": { "assigned": 115, "evacuated": 78, "density": 0.65 },
    "exit_c": { "assigned": 120, "evacuated": 82, "density": 0.55 },
    "exit_d": { "assigned": 107, "evacuated": 60, "density": 0.48 }
  }
}
```

### GET `/dashboard/system-health`
**Response (200):**
```json
{
  "status": "HEALTHY",
  "services": {
    "firestore": "UP",
    "realtimeDb": "UP",
    "cloudFunctions": "UP",
    "fcm": "UP",
    "mapsApi": "UP",
    "visionAi": "UP",
    "ttsApi": "UP"
  },
  "activeEmergencies": 1,
  "connectedUsers": 342,
  "lastHealthCheck": "2026-03-31T16:58:00Z"
}
```

---

## 8. Common Response Patterns

### Error Response Format
```json
{
  "error": {
    "code": 400,
    "status": "BAD_REQUEST",
    "message": "Building ID is required",
    "details": [
      { "field": "buildingId", "reason": "REQUIRED" }
    ],
    "requestId": "req_abc123"
  }
}
```

### Pagination (for list endpoints)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 45,
    "totalPages": 3,
    "nextPageToken": "token_xyz"
  }
}
```

### Rate Limits
| Endpoint Category | Limit |
|---|---|
| Emergency trigger | 10 req/min per admin |
| Location report | 60 req/min per user |
| Route queries | 120 req/min per user |
| Dashboard queries | 300 req/min per admin |
| Crowd analysis | 30 req/min per camera |
| Notification broadcast | 10 req/min per admin |
