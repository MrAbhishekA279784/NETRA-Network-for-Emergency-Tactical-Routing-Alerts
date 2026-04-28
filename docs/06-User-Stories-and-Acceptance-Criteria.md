# User Stories & Acceptance Criteria — NETRA

---

## Epic 1: Emergency Activation

### US-1.1: Trigger Emergency Alert
**As** an authority operator, **I want to** trigger an emergency evacuation protocol from the dashboard, **so that** all people in the affected area receive immediate guidance.

**Acceptance Criteria:**
- [ ] Dashboard displays prominent "TRIGGER EMERGENCY" button
- [ ] Operator selects building/zone before triggering
- [ ] Confirmation dialog prevents accidental activation
- [ ] Emergency activates within 5 seconds of confirmation
- [ ] System status changes to "EMERGENCY ACTIVE"
- [ ] Audit log records operator ID, timestamp, and building

### US-1.2: Deactivate Emergency
**As** an authority operator, **I want to** deactivate an emergency when the situation is resolved, **so that** normal operations resume.

**Acceptance Criteria:**
- [ ] "END EMERGENCY" button visible during active emergency
- [ ] Deactivation requires confirmation
- [ ] All evacuee notifications receive "All Clear" message
- [ ] Dashboard returns to monitoring mode
- [ ] Emergency log is finalized with end timestamp

### US-1.3: Define Hazard Zones
**As** an authority operator, **I want to** mark specific areas as hazardous during an emergency, **so that** the routing engine avoids those zones.

**Acceptance Criteria:**
- [ ] Operator can draw/select hazard zones on building map
- [ ] Hazard zones immediately update routing calculations
- [ ] Affected users receive rerouting notifications
- [ ] Hazard zones are visually highlighted on dashboard

---

## Epic 2: User Location & Detection

### US-2.1: Automatic Location Detection
**As** a user who opened the emergency navigation link in my browser, **I want** my location to be automatically detected via browser geolocation, **so that** I receive personalized evacuation guidance without manual input.

**Acceptance Criteria:**
- [ ] Browser prompts for one-time location permission when page opens
- [ ] GPS location captured with <10m accuracy outdoor
- [ ] WiFi positioning used as indoor fallback
- [ ] Location updates sent every 5 seconds while page is open during emergency
- [ ] Last known location used if current signal unavailable
- [ ] No background tracking — location stops when browser tab closes
- [ ] No app installation required — works in any mobile browser
- [ ] Anonymous session ID used (no PII collected)

### US-2.2: Manual Location Confirmation
**As** a user whose location cannot be automatically detected, **I want to** manually confirm my location on a floor plan, **so that** I can still receive evacuation guidance.

**Acceptance Criteria:**
- [ ] Floor plan displayed with tap-to-select location
- [ ] Selected location sent to routing engine
- [ ] Navigation guidance provided based on manual location
- [ ] Option to re-select if initial selection was wrong

---

## Epic 3: Intelligent Evacuation Routing

### US-3.1: Receive Optimal Exit Assignment
**As** an evacuee, **I want to** be assigned the safest and most efficient exit, **so that** I can evacuate quickly without encountering congestion.

**Acceptance Criteria:**
- [ ] Exit assignment considers distance, density, capacity, and safety
- [ ] Assignment received within 10 seconds of emergency trigger
- [ ] Assigned exit displayed with clear directional guidance
- [ ] Route avoids known hazard zones

### US-3.2: Dynamic Rerouting
**As** an evacuee, **I want to** be rerouted if my assigned exit becomes blocked or overcrowded, **so that** I always have a viable path to safety.

**Acceptance Criteria:**
- [ ] Rerouting triggered when exit exceeds capacity threshold
- [ ] New route is >20% better than current congested route
- [ ] User notified of reroute with clear visual + audio alert
- [ ] Maximum 2 reroutes per user to prevent confusion
- [ ] Users within 30m of exit are NOT rerouted

### US-3.3: Accessible Route Assignment
**As** a wheelchair user, **I want to** receive a route that avoids stairs and uses accessible pathways, **so that** I can evacuate safely.

