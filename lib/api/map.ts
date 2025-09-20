export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
  type: 'bus-stop' | 'depot' | 'point-of-interest';
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  order: number;
  stopType: 'pickup' | 'dropoff' | 'waypoint';
  waitTime?: number; // in minutes
  distance?: number; // in kilometers from previous point
}

export interface BusRoute {
  routeId: string;
  routeName: string;
  points: RoutePoint[];
  totalDistance: number;
  estimatedTime: number;
  trafficCondition: 'light' | 'moderate' | 'heavy';
}

export interface NearbyStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers from user
  nextBuses: {
    routeId: string;
    routeName: string;
    estimatedArrival: string;
    busId: string;
  }[];
}

// Mock data for nearby stops
const mockNearbyStops: NearbyStop[] = [
  {
    stopId: "stop_001",
    name: "MG Road Bus Stop",
    latitude: 12.9752,
    longitude: 77.6095,
    distance: 0.5,
    nextBuses: [
      {
        routeId: "route_45A",
        routeName: "Route 45A",
        estimatedArrival: "5 mins",
        busId: "bus_001"
      },
      {
        routeId: "route_12B",
        routeName: "Route 12B", 
        estimatedArrival: "12 mins",
        busId: "bus_002"
      }
    ]
  },
  {
    stopId: "stop_002",
    name: "Electronic City Hub",
    latitude: 12.8438,
    longitude: 77.6606,
    distance: 1.2,
    nextBuses: [
      {
        routeId: "route_23C",
        routeName: "Route 23C",
        estimatedArrival: "8 mins",
        busId: "bus_003"
      }
    ]
  },
  {
    stopId: "stop_003",
    name: "Whitefield Tech Park",
    latitude: 12.9698,
    longitude: 77.7500,
    distance: 2.1,
    nextBuses: [
      {
        routeId: "route_156F",
        routeName: "Route 156F",
        estimatedArrival: "15 mins",
        busId: "bus_006"
      }
    ]
  }
];

// Mock bus routes
const mockBusRoutes: Record<string, BusRoute> = {
  "route_45A": {
    routeId: "route_45A",
    routeName: "Route 45A - Bangalore Central to Electronic City",
    points: [
      {
        latitude: 12.9716,
        longitude: 77.5946,
        order: 1,
        stopType: "pickup",
        waitTime: 2,
        distance: 0
      },
      {
        latitude: 12.9352,
        longitude: 77.6245,
        order: 2,
        stopType: "waypoint",
        waitTime: 1,
        distance: 5.2
      },
      {
        latitude: 12.8438,
        longitude: 77.6606,
        order: 3,
        stopType: "dropoff",
        waitTime: 3,
        distance: 12.5
      }
    ],
    totalDistance: 17.7,
    estimatedTime: 45,
    trafficCondition: "moderate"
  },
  "route_12B": {
    routeId: "route_12B",
    routeName: "Route 12B - Koramangala to MG Road",
    points: [
      {
        latitude: 12.9352,
        longitude: 77.6245,
        order: 1,
        stopType: "pickup",
        waitTime: 1,
        distance: 0
      },
      {
        latitude: 12.9752,
        longitude: 77.6095,
        order: 2,
        stopType: "dropoff",
        waitTime: 2,
        distance: 4.8
      }
    ],
    totalDistance: 4.8,
    estimatedTime: 25,
    trafficCondition: "light"
  }
};

// Mock locations
const mockLocations: MapLocation[] = [
  {
    latitude: 12.9752,
    longitude: 77.6095,
    address: "MG Road, Bangalore",
    landmark: "Brigade Road Junction",
    type: "bus-stop"
  },
  {
    latitude: 12.8438,
    longitude: 77.6606,
    address: "Electronic City Phase 1",
    landmark: "Infosys Main Gate",
    type: "bus-stop"
  },
  {
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Bangalore Central",
    landmark: "Railway Station",
    type: "depot"
  },
  {
    latitude: 12.9698,
    longitude: 77.7500,
    address: "Whitefield",
    landmark: "ITPL Main Gate",
    type: "point-of-interest"
  }
];

