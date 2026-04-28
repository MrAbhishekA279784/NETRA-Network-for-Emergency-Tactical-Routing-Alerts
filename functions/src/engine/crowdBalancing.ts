import { Assignment, Exit, UserLocation, assignExit } from './exitAllocation';

export interface ExitLoad {
  exitId: string;
  assignedUsers: number;
  capacity: number;
  isOverloaded: boolean;
}

/**
 * MVP: Basic crowd balancing
 * Identifies overloaded exits and reassigns users to alternative exits.
 */
export function balanceCrowd(
  assignments: Assignment[], 
  exits: Exit[], 
  userLocations: UserLocation[]
): Assignment[] {
  // Calculate current exit loads
  const exitLoads = new Map<string, ExitLoad>();
  exits.forEach(exit => {
    exitLoads.set(exit.id, {
      exitId: exit.id,
      assignedUsers: 0,
      capacity: exit.capacity,
      isOverloaded: false
    });
  });

  // Calculate load distribution
  assignments.forEach(assignment => {
    const load = exitLoads.get(assignment.exitId);
    if (load) {
      load.assignedUsers++;
      if (load.assignedUsers > load.capacity) {
        load.isOverloaded = true;
      }
    }
  });

  const balancedAssignments: Assignment[] = [];
  const overloadedExitIds = new Set(
    Array.from(exitLoads.values())
      .filter(load => load.isOverloaded)
      .map(load => load.exitId)
  );

  // If no exits are overloaded, return the original assignments
  if (overloadedExitIds.size === 0) {
    return assignments;
  }

  // Find non-overloaded exits
  const availableExits = exits.filter(exit => !overloadedExitIds.has(exit.id));

  // If ALL exits are overloaded, we can't balance further in MVP. Return original.
  if (availableExits.length === 0) {
     return assignments;
  }

  // Attempt to reassign users currently going to overloaded exits
  assignments.forEach(assignment => {
    if (overloadedExitIds.has(assignment.exitId)) {
      // User is heading to an overloaded exit. Try to find the closest available one.
      const userLoc = userLocations.find(u => u.userId === assignment.userId);
      if (userLoc) {
        const newAssignment = assignExit(userLoc, availableExits);
        if (newAssignment) {
           balancedAssignments.push(newAssignment);
           
           // Update load for the new exit so we don't accidentally overload it
           const newLoad = exitLoads.get(newAssignment.exitId);
           if (newLoad) {
             newLoad.assignedUsers++;
             if (newLoad.assignedUsers > newLoad.capacity) {
                // If it becomes overloaded, remove it from available exits for remaining users
                newLoad.isOverloaded = true;
                const index = availableExits.findIndex(e => e.id === newAssignment.exitId);
                if (index > -1) {
                  availableExits.splice(index, 1);
                }
             }
           }
           return;
        }
      }
    }
    // Keep original assignment if not overloaded or if we couldn't find a better one
    balancedAssignments.push(assignment);
  });

  return balancedAssignments;
}
