import { Coordinates } from '../services/mapsService';

export interface Exit {
  id: string;
  name: string;
  location: Coordinates;
  capacity: number;
}

export interface UserLocation {
  userId: string;
  location: Coordinates;
}

export interface Assignment {
  userId: string;
  exitId: string;
  distance: number;
}

/**
 * Calculates straight-line distance using Haversine formula (in meters)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const lat1 = coord1.lat * rad;
  const lat2 = coord2.lat * rad;
  const deltaLat = (coord2.lat - coord1.lat) * rad;
  const deltaLng = (coord2.lng - coord1.lng) * rad;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * MVP: Distance-based exit selection
 * Assigns a user to the nearest exit.
 */
export function assignExit(userLocation: UserLocation, exits: Exit[]): Assignment | null {
  if (!exits || exits.length === 0) return null;

  let nearestExit = exits[0];
  let minDistance = calculateDistance(userLocation.location, nearestExit.location);

  for (let i = 1; i < exits.length; i++) {
    const dist = calculateDistance(userLocation.location, exits[i].location);
    if (dist < minDistance) {
      minDistance = dist;
      nearestExit = exits[i];
    }
  }

  return {
    userId: userLocation.userId,
    exitId: nearestExit.id,
    distance: minDistance
  };
}