/**
 * Get nearby bus stops within a radius
 */
export async function getNearbyStops(
  latitude: number,
  longitude: number,
  radius: number = 2 // Default 2km radius
): Promise<NearbyStop[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Filter stops within radius (simplified distance calculation)
  const nearbyStops = mockNearbyStops.filter(stop => {
    const distance = Math.sqrt(
      Math.pow(stop.latitude - latitude, 2) + 
      Math.pow(stop.longitude - longitude, 2)
    ) * 111; // Rough km conversion
    return distance <= radius;
  });
  
  // Update distances based on user location
  return nearbyStops.map(stop => ({
    ...stop,
    distance: Math.sqrt(
      Math.pow(stop.latitude - latitude, 2) + 
      Math.pow(stop.longitude - longitude, 2)
    ) * 111
  }));
}

/**
 * Get route details with all stops
 */
export async function getRouteDetails(routeId: string): Promise<BusRoute> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const route = mockBusRoutes[routeId];
  if (!route) {
    throw new Error('Route not found');
  }
  
  return route;
}

/**
 * Get optimized route between two points considering traffic
 */
export async function getOptimizedRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  options?: {
    avoidTraffic?: boolean;
    preferHighways?: boolean;
  }
): Promise<BusRoute> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Generate a mock optimized route
  const distance = Math.sqrt(
    Math.pow(to.lat - from.lat, 2) + 
    Math.pow(to.lng - from.lng, 2)
  ) * 111;
  
  const trafficCondition = options?.avoidTraffic ? 'light' : 
    distance > 10 ? 'heavy' : 
    distance > 5 ? 'moderate' : 'light';
  
  return {
    routeId: `optimized_${Date.now()}`,
    routeName: "Optimized Route",
    points: [
      {
        latitude: from.lat,
        longitude: from.lng,
        order: 1,
        stopType: "pickup",
        waitTime: 2,
        distance: 0
      },
      {
        latitude: to.lat,
        longitude: to.lng,
        order: 2,
        stopType: "dropoff",
        waitTime: 1,
        distance: distance
      }
    ],
    totalDistance: distance,
    estimatedTime: Math.ceil(distance * 2.5), // Rough time estimation
    trafficCondition
  };
}

/**
 * Get current traffic conditions for a route or area
 */
export async function getTrafficConditions(
  points: { lat: number; lng: number }[]
): Promise<{
  condition: 'light' | 'moderate' | 'heavy';
  delay: number; // in minutes
  alternateRoutes?: BusRoute[];
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock traffic analysis
  const conditions: ('light' | 'moderate' | 'heavy')[] = ['light', 'moderate', 'heavy'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  const delays = { light: 2, moderate: 8, heavy: 20 };
  const delay = delays[condition] + Math.floor(Math.random() * 10);
  
  return {
    condition,
    delay,
    alternateRoutes: condition === 'heavy' ? [mockBusRoutes["route_12B"]] : undefined
  };
}

/**
 * Search locations (bus stops, landmarks, etc.)
 */
export async function searchLocations(
  query: string,
  options?: {
    type?: 'bus-stop' | 'depot' | 'point-of-interest';
    limit?: number;
  }
): Promise<MapLocation[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 350));
  
  let filteredLocations = mockLocations.filter(location =>
    location.address?.toLowerCase().includes(query.toLowerCase()) ||
    location.landmark?.toLowerCase().includes(query.toLowerCase())
  );
  
  // Filter by type if specified
  if (options?.type) {
    filteredLocations = filteredLocations.filter(location => location.type === options.type);
  }
  
  // Limit results if specified
  if (options?.limit) {
    filteredLocations = filteredLocations.slice(0, options.limit);
  }
  
  return filteredLocations;
}