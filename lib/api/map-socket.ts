/**
 * Mock real-time socket subscription for map-related data
 * Simulates WebSocket connections with mock data
 * 
 * NOTE: This file contains mock implementations that simulate socket connections
 * All URLs and endpoints are simulated and will not make actual network requests
 */

// Define update event types
export type MapUpdateType = 
  | 'traffic:update'       // Traffic condition changes
  | 'bus:location'         // Bus location updates
  | 'stop:estimated-times' // Updates to estimated arrival times
  | 'route:delay';         // Route delay notifications

// Traffic update payload
export interface TrafficUpdate {
  area: {
    centerLat: number;
    centerLng: number;
    radius?: number;
    points?: Array<{lat: number, lng: number}>;
  };
  condition: 'light' | 'moderate' | 'heavy';
  delay: number; // in minutes
  cause?: string;
  timestamp: number;
}

// Bus location update payload
export interface BusLocationUpdate {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  nextStopId: string;
  estimatedArrival: string;
  timestamp: number;
}

// Stop estimated times update payload
export interface StopTimesUpdate {
  stopId: string;
  buses: Array<{
    busId: string;
    routeId: string;
    routeName: string;
    estimatedArrival: string;
    distance: number;
    isApproaching: boolean;
  }>;
  timestamp: number;
}

// Route delay notification payload
export interface RouteDelayUpdate {
  routeId: string;
  routeName: string;
  delayMinutes: number;
  reason: string;
  affectedStops: string[];
  timestamp: number;
}

// Type guard functions for event payloads
export const isTrafficUpdate = (data: any): data is TrafficUpdate => 
  data && typeof data === 'object' && 'condition' in data && 'area' in data;

export const isBusLocationUpdate = (data: any): data is BusLocationUpdate => 
  data && typeof data === 'object' && 'busId' in data && 'latitude' in data && 'longitude' in data;

export const isStopTimesUpdate = (data: any): data is StopTimesUpdate => 
  data && typeof data === 'object' && 'stopId' in data && Array.isArray(data.buses);

export const isRouteDelayUpdate = (data: any): data is RouteDelayUpdate => 
  data && typeof data === 'object' && 'routeId' in data && 'delayMinutes' in data;

/**
 * Subscribe to real-time map updates via socket
 * 
 * @param subscriptions Map of event types to subscribe to with callback functions
 * @param boundingBox Optional geographic area to limit updates (useful for map viewport)
 * @returns Cleanup function to unsubscribe
 */
export async function subscribeToMapUpdates(
  subscriptions: {
    [key in MapUpdateType]?: (data: any) => void;
  },
  boundingBox?: {
    north: number; // lat max
    south: number; // lat min
    east: number;  // lng max
    west: number;  // lng min
  }
): Promise<() => void> {
  try {
    // Dynamic import so builds don't fail if socket.io-client isn't installed
    const mod = await import('socket.io-client');
    const io = mod?.io || mod?.default || mod;
    
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL as string) || 
                       (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') as string) || 
                       'http://localhost:8080';
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      reconnectionDelay: 1000,
      reconnection: true,
      transports: ['websocket'],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false
    });
    
    // Setup connection
    socket.on('connect', () => {
      console.log('Map socket connected');
      
      // Subscribe to event types
      Object.keys(subscriptions).forEach(eventType => {
        socket.emit('subscribe', { 
          type: eventType,
          boundingBox: boundingBox // If provided, limit updates to this area
        });
      });
    });
    
    socket.on('connect_error', (error: Error) => {
      console.error('Map socket connection error:', error);
    });
    
    // Handle incoming updates
    Object.entries(subscriptions).forEach(([eventType, callback]) => {
      socket.on(eventType, (data: any) => {
        // Apply appropriate type guard
        switch (eventType) {
          case 'traffic:update':
            if (isTrafficUpdate(data)) callback(data);
            break;
          case 'bus:location':
            if (isBusLocationUpdate(data)) callback(data);
            break;
          case 'stop:estimated-times':
            if (isStopTimesUpdate(data)) callback(data);
            break;
          case 'route:delay':
            if (isRouteDelayUpdate(data)) callback(data);
            break;
          default:
            callback(data); // Pass through for unknown types
        }
      });
    });
    
    // Return cleanup function
    return () => {
      // Unsubscribe from all event types
      Object.keys(subscriptions).forEach(eventType => {
        socket.emit('unsubscribe', { type: eventType });
      });
      
      // Disconnect socket
      socket.disconnect();
    };
  } catch (error) {
    console.error('Failed to initialize map socket:', error);
    return () => {}; // Return empty cleanup function
  }
}

