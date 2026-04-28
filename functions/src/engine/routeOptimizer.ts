import { Exit, UserLocation, Assignment, assignExit } from './exitAllocation';

export type { Exit, UserLocation, Assignment };
import { balanceCrowd } from './crowdBalancing';

export interface RouteRecalculationResult {
  assignments: Assignment[];
  reroutedUsersCount: number;
}

/**
 * MVP: Recalculates all routes for a given set of users and exits.
 * 
 * Flow:
 * 1. Initial distance-based assignment for all users
 * 2. Balance the crowd to handle overloaded exits and reroute if needed
 */
export function recalculateRoutes(
  userLocations: UserLocation[], 
  exits: Exit[]
): RouteRecalculationResult {
  
  if (!userLocations.length || !exits.length) {
    return {
      assignments: [],
      reroutedUsersCount: 0
    };
  }

  // Phase 1: Initial naive nearest-exit assignment
  const initialAssignments: Assignment[] = [];
  userLocations.forEach(user => {
    const assignment = assignExit(user, exits);
    if (assignment) {
      initialAssignments.push(assignment);
    }
  });

  // Phase 2: Crowd balancing
  const finalAssignments = balanceCrowd(initialAssignments, exits, userLocations);

  // Count how many users were rerouted away from their initial nearest exit
  let reroutedCount = 0;
  finalAssignments.forEach((finalAssign) => {
    const initialAssign = initialAssignments.find(a => a.userId === finalAssign.userId);
    if (initialAssign && initialAssign.exitId !== finalAssign.exitId) {
      reroutedCount++;
    }
  });

  return {
    assignments: finalAssignments,
    reroutedUsersCount: reroutedCount
  };
}
