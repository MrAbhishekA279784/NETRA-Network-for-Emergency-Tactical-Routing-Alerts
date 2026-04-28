export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Service for generating Google Maps deep links for emergency evacuation routing.
 * These links are designed to be sent via push notifications, SMS, or browser redirects
 * and do not require any app installation.
 */
export class MapsService {
  /**
   * Gets the full navigation deep link for a specific exit.
   * 
   * @param exitCoordinates The GPS location of the assigned exit
   * @returns string The Google Maps walking directions deep link
   */
  public static getNavigationLink(exitCoordinates: Coordinates): string {
    return this.generateMapsLink(exitCoordinates.lat, exitCoordinates.lng);
  }

  /**
   * Utility method to construct the exact Google Maps directory URL.
   * Sets travel mode to walking by default.
   * 
   * @param exitLat Latitude of the exit
   * @param exitLng Longitude of the exit
   * @returns string The deep link URL
   */
  public static generateMapsLink(exitLat: number, exitLng: number): string {
    // api=1 is required for Cross-Platform Deep Linking
    // destination parameter sets the end point
    // travelmode=walking ensures pedestrian routing rather than driving
    return `https://www.google.com/maps/dir/?api=1&destination=${exitLat},${exitLng}&travelmode=walking`;
  }
}