**Acceptance Criteria:**
- [ ] User accessibility profile stored in app settings
- [ ] Routing engine excludes non-accessible edges for flagged users
- [ ] Accessible exits prioritized in assignment
- [ ] Estimated time accounts for slower movement speed
- [ ] Assistance alert sent to authorities for user's location

---

## Epic 4: Web Navigation & Google Maps Deep Linking

### US-4.1: View Evacuation Directions in Browser
**As** an evacuee, **I want to** see clear directional guidance in my mobile browser (no app install), **so that** I know exactly where to go during the emergency.

**Acceptance Criteria:**
- [ ] Navigation page opens in any mobile browser via link from push/SMS
- [ ] No app installation, login, or signup required
- [ ] Large directional arrow showing movement direction
- [ ] Distance to exit displayed prominently
- [ ] Exit name/identifier visible
- [ ] High contrast emergency color scheme
- [ ] Interface renders in <3 seconds
- [ ] Works in portrait and landscape orientation

### US-4.2: Navigate via Google Maps Deep Link
**As** an evacuee, **I want to** tap a link that opens Google Maps with walking directions to my assigned exit, **so that** I can use familiar map navigation without learning a new interface.

**Acceptance Criteria:**
- [ ] Push notification and SMS both contain Google Maps deep link
- [ ] Google Maps link opens native Maps app or web Google Maps
- [ ] Destination is the assigned exit's GPS coordinates
- [ ] Travel mode set to walking
- [ ] Link works without NETRA web page (standalone fallback)
- [ ] Updated Google Maps link sent on reroute

### US-4.2: Hear Voice Guidance
**As** an evacuee, **I want to** hear spoken navigation instructions, **so that** I can follow directions without looking at my phone.

**Acceptance Criteria:**
- [ ] Voice prompts play automatically during navigation
- [ ] Instructions include direction + distance ("Turn right, 15 meters")
- [ ] Rerouting announced with priority voice alert
- [ ] Audio pauses between prompts (not continuous)
- [ ] Volume is loud enough for noisy environments

### US-4.3: Receive Reroute Notification
**As** an evacuee, **I want to** be clearly notified when my route changes, **so that** I follow the updated path.

**Acceptance Criteria:**
- [ ] Visual banner: "ROUTE UPDATED — Follow new direction"
- [ ] Haptic vibration (2-second pattern)
- [ ] Voice announcement: "Route changed. Follow updated directions."
- [ ] New directional arrow replaces previous
- [ ] Previous route visually dismissed

---

## Epic 5: Authority Dashboard

### US-5.1: View Building Layout with Crowd Heatmap
**As** an authority operator, **I want to** see a building map overlaid with crowd density data, **so that** I know where people are concentrated.

**Acceptance Criteria:**
- [ ] Building floor plan displayed with accurate scaling
- [ ] Color-coded heatmap overlay (green → yellow → red)
- [ ] Heatmap updates every 2-5 seconds
- [ ] Floor selector for multi-story buildings
- [ ] Exit locations marked with utilization indicators

### US-5.2: Monitor Exit Utilization
**As** an authority operator, **I want to** see how many people are assigned to each exit, **so that** I can identify potential congestion points.

**Acceptance Criteria:**
- [ ] Each exit shows assigned count vs. capacity
- [ ] Progress bar visual (green/yellow/red based on load)
- [ ] Alert triggered when any exit exceeds 80% capacity
- [ ] Historical trend during current emergency

### US-5.3: Broadcast Emergency Message
**As** an authority operator, **I want to** send a broadcast message to all evacuees, **so that** I can communicate critical instructions.

**Acceptance Criteria:**
- [ ] Text input for custom message
- [ ] Multi-channel delivery (push + SMS)
- [ ] Delivery confirmation count displayed
- [ ] Message appears as banner on evacuee devices
- [ ] Audit log records message content and timestamp

### US-5.4: View Evacuation Progress
**As** an authority operator, **I want to** track overall evacuation progress, **so that** I know when the building is clear.

