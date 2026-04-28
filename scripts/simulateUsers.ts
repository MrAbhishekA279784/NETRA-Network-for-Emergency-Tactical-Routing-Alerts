import * as admin from "firebase-admin";
import { recalculateRoutes } from "../functions/src/engine/routeOptimizer";
import { MapsService } from "../functions/src/services/mapsService";

/**
 * Initialize Firebase Admin (emulator)
 */
if (!admin.apps.length) {

  process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";

  admin.initializeApp({

    projectId: "defences-dev",

    databaseURL: "http://127.0.0.1:9000/?ns=defences-dev"

  });

}

const db = admin.database();

const EMERGENCY_ID = "sim_emergency_abc123";

/**
 * Exit type defined locally
 */
type Exit = {

  id: string;

  name: string;

  location: {

    lat: number;

    lng: number;

  };

  capacity: number;

};

/**
 * Simulated users
 */
type SimUser = {

  userId: string;

  location: {

    lat: number;

    lng: number;

  };

};

/**
 * Mock exits
 */
const MOCK_EXITS: Exit[] = [

  {

    id: "exit_north",

    name: "North Exit",

    location: {

      lat: 40.7128,

      lng: -74.0060

    },

    capacity: 10

  },

  {

    id: "exit_south",

    name: "South Exit",

    location: {

      lat: 40.7110,

      lng: -74.0050

    },

    capacity: 10

  },

  {

    id: "exit_east",

    name: "East Stairwell",

    location: {

      lat: 40.7120,

      lng: -74.0040

    },

    capacity: 5

  }

];

/**
 * generate users
 */
const users: SimUser[] = Array.from({ length: 20 }).map((_, i) => ({

  userId: `user_sim_${i}`,

  location: {

    lat: 40.7120 + (Math.random() - 0.5) * 0.005,

    lng: -74.0050 + (Math.random() - 0.5) * 0.005

  }

}));

/**
 * simulation loop
 */
async function tick() {

  console.log("running simulation tick...");

  /**
   * move users randomly
   */
  users.forEach(user => {

    user.location.lat += (Math.random() - 0.5) * 0.0001;

    user.location.lng += (Math.random() - 0.5) * 0.0001;

  });

  /**
   * run AI routing
   */
  const result = recalculateRoutes(users as any, MOCK_EXITS as any);

  const updates: Record<string, any> = {};

  result.assignments.forEach((assignment: any) => {

    const exitNode = MOCK_EXITS.find(e => e.id === assignment.exitId);

    if (!exitNode) return;

    const navLink = MapsService.getNavigationLink(exitNode.location);

    const userModel = users.find(u => u.userId === assignment.userId);

    updates[`locations/${EMERGENCY_ID}/${assignment.userId}`] = {

      lat: userModel?.location.lat,

      lng: userModel?.location.lng,

      timestamp: Date.now()

    };

    updates[`assignments/${EMERGENCY_ID}/${assignment.userId}`] = {

      exitId: assignment.exitId,

      exitName: exitNode.name,

      distanceMeters: Math.round(assignment.distance),

      googleMapsDeepLink: navLink,

      updatedAt: Date.now()

    };

  });

  /**
   * crowd density
   */
  const densities: Record<string, number> = {};

  result.assignments.forEach((a: any) => {

    densities[a.exitId] = (densities[a.exitId] || 0) + 1;

  });

  MOCK_EXITS.forEach(exit => {

    const count = densities[exit.id] || 0;

    updates[`exit_density/${EMERGENCY_ID}/${exit.id}`] = {

      assignedCount: count,

      capacity: exit.capacity,

      density: Math.min(1, count / exit.capacity),

      updatedAt: Date.now()

    };

  });

  /**
   * push to firebase
   */
  await db.ref().update(updates);

  console.log("routes updated");

}

/**
 * start simulation
 */
console.log("starting simulation...");

db.ref(`active_emergencies/${EMERGENCY_ID}`).set({

  status: "ACTIVE",

  severity: "HIGH",

  triggeredAt: Date.now()

})
.then(() => {

  tick();

  setInterval(tick, 3000);

})
.catch(console.error);