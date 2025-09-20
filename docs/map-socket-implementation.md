# Adding Socket-Based Real-time Updates to Map View

Here's how to implement real-time socket updates in your map functionality:

## 1. Add socket-based real-time bus location tracking to MapView

In your `MapView` component, add this code to track a bus in real-time:

```tsx
// Import the socket helper
import { subscribeToRouteUpdates } from "@/lib/api/map-socket";

// Inside MapView component, add a new effect for route tracking
useEffect(() => {
  if (!map || !trackingBus?.routeId) return;
  
  let cleanup: (() => void) | null = null;
  
  const setupRouteTracking = async () => {
    try {
      cleanup = await subscribeToRouteUpdates(
        trackingBus.routeId!,
        (locationUpdate) => {
          // Update bus marker position
          if (trackingMarker) {
            trackingMarker.setLatLng([locationUpdate.latitude, locationUpdate.longitude]);
          } else {
            // Create a new bus marker if it doesn't exist
            const L = (window as any).L;
            const busIcon = L.divIcon({
              className: "custom-bus-marker",
              html: `<div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 6px 10px; border-radius: 14px; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">BUS</div>`,
              iconSize: [50, 32],
              iconAnchor: [25, 16],
            });
            
            const marker = L.marker(
              [locationUpdate.latitude, locationUpdate.longitude], 
              { icon: busIcon }
            )
              .addTo(map)
              .bindPopup(`
                <div class="p-3">
                  <h3 class="font-bold text-gray-900 mb-2">Route ${trackingBus.route}</h3>
                  <p class="text-sm text-gray-600">Next stop: ${locationUpdate.nextStopId}</p>
                  <p class="text-sm text-gray-600">ETA: ${locationUpdate.estimatedArrival}</p>
                  <p class="text-sm text-gray-600">Speed: ${locationUpdate.speed} km/h</p>
                </div>
              `);
            
            setTrackingMarker(marker);
          }
          
          // Update bus tracking status if provided in props
          if (trackingBus.currentLocation) {
            trackingBus.currentLocation.lat = locationUpdate.latitude;
            trackingBus.currentLocation.lng = locationUpdate.longitude;
          }
        },
        (delayUpdate) => {
          // Handle route delay notification
          toast({
            title: `${delayUpdate.routeName} Delayed`,
            description: `${delayUpdate.delayMinutes} minute delay due to ${delayUpdate.reason}`,
            variant: "destructive",
          });
          
          // Update the map to show delay on route
          if (routeLayer) {
            const L = (window as any).L;
            // Style the route layer to indicate delay
            routeLayer.setStyle({
              color: '#dc2626',
              dashArray: '10, 10',
              weight: 5
            });
          }
        }
      );
    } catch (error) {
      console.error("Failed to setup route tracking:", error);
      // Fall back to periodic polling
      const interval = setInterval(() => {
        if (trackingBus?.routeId) {
          updateRouteDetails(trackingBus.routeId);
        }
      }, 30000); // Fallback to updating every 30 seconds
      
      cleanup = () => clearInterval(interval);
    }
  };
  
  setupRouteTracking();
  
  return () => {
    if (cleanup) {
      cleanup();
    }
  };
}, [map, trackingBus?.routeId, trackingMarker, routeLayer]);
```

## 2. Add real-time traffic condition updates

To get real-time traffic updates, add this code:

```tsx
// Inside MapView component, add an effect for traffic monitoring
useEffect(() => {
  if (!map || !isMapInitialized) return;
  
  let cleanup: (() => void) | null = null;
  
  const setupTrafficUpdates = async () => {
    try {
      // Get the current map bounds
      const bounds = map.getBounds();
      const boundingBox = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
      
      cleanup = await subscribeToMapUpdates(
        {
          'traffic:update': (trafficUpdate: TrafficUpdate) => {
            // Show a notification for significant traffic changes
            if (trafficUpdate.condition === 'heavy') {
              toast({
                title: "Traffic Alert",
                description: `Heavy traffic reported${trafficUpdate.cause ? ` due to ${trafficUpdate.cause}` : ''}. Expect delays of ${trafficUpdate.delay} minutes.`,
                variant: "destructive",
              });
            }
            
            // If we have a route displayed and it passes through this area, update its style
            if (routeLayer && selectedRoute) {
              // Check if any points in our route are within the traffic area
              const isRouteAffected = selectedRoute.points.some(point => {
                // Simple check if point is within radius of traffic center
                if (trafficUpdate.area.radius) {
                  const distance = calculateDistance(
                    point.latitude, 
                    point.longitude, 
                    trafficUpdate.area.centerLat, 
                    trafficUpdate.area.centerLng
                  );
                  return distance <= trafficUpdate.area.radius;
                }
                return false;
              });
              
              if (isRouteAffected) {
                const L = (window as any).L;
                // Update route style based on traffic condition
                const color = trafficUpdate.condition === 'heavy' ? '#dc2626' : 
                              trafficUpdate.condition === 'moderate' ? '#f97316' : 
                              '#22c55e';
                              
                const dashArray = trafficUpdate.condition === 'heavy' ? '10, 10' : null;
                
                routeLayer.setStyle({
                  color,
                  dashArray,
                  weight: 4
                });
                
                // Update traffic info state
                setTrafficInfo({
                  condition: trafficUpdate.condition,
                  delay: trafficUpdate.delay
                });
              }
            }
          }
        },
        boundingBox
      );
    } catch (error) {
      console.error("Failed to setup traffic updates:", error);
    }
  };
  
  setupTrafficUpdates();
  
  return () => {
    if (cleanup) {
      cleanup();
    }
  };
}, [map, isMapInitialized, routeLayer, selectedRoute]);

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