**Acceptance Criteria:**
- [ ] Progress bar: "X of Y people evacuated"
- [ ] Per-exit completion counts
- [ ] Estimated time to complete evacuation
- [ ] "Building Clear" indicator when 100% evacuated
- [ ] Log of users requiring assistance highlighted

---

## Epic 6: Multi-Channel Communication

### US-6.1: Push Notification with Google Maps Link
**As** a smartphone user with internet, **I want to** receive a push notification containing a Google Maps deep link to my assigned exit, **so that** I can immediately navigate to safety.

**Acceptance Criteria:**
- [ ] Notification delivered within 5 seconds
- [ ] Notification contains two links: Google Maps deep link + web navigation page
- [ ] Tapping Google Maps link opens walking directions to assigned exit
- [ ] Tapping web nav link opens browser-based guidance page
- [ ] High-priority notification channel (bypasses DND)
- [ ] No app installation required to act on notification

### US-6.2: SMS Fallback with Google Maps Link
**As** a user with limited connectivity, **I want to** receive an SMS with a Google Maps link and text directions, **so that** I can navigate to safety without internet.

**Acceptance Criteria:**
- [ ] SMS sent when push notification fails or user has no push subscription
- [ ] SMS contains: Google Maps deep link to assigned exit
- [ ] SMS contains: exit name, direction, floor info as plain text
- [ ] SMS contains: link to web navigation page
- [ ] Delivery within 30 seconds

### US-6.3: IVR Voice Call Guidance
**As** a basic phone user, **I want to** receive an automated voice call with evacuation instructions, **so that** I can follow directions without a smartphone.

**Acceptance Criteria:**
- [ ] Automated call initiated within 60 seconds
- [ ] Step-by-step directional instructions in clear speech
- [ ] Repeat option available
- [ ] Call lasts until user confirms understanding or hangs up

---

## Epic 7: Building Configuration

### US-7.1: Upload Building Floor Plan
**As** a building administrator, **I want to** upload a floor plan image and define the building layout, **so that** the system can calculate evacuation routes.

**Acceptance Criteria:**
- [ ] Supports PNG, JPG, SVG upload
- [ ] Floor plan displayed with zoom and pan
- [ ] Multiple floors supported
- [ ] Scale/dimensions configurable

### US-7.2: Configure Exit Points
**As** a building administrator, **I want to** mark exit locations and set their capacity, **so that** the AI engine knows where people can evacuate.

**Acceptance Criteria:**
- [ ] Click-to-place exit markers on floor plan
- [ ] Each exit has name, capacity, and accessibility flag
- [ ] Exit types: door, stairwell, elevator
- [ ] Changes saved and reflected in routing within 30 seconds

### US-7.3: Define Route Graph
**As** a building administrator, **I want to** define walkable paths between locations and exits, **so that** the routing engine can calculate valid routes.

**Acceptance Criteria:**
- [ ] Node-and-edge graph editor on floor plan
- [ ] Edge properties: distance, width, accessibility
- [ ] Graph validation ensures all areas connect to at least one exit
- [ ] Visual preview of generated routes

---

## Epic 8: Accessibility Support

### US-8.1: Set Accessibility Preferences (Session-Based)
**As** a user with a disability, **I want to** indicate my accessibility needs on the web navigation page, **so that** I receive appropriate evacuation routes without needing an app or account.

**Acceptance Criteria:**
- [ ] Accessibility toggle visible on emergency landing page
- [ ] Options: wheelchair, visual impairment, hearing impairment, mobility limitation
- [ ] Preferences stored in browser sessionStorage (temporary, not persistent)
- [ ] Preferences applied immediately to route calculation
- [ ] No account, login, or app installation required

### US-8.2: Authority Assistance Alert
**As** an authority operator, **I want to** see which users need evacuation assistance, **so that** I can dispatch help to their location.

**Acceptance Criteria:**
- [ ] Dashboard highlights users with accessibility needs
- [ ] Location of each user shown on map
- [ ] Assistance request status: pending, dispatched, resolved
- [ ] Notification sent to nearest responder