/**
 * Subscribe to updates for a specific bus route
 * 
 * @param routeId The route ID to track
 * @param onLocationUpdate Callback for bus location updates
 * @param onDelayUpdate Callback for route delay notifications
 * @returns Cleanup function to unsubscribe
 */
export async function subscribeToRouteUpdates(
  routeId: string,
  onLocationUpdate: (data: BusLocationUpdate) => void,
  onDelayUpdate?: (data: RouteDelayUpdate) => void
): Promise<() => void> {
  try {
    // Dynamic import so builds don't fail if socket.io-client isn't installed
    const mod = await import('socket.io-client');
    const io = mod?.io || mod?.default || mod;
    
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL as string) || 
                       (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') as string) || 
                       'http://localhost:8080';
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      reconnectionDelay: 1000,
      reconnection: true,
      transports: ['websocket'],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false
    });
    
    // Setup connection
    socket.on('connect', () => {
      console.log('Route socket connected');
      
      // Join the route room
      socket.emit('join:route', { routeId });
    });
    
    socket.on('connect_error', (error: Error) => {
      console.error('Route socket connection error:', error);
    });
    
    // Handle bus location updates for this route
    socket.on('bus:location', (data: any) => {
      if (isBusLocationUpdate(data) && data.routeId === routeId) {
        onLocationUpdate(data);
      }
    });
    
    // Handle route delay notifications
    if (onDelayUpdate) {
      socket.on('route:delay', (data: any) => {
        if (isRouteDelayUpdate(data) && data.routeId === routeId) {
          onDelayUpdate(data);
        }
      });
    }
    
    // Return cleanup function
    return () => {
      // Leave the route room
      socket.emit('leave:route', { routeId });
      
      // Disconnect socket
      socket.disconnect();
    };
  } catch (error) {
    console.error('Failed to initialize route socket:', error);
    return () => {}; // Return empty cleanup function
  }
}

/**
 * Subscribe to updates for a specific bus stop
 * 
 * @param stopId The stop ID to monitor
 * @param onTimesUpdate Callback for estimated arrival times updates
 * @returns Cleanup function to unsubscribe
 */
export async function subscribeToStopUpdates(
  stopId: string,
  onTimesUpdate: (data: StopTimesUpdate) => void
): Promise<() => void> {
  try {
    // Dynamic import so builds don't fail if socket.io-client isn't installed
    const mod = await import('socket.io-client');
    const io = mod?.io || mod?.default || mod;
    
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL as string) || 
                       (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') as string) || 
                       'http://localhost:8080';
    
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      reconnectionDelay: 1000,
      reconnection: true,
      transports: ['websocket'],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false
    });
    
    // Setup connection
    socket.on('connect', () => {
      console.log('Stop socket connected');
      
      // Join the stop room
      socket.emit('join:stop', { stopId });
    });
    
    socket.on('connect_error', (error: Error) => {
      console.error('Stop socket connection error:', error);
    });
    
    // Handle stop estimated times updates
    socket.on('stop:estimated-times', (data: any) => {
      if (isStopTimesUpdate(data) && data.stopId === stopId) {
        onTimesUpdate(data);
      }
    });
    
    // Return cleanup function
    return () => {
      // Leave the stop room
      socket.emit('leave:stop', { stopId });
      
      // Disconnect socket
      socket.disconnect();
    };
  } catch (error) {
    console.error('Failed to initialize stop socket:', error);
    return () => {}; // Return empty cleanup function
  }
}