## 3. Add real-time updates for bus stops

To get real-time bus arrival updates at stops:

```tsx
// Modify your updateNearbyStops function to include socket subscriptions
const updateNearbyStops = useCallback(async (lat: number, lng: number) => {
  try {
    setIsLoading(true);
    
    // Clear existing stop markers
    stopMarkers.forEach(marker => marker.remove());
    setStopMarkers([]);
    
    const stops = await getNearbyStops(lat, lng);
    setNearbyStops(stops);
    
    // Add markers for each bus stop
    if (map && stops.length > 0) {
      const L = (window as any).L;
      const newMarkers = stops.map(stop => {
        const stopIcon = L.divIcon({
          className: "custom-stop-marker",
          html: `<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; padding: 6px 10px; border-radius: 14px; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">STOP</div>`,
          iconSize: [50, 32],
          iconAnchor: [25, 16],
        });

        const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-3 min-w-48" id="stop-popup-${stop.stopId}">
              <h3 class="font-bold text-gray-900 mb-2">${stop.name}</h3>
              <div class="space-y-2 text-sm">
                ${stop.nextBuses.map(bus => `
                  <div class="border-t pt-2">
                    <p class="text-gray-600">Route: <span class="font-medium">${bus.routeName}</span></p>
                    <p class="text-gray-600">Arrival: <span class="font-medium" id="eta-${stop.stopId}-${bus.busId}">${bus.estimatedArrival}</span></p>
                  </div>
                `).join('')}
              </div>
            </div>
          `);
          
        // Set up real-time updates for this stop
        subscribeToStopUpdates(stop.stopId, (update) => {
          // Update the popup content with new arrival times
          const popupElement = document.getElementById(`stop-popup-${stop.stopId}`);
          if (popupElement) {
            update.buses.forEach(bus => {
              const etaElement = document.getElementById(`eta-${stop.stopId}-${bus.busId}`);
              if (etaElement) {
                etaElement.textContent = bus.estimatedArrival;
                // Highlight if the bus is approaching
                if (bus.isApproaching) {
                  etaElement.classList.add('text-green-600', 'font-bold');
                }
              }
            });
          }
        }).catch(err => console.error(`Failed to subscribe to stop ${stop.stopId} updates:`, err));
        
        return marker;
      });
      
      setStopMarkers(newMarkers);
    }
  } catch (err) {
    console.error('Error fetching nearby stops:', err);
    setError('Failed to load nearby bus stops');
    toast({
      title: "Error",
      description: "Failed to load nearby bus stops. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
}, [map, stopMarkers]);
```

