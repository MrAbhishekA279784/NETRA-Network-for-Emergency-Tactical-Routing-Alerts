# Problem Statement — NETRA

## AI-Powered Intelligent Emergency Evacuation, Crowd Balancing, and Crisis Response Platform

---

## Executive Summary

During mass emergency events — terrorist attacks, fires, explosions, stampedes, natural disasters, and infrastructure failures — the single greatest cause of preventable casualties is **chaotic, unguided evacuation**. People panic, converge on familiar exits, create fatal bottlenecks, and lose precious minutes that determine survival.

**NETRA** is an AI-powered emergency response platform that replaces passive alarm systems with **intelligent, real-time evacuation guidance** — dynamically routing individuals to the safest exits, balancing crowd distribution, and maintaining communication even when infrastructure fails.

---

## The Problem

### Current State of Emergency Evacuation

Traditional emergency systems are fundamentally **reactive and static**:

| Limitation | Impact |
|---|---|
| Alarms only signal danger — they provide no guidance | People make uninformed decisions under extreme stress |
| Fixed evacuation signs point to static routes | Routes may be blocked, hazardous, or overcrowded |
| No real-time crowd visibility | Authorities cannot see where congestion is forming |
| No dynamic rerouting capability | Once a route is overcrowded, there is no correction mechanism |
| Communication depends on internet | Systems fail precisely when they're needed most |
| Accessibility is an afterthought | Disabled individuals are left behind or face impassable routes |
| No crowd distribution intelligence | 80% of evacuees converge on 20% of exits |

### Root Cause Analysis

```
EMERGENCY EVENT
    │
    ├── People panic → reduced decision-making capacity
    │
    ├── Everyone moves toward familiar exits → crowd convergence
    │
    ├── Single exit overloaded → bottleneck formation
    │
    ├── Bottleneck → stampede risk → injuries/fatalities
    │
    ├── No real-time information → authorities blind
    │
    ├── No dynamic rerouting → static bad decisions persist
    │
    ├── Internet goes down → digital systems fail
    │
    └── Disabled individuals → no accessible route guidance
```

### Quantified Impact

- **Stampede fatalities globally**: 2,000+ deaths per year (WHO estimates)
- **Average evacuation delay** due to congestion: 3-7x longer than optimal
- **Exit utilization imbalance**: Typically 1-2 exits carry 70-80% of traffic while others remain underutilized
- **Communication failure rate** during crises: 40-60% of cellular infrastructure degraded
- **Accessibility compliance gaps**: 85% of buildings lack dynamic accessible evacuation routing

### Key Challenges

1. **No Intelligent Exit Distribution** — People gravitate toward the entrance they used to enter, regardless of distance, congestion, or safety
2. **Crowd Congestion Cascading** — Once a bottleneck forms, it attracts more people, creating a self-reinforcing death trap
3. **Panic-Induced Decision Paralysis** — Under extreme stress, individuals freeze or follow the crowd blindly
4. **Internet Dependency** — Modern notification systems require connectivity that fails during crises
5. **Indoor Positioning Gaps** — GPS is unreliable indoors; alternative positioning is fragmented
6. **Accessibility Neglect** — Wheelchair users, visually impaired, and hearing-impaired individuals lack dedicated evacuation support
7. **Authority Blindness** — Emergency responders lack real-time crowd distribution data
8. **Static Evacuation Plans** — Pre-printed plans cannot adapt to dynamic hazard conditions
9. **Fragmented Communication** — No unified system bridges smartphones, feature phones, offline users, and PA systems
10. **Scale Limitations** — Current solutions don't scale from a single building to city-wide events

---

## The Opportunity

### What Must Change

A modern emergency evacuation system must be:

| Capability | Description |
|---|---|
| **Intelligent** | AI-driven route optimization that balances crowd density across all available exits |
| **Adaptive** | Dynamic rerouting when exits become blocked, overcrowded, or hazardous |
| **Resilient** | Functions without internet — SMS, IVR, cached maps, cell broadcast |
| **Accessible** | Dedicated support for mobility and sensory impairments |
| **Observable** | Real-time authority dashboard with crowd density heatmaps and exit utilization |
| **Scalable** | Works for a 100-person office and a 100,000-person stadium |
| **Fast** | Sub-second route calculation; guidance within 5 seconds of emergency trigger |

### Target Environments

**Indoor:**
- Shopping malls, hotels, corporate offices, airports, hospitals, universities, metro stations

**Outdoor:**
- Stadiums, parks, national parks, tourist areas, government campuses, large public gatherings

### Target Users

| User Type | Role |
|---|---|
| General public | Receive evacuation guidance during emergencies |
| Government authorities | Trigger emergencies, monitor evacuation, coordinate response |
| Emergency responders | Real-time situational awareness, crowd data |
| Building administrators | Configure layouts, exits, capacity thresholds |
| Event organizers | Manage large-scale temporary evacuation plans |
| Security personnel | Monitor threats, trigger localized alerts |

---

## Solution Vision

**NETRA** transforms emergency evacuation from a **passive alarm** into an **active, intelligent guidance system**:

1. **Authority triggers emergency** via secure dashboard
2. **System detects and locates** all individuals in the affected area
3. **AI engine calculates** optimal exit assignment for every person
4. **Multi-channel communication** delivers personalized guidance (push notification, SMS, voice call, vibration)
5. **Crowd balancing engine** continuously monitors and redistributes as conditions change
6. **CCTV analysis** supplements device data with visual crowd density estimation
7. **Authority dashboard** provides real-time heatmaps, exit utilization, and evacuation progress
8. **Accessibility module** ensures disabled individuals receive appropriate routing and assistance alerts

### Success Criteria

- **50% reduction** in average evacuation time compared to unguided scenarios
- **≥90% exit utilization balance** (no single exit exceeds 150% of fair-share load)
- **<5 second** time-to-first-guidance after emergency trigger
- **100% coverage** across connectivity scenarios (online, weak connectivity, offline)
- **WCAG-aligned** accessibility in all user-facing interfaces
- **99.9% system availability** during emergency events

---

## Why Now

1. **Smartphone penetration** exceeds 85% in target markets — real-time user location is feasible
2. **Cloud AI services** (Vision AI, TTS, ML routing) are production-ready and cost-effective
3. **Firebase real-time infrastructure** enables sub-second data synchronization
4. **Smart city initiatives** are creating demand for integrated emergency management systems
5. **Regulatory pressure** is increasing for dynamic evacuation planning (post-COVID, post-major incidents)
6. **Edge computing** enables local processing for offline scenarios

---

## Constraints & Boundaries

- **Google-first technology stack** — Firebase, GCP, Google Maps, Vision AI, TTS
- **Privacy-by-design** — No unnecessary PII storage; anonymized tracking; minimal retention
- **MVP-first approach** — Core evacuation logic demonstrated before advanced modules
- **No hardware dependency for MVP** — System operates with existing smartphones and cloud infrastructure
- **Offline-capable** — Core guidance must function without internet connectivity
