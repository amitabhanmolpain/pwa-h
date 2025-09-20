export interface DriverLocation {
  driverId: string;
  busId: string;
  route: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  isOnDuty: boolean;
  nextStop: string;
  estimatedArrival: string;
  currentLocation: string;
  weatherCondition?: string;
}

export interface TrackingParams {
  busId?: string;
  driverId?: string;
  route?: string;
}

export interface BusStatus {
  busId: string;
  status: 'on-time' | 'delayed' | 'ahead' | 'stopped';
  delay?: number; // in minutes
  currentLocation: string;
  nextStop: string;
  estimatedArrival: string;
  occupancy: number;
  totalCapacity: number;
  speed: number;
  trafficCondition: 'light' | 'moderate' | 'heavy';
  weatherCondition?: string;
}

// Mock driver locations
const mockDriverLocations: Record<string, DriverLocation> = {
  "1": {
    driverId: "driver_001",
    busId: "1",
    route: "Route 45A",
    latitude: 12.9716,
    longitude: 77.5946,
    speed: 45,
    heading: 90,
    timestamp: new Date().toISOString(),
    isOnDuty: true,
    nextStop: "Koramangala Junction",
    estimatedArrival: "15 mins",
    currentLocation: "Near Bangalore Central",
    weatherCondition: "Clear"
  },
  "2": {
    driverId: "driver_002", 
    busId: "2",
    route: "Route 12B",
    latitude: 12.9352,
    longitude: 77.6245,
    speed: 32,
    heading: 45,
    timestamp: new Date().toISOString(),
    isOnDuty: true,
    nextStop: "MG Road",
    estimatedArrival: "8 mins",
    currentLocation: "Koramangala Bus Stop",
    weatherCondition: "Partly Cloudy"
  },
  "3": {
    driverId: "driver_003",
    busId: "3", 
    route: "Route 23C",
    latitude: 12.9255,
    longitude: 77.5468,
    speed: 38,
    heading: 120,
    timestamp: new Date().toISOString(),
    isOnDuty: true,
    nextStop: "Whitefield Tech Park",
    estimatedArrival: "25 mins",
    currentLocation: "Banashankari Circle",
    weatherCondition: "Clear"
  }
};

// Mock bus statuses
const mockBusStatuses: Record<string, BusStatus> = {
  "1": {
    busId: "1",
    status: "on-time",
    delay: 0,
    currentLocation: "Near Bangalore Central",
    nextStop: "Koramangala Junction",
    estimatedArrival: "15 mins",
    occupancy: 25,
    totalCapacity: 40,
    speed: 45,
    trafficCondition: "light",
    weatherCondition: "Clear"
  },
  "2": {
    busId: "2",
    status: "delayed",
    delay: 5,
    currentLocation: "Koramangala Bus Stop", 
    nextStop: "MG Road",
    estimatedArrival: "8 mins",
    occupancy: 35,
    totalCapacity: 45,
    speed: 32,
    trafficCondition: "moderate",
    weatherCondition: "Partly Cloudy"
  },
  "3": {
    busId: "3",
    status: "ahead",
    delay: -3,
    currentLocation: "Banashankari Circle",
    nextStop: "Whitefield Tech Park",
    estimatedArrival: "25 mins",
    occupancy: 18,
    totalCapacity: 42,
    speed: 38,
    trafficCondition: "heavy",
    weatherCondition: "Clear"
  }
};

/**
 * Get real-time location of a bus/driver
 */
export async function getDriverLocation(params: TrackingParams): Promise<DriverLocation> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let driverLocation: DriverLocation | undefined;
  
  // Find by busId first
  if (params.busId) {
    driverLocation = mockDriverLocations[params.busId];
  }
  
  // Find by driverId if not found by busId
  if (!driverLocation && params.driverId) {
    driverLocation = Object.values(mockDriverLocations).find(
      location => location.driverId === params.driverId
    );
  }
  
  // Find by route if not found by other params
  if (!driverLocation && params.route) {
    driverLocation = Object.values(mockDriverLocations).find(
      location => location.route === params.route
    );
  }
  
  // Default to first driver if none found
  if (!driverLocation) {
    driverLocation = Object.values(mockDriverLocations)[0];
  }
  
  // Add some random movement simulation
  const randomOffset = 0.001;
  return {
    ...driverLocation,
    latitude: driverLocation.latitude + (Math.random() - 0.5) * randomOffset,
    longitude: driverLocation.longitude + (Math.random() - 0.5) * randomOffset,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get detailed bus status including delays, occupancy, etc.
 */
export async function getBusStatus(busId: string): Promise<BusStatus> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const busStatus = mockBusStatuses[busId];
  if (!busStatus) {
    throw new Error('Bus not found');
  }
  
  // Add some randomness to simulate real-time changes
  return {
    ...busStatus,
    occupancy: Math.max(0, busStatus.occupancy + Math.floor(Math.random() * 6) - 3),
    speed: Math.max(0, busStatus.speed + Math.floor(Math.random() * 10) - 5)
  };
}

/**
 * Subscribe to real-time location updates
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToLocationUpdates(
  params: TrackingParams,
  onUpdate: (location: DriverLocation) => void,
  onError: (error: Error) => void
): () => void {
  // Polling interval in milliseconds
  const POLL_INTERVAL = 5000;

  let isSubscribed = true;

  const pollLocation = async () => {
    try {
      if (!isSubscribed) return;
      
      const location = await getDriverLocation(params);
      onUpdate(location);
      
      if (isSubscribed) {
        setTimeout(pollLocation, POLL_INTERVAL);
      }
    } catch (error) {
      if (isSubscribed) {
        onError(error as Error);
        setTimeout(pollLocation, POLL_INTERVAL);
      }
    }
  };

  pollLocation();

  // Return cleanup function
  return () => {
    isSubscribed = false;
  };
}

/**
 * Mock socket subscription for real-time updates
 * Returns a cleanup function.
 */
export function subscribeToLocationSocket(
  params: TrackingParams,
  onUpdate: (location: DriverLocation) => void,
  onError: (error: Error) => void
): () => void {
  let isActive = true;
  
  // Simulate socket updates with faster intervals
  const SOCKET_INTERVAL = 2000;
  
  const simulateSocketUpdates = async () => {
    while (isActive) {
      try {
        await new Promise(resolve => setTimeout(resolve, SOCKET_INTERVAL));
        if (!isActive) break;
        
        const location = await getDriverLocation(params);
        onUpdate(location);
      } catch (error) {
        if (isActive) {
          onError(error as Error);
        }
      }
    }
  };
  
  // Start the simulation
  simulateSocketUpdates();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
}