## Server-Side Implementation Requirements

For these client-side socket integrations to work, the server needs to:

1. Set up a Socket.IO server
2. Create rooms for routes, stops, and geographic areas
3. Emit appropriate events with the right data structures:
   - 'bus:location' events when bus locations change
   - 'traffic:update' events when traffic conditions change
   - 'stop:estimated-times' events when ETAs change
   - 'route:delay' events when routes are delayed

The server should implement:

```javascript
// Example server-side socket setup (Node.js)
const io = require('socket.io')(server);

// When a client connects
io.on('connection', (socket) => {
  // Handle subscription to map updates
  socket.on('subscribe', (data) => {
    if (data.type && data.boundingBox) {
      // Join a room for this map area
      const roomName = `map:${data.type}:${JSON.stringify(data.boundingBox)}`;
      socket.join(roomName);
      console.log(`Client subscribed to ${data.type} in bounding box`);
    }
  });
  
  // Handle unsubscription
  socket.on('unsubscribe', (data) => {
    if (data.type && data.boundingBox) {
      const roomName = `map:${data.type}:${JSON.stringify(data.boundingBox)}`;
      socket.leave(roomName);
    }
  });
  
  // Handle joining a route room
  socket.on('join:route', (data) => {
    if (data.routeId) {
      socket.join(`route:${data.routeId}`);
      console.log(`Client joined route ${data.routeId}`);
    }
  });
  
  // Handle leaving a route room
  socket.on('leave:route', (data) => {
    if (data.routeId) {
      socket.leave(`route:${data.routeId}`);
    }
  });
  
  // Handle joining a stop room
  socket.on('join:stop', (data) => {
    if (data.stopId) {
      socket.join(`stop:${data.stopId}`);
      console.log(`Client joined stop ${data.stopId}`);
    }
  });
  
  // Handle leaving a stop room
  socket.on('leave:stop', (data) => {
    if (data.stopId) {
      socket.leave(`stop:${data.stopId}`);
    }
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Example of emitting a bus location update
function emitBusLocationUpdate(busUpdate) {
  // Emit to the specific route room
  io.to(`route:${busUpdate.routeId}`).emit('bus:location', busUpdate);
  
  // Also emit to any geographic area that includes this bus
  // This would require maintaining a list of active bounding boxes
  activeBoundingBoxes.forEach(box => {
    if (isPointInBox(busUpdate.latitude, busUpdate.longitude, box)) {
      io.to(`map:bus:location:${JSON.stringify(box)}`).emit('bus:location', busUpdate);
    }
  });
}

// Example of emitting a stop times update
function emitStopTimesUpdate(stopUpdate) {
  io.to(`stop:${stopUpdate.stopId}`).emit('stop:estimated-times', stopUpdate);
}

// Example of emitting a traffic update
function emitTrafficUpdate(trafficUpdate) {
  // Emit to all clients subscribed to traffic updates in relevant areas
  activeBoundingBoxes.forEach(box => {
    if (isAreaInBox(trafficUpdate.area, box)) {
      io.to(`map:traffic:update:${JSON.stringify(box)}`).emit('traffic:update', trafficUpdate);
    }
  });
}

// Helper to check if a point is in a bounding box
function isPointInBox(lat, lng, box) {
  return lat <= box.north && lat >= box.south && lng <= box.east && lng >= box.west;
}

// Helper to check if an area intersects with a bounding box
function isAreaInBox(area, box) {
  // Simple check for center point
  return isPointInBox(area.centerLat, area.centerLng, box);
}
```

This Redis integration would involve:
1. Setting up Redis pub/sub channels
2. Having background workers watch Redis for updates
3. Converting Redis messages to socket events
4. Maintaining active subscriptions and rooms