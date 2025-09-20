"use client"
import { useEffect, useState } from "react"
import { MapPin, Phone, User, Bus, Navigation2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapView } from "@/components/dashboard/map-view"
import { toast } from "@/hooks/use-toast"
import { 
  requestNotificationPermission, 
  sendBusApproachingNotification, 
  sendBusArrivalNotification, 
  sendJourneyStartedNotification 
} from "@/lib/notification-utils"

interface DriverLocation {
  latitude: number
  longitude: number
  currentLocation: string
  nextStop: string
  estimatedArrival: string
  speed: number
  trafficCondition: "light" | "moderate" | "heavy"
  weatherCondition: string
}

interface BusStatus {
  busId: string
  status: "on-time" | "delayed" | "cancelled"
  delay?: number
  currentLocation: string
  nextStop: string
  estimatedArrival: string
  occupancy: number
  totalCapacity: number
  speed: number
  trafficCondition: "light" | "moderate" | "heavy"
  weatherCondition: string
}

interface TrackSectionProps {
  busData?: {
    route: string;
    busId: string;
    driverId?: string;
    driverName: string;
    driverPhone: string;
    seatsAvailable: number;
    womenSeats: number;
    hasWomenConductor: boolean;
    image?: string;
    destination?: string;
    from?: string;
    to?: string;
  }
}

// Mock functions to replace API calls
const getMockDriverLocation = (): DriverLocation => {
  // Simulate movement around Bangalore area
  const baseLatitude = 12.9716
  const baseLongitude = 77.5946
  
  return {
    latitude: baseLatitude + (Math.random() - 0.5) * 0.1,
    longitude: baseLongitude + (Math.random() - 0.5) * 0.1,
    currentLocation: `Station ${Math.floor(Math.random() * 10) + 1}`,
    nextStop: `Stop ${Math.floor(Math.random() * 5) + 1}`,
    estimatedArrival: `${Math.floor(Math.random() * 10) + 5} mins`,
    speed: Math.floor(Math.random() * 30) + 20, // 20-50 km/h
    trafficCondition: Math.random() > 0.7 ? "heavy" : Math.random() > 0.4 ? "moderate" : "light",
    weatherCondition: Math.random() > 0.8 ? "Rainy" : "Clear"
  }
}

const getMockBusStatus = (busId: string): BusStatus => {
  return {
    busId,
    status: Math.random() > 0.8 ? "delayed" : "on-time",
    delay: Math.random() > 0.8 ? Math.floor(Math.random() * 10) + 1 : undefined,
    currentLocation: `Station ${Math.floor(Math.random() * 10) + 1}`,
    nextStop: `Stop ${Math.floor(Math.random() * 5) + 1}`,
    estimatedArrival: `${Math.floor(Math.random() * 15) + 5} mins`,
    occupancy: Math.floor(Math.random() * 45) + 5,
    totalCapacity: 50,
    speed: Math.floor(Math.random() * 30) + 20,
    trafficCondition: Math.random() > 0.7 ? "heavy" : Math.random() > 0.4 ? "moderate" : "light",
    weatherCondition: Math.random() > 0.8 ? "Rainy" : "Clear"
  }
}

const simulateLocationUpdates = (
  busId: string,
  onLocationUpdate: (location: DriverLocation) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const interval = setInterval(() => {
    try {
      const location = getMockDriverLocation()
      onLocationUpdate(location)
    } catch (error) {
      onError?.(error as Error)
    }
  }, 5000) // Update every 5 seconds
  
  return () => clearInterval(interval)
}

export function TrackSection({ busData }: TrackSectionProps) {
  const [currentLocation, setCurrentLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [busLocation, setBusLocation] = useState({ lat: 12.9716, lng: 77.5946 })
  const [currentSpeed, setCurrentSpeed] = useState(25)
  const [estimatedTime, setEstimatedTime] = useState("45 mins")
  const [busStatus, setBusStatus] = useState<'approaching' | 'arrived' | 'departed' | 'en-route'>('en-route')
  const [busAtUserLocation, setBusAtUserLocation] = useState(false)
  const [journeyStarted, setJourneyStarted] = useState(false)
  const [userLocationName, setUserLocationName] = useState("Your Location")
  const [destinationName, setDestinationName] = useState("MG Road")
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [nearbyStartPoint, setNearbyStartPoint] = useState<{lat: number, lng: number} | null>(null)
  
  // Get user's location and set up live tracking
  useEffect(() => {
    if (!busData?.busId) return;

    let cleanup: (() => void) | null = null;

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(userPos);
          setLocationAccuracy(position.coords.accuracy);
          
          // Get location name using reverse geocoding
          await fetchLocationName(userPos.lat, userPos.lng);
          
          // Start mock real-time bus tracking
          cleanup = simulateLocationUpdates(
            busData.busId,
            (location: DriverLocation) => {
              setBusLocation({ lat: location.latitude, lng: location.longitude });
              setCurrentSpeed(location.speed);

              if (location.nextStop === userLocationName && !busAtUserLocation) {
                setBusStatus('approaching');
                sendBusApproachingNotification(busData.route, userLocationName, 5);
              } else if (location.currentLocation === userLocationName && !journeyStarted) {
                setBusStatus('arrived');
                setBusAtUserLocation(true);
                sendBusArrivalNotification(busData.route, userLocationName);
              } else if (journeyStarted) {
                setBusStatus('departed');
              }
            },
            (error: Error) => {
              console.error('Mock location update error:', error);
            }
          )
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default location (Bangalore center)
          setCurrentLocation({ lat: 12.9716, lng: 77.5946 });
          setUserLocationName("Bangalore");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [busData]);
  
  // Mock reverse geocoding function
  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock location names based on coordinates
      const locations = [
        "MG Road", "Brigade Road", "Koramangala", "Indiranagar", 
        "Whitefield", "Electronic City", "Banashankari", "Jayanagar",
        "HSR Layout", "BTM Layout", "Marathahalli", "Bellandur"
      ]
      
      const randomLocation = locations[Math.floor(Math.random() * locations.length)]
      setUserLocationName(randomLocation)
    } catch (error) {
      console.error("Error fetching mock location name:", error);
    }
  };
  
  // Generate a realistic nearby starting point for the bus
  const generateNearbyStartPoint = (lat: number, lng: number) => {
    // Calculate a point 500-1000m away in a random direction
    const distance = 0.5 + Math.random() * 0.5; // 0.5-1km
    const angle = Math.random() * 2 * Math.PI; // Random angle in radians
    
    // Earth's radius in km
    const earthRadius = 6371;
    
    // Convert distance to radians
    const distanceRadians = distance / earthRadius;
    
    // Convert lat/lng to radians
    const latRad = lat * Math.PI / 180;
    const lngRad = lng * Math.PI / 180;
    
    // Calculate new position
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceRadians) + 
      Math.cos(latRad) * Math.sin(distanceRadians) * Math.cos(angle)
    );
    
    const newLngRad = lngRad + Math.atan2(
      Math.sin(angle) * Math.sin(distanceRadians) * Math.cos(latRad),
      Math.cos(distanceRadians) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    
    // Convert back to degrees
    const newLat = newLatRad * 180 / Math.PI;
    const newLng = newLngRad * 180 / Math.PI;
    
    setNearbyStartPoint({ lat: newLat, lng: newLng });
    setBusLocation({ lat: newLat, lng: newLng });
  };

  // Track detailed bus status with mock data
  useEffect(() => {
    if (!busData?.busId) return;

    let statusInterval: NodeJS.Timeout;

    const fetchMockBusStatus = async () => {
      try {
        const status = getMockBusStatus(busData.busId);
        
        // Update destination if available
        if (status.nextStop) {
          setDestinationName(status.nextStop);
        }
        
        // Calculate remaining time based on bus status
        if (status.estimatedArrival) {
          setEstimatedTime(status.estimatedArrival);
        }
        
        // Update the UI with occupancy info
        if (status.occupancy !== undefined) {
          const remainingSeats = status.totalCapacity - status.occupancy;
          busData.seatsAvailable = remainingSeats;
        }
        
        // Show traffic/weather alerts if conditions are poor
        if (status.trafficCondition === 'heavy' || status.weatherCondition === 'Rainy') {
          toast({
            title: "Travel Alert",
            description: `Heavy ${status.trafficCondition === 'heavy' ? 'traffic' : 'weather'} conditions may cause delays.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching mock bus status:', error);
      }
    };

    // Initial fetch
    fetchMockBusStatus();
    
    // Set up polling interval for status updates (every 30 seconds)
    statusInterval = setInterval(fetchMockBusStatus, 30000);

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [busData]);

  useEffect(() => {
    if (!busData) return;

    // Set destination based on busData or defaults
    if (busData.from && busData.to) {
      setDestinationName(busData.to)
    } else {
      // Default destination if not specified
      setDestinationName("MG Road")
    }

    const calculateEstimatedTime = () => {
      // If we have user's real location, calculate more realistic ETA
      if (nearbyStartPoint && currentLocation) {
        // Calculate distance in km using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (currentLocation.lat - nearbyStartPoint.lat) * Math.PI / 180;
        const dLon = (currentLocation.lng - nearbyStartPoint.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(nearbyStartPoint.lat * Math.PI / 180) * Math.cos(currentLocation.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Estimate time based on average bus speed (20-30 km/h in city traffic)
        const avgSpeed = 20 + Math.random() * 10;
        const timeInHours = distance / avgSpeed;
        const timeInMinutes = Math.max(1, Math.round(timeInHours * 60)); // At least 1 minute
        
        return `${timeInMinutes} mins`;
      }
      
      // Fallback to predefined routes if real location not available
      const routeDistances: { [key: string]: number } = {
        "Koramangala-Whitefield": 25,
        "Whitefield-Electronic City": 35,
        "Banashankari-Vijayanagar": 15,
        "Koramangala-Indiranagar": 8,
        "Marathahalli-Silk Board": 20,
        "Hebbal-Yesvantpur": 12,
        "Vijaynagar-MG Road": 18,
      }

      const routeKey = `${userLocationName}-${destinationName}`
      const distance = routeDistances[routeKey] || 20
      const avgSpeed = 30 // km/h average in Bangalore traffic
      const timeInHours = distance / avgSpeed
      const timeInMinutes = Math.round(timeInHours * 60)

      return `${timeInMinutes} mins`
    }

    const estimatedTime = calculateEstimatedTime()
    setEstimatedTime(estimatedTime)

    toast({
      title: "🚌 Bus Tracking Started",
      description: `Now tracking ${busData.route} from near ${userLocationName} to ${destinationName}. ETA: ${estimatedTime}`,
    })

    // Request notification permissions
    requestNotificationPermission();

    // Mock route generation function
    const fetchRouteFromOSRM = async (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate a simple mock route with intermediate points
        const steps = 10
        const route = []
        
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps
          const lat = start.lat + (end.lat - start.lat) * ratio + (Math.random() - 0.5) * 0.001
          const lng = start.lng + (end.lng - start.lng) * ratio + (Math.random() - 0.5) * 0.001
          route.push([lat, lng])
        }
        
        return route
      } catch (error) {
        console.error("Error generating mock route:", error);
      }
      
      // Fallback: generate a simple straight line with slight randomness
      const steps = 20;
      const route = [];
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio + (Math.random() - 0.5) * 0.001;
        const lng = start.lng + (end.lng - start.lng) * ratio + (Math.random() - 0.5) * 0.001;
        route.push([lat, lng]);
      }
      return route;
    };

    // Start journey simulation with real-world routing
    const simulateJourney = async () => {
      // Initialize with the nearby start point
      setBusStatus('approaching');
      
      // Get a route from nearby start point to user's location
      if (!nearbyStartPoint) {
        console.error("No nearby start point available");
        return;
      }
      const approachRoute = await fetchRouteFromOSRM(nearbyStartPoint, currentLocation);
      
      if (!approachRoute || approachRoute.length === 0) {
        console.error("Failed to get approach route");
        return;
      }
      
      // Send approaching notification (ETA based on route length)
      const approachEtaMinutes = Math.max(1, Math.ceil(approachRoute.length / 10));
      sendBusApproachingNotification(busData.route, userLocationName, approachEtaMinutes);
      
      // Animate bus along approach route
      let currentStep = 0;
      const approachInterval = setInterval(() => {
        if (currentStep >= approachRoute.length - 1) {
          clearInterval(approachInterval);
          
          // Bus has arrived at user's location
          setBusLocation(currentLocation);
          setBusStatus('arrived');
          setBusAtUserLocation(true);
          
          // Send arrival notification
          sendBusArrivalNotification(busData.route, userLocationName);
          
          // Wait for boarding time, then start journey to destination
          setTimeout(async () => {
            setBusStatus('departed');
            setJourneyStarted(true);
            setBusAtUserLocation(false);
            
            // Get or estimate MG Road coordinates
            const mgRoadCoords = { lat: 12.9752, lng: 77.6095 }; // Approximate coordinates
            
            // Get a route from user's location to destination
            const destinationRoute = await fetchRouteFromOSRM(currentLocation, mgRoadCoords);
            
            if (!destinationRoute || destinationRoute.length === 0) {
              console.error("Failed to get destination route");
              return;
            }
            
            // Send journey started notification
            sendJourneyStartedNotification(busData.route, userLocationName, destinationName);
            
            // Animate bus along destination route
            let destStep = 0;
            const journeyInterval = setInterval(() => {
              if (destStep >= destinationRoute.length - 1) {
                clearInterval(journeyInterval);
                
                // Notify arrival at destination
                toast({
                  title: "🚌 Destination Reached",
                  description: `Bus ${busData.route} has arrived at ${destinationName}.`,
                });
                
                return;
              }
              
              // Move bus along route
              const position = destinationRoute[destStep];
              setBusLocation({ lat: position[0], lng: position[1] });
              
              // Update speed based on segment (slower in congested areas, faster on highways)
              setCurrentSpeed(Math.floor(Math.random() * 30 + 15));
              
              destStep++;
            }, 1500);
            
          }, 10000); // 10 seconds wait at user location
          
          return;
        }
        
        // Move bus along approach route
        const position = approachRoute[currentStep];
        setBusLocation({ lat: position[0], lng: position[1] });
        
        // Update speed (slower as it approaches the stop)
        const progressRatio = currentStep / approachRoute.length;
        const slowingSpeed = Math.max(5, Math.floor((1 - progressRatio) * 40));
        setCurrentSpeed(slowingSpeed);
        
        currentStep++;
      }, 1000);
    };
    
    // Start the journey simulation
    simulateJourney();
    
  }, [busData, currentLocation, userLocationName, destinationName, nearbyStartPoint]);

  if (!busData) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Select a bus to track</p>
      </div>
    )
  }

  const getBusTypeColor = (type: string) => {
    return "bg-orange-100 text-orange-800"
  }

  const getBusCategory = (route?: string) => {
    if (!route) return "City Bus"

    if (busData.destination?.includes("Electronic City") || busData.destination?.includes("Whitefield")) {
      return "Intercity Express"
    } else if (busData.destination?.includes("Village") || busData.route?.includes("Village")) {
      return "Village Route"
    } else {
      return "City to City"
    }
  }

  const getApproximatePrice = () => {
    const category = getBusCategory(busData.route)
    switch (category) {
      case "Intercity Express":
        return "₹45-65"
      case "Village Route":
        return "₹15-25"
      default:
        return "₹20-35"
    }
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <Card className="border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{busData.route}</CardTitle>
              <p className="text-orange-100 text-sm">
                From: {userLocationName} → To: {destinationName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 ${busStatus === 'arrived' ? 'bg-green-400' : 'bg-orange-400'} rounded-full animate-pulse`}></div>
              <span className="text-sm">
                {busStatus === 'approaching' && 'Approaching'}
                {busStatus === 'arrived' && 'Bus at Stop'}
                {busStatus === 'departed' && 'On Route'}
                {busStatus === 'en-route' && 'Live Tracking'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {userLocationName} → {destinationName}
                  </p>
                  <p className="text-sm text-gray-600">Route Information</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getBusTypeColor("default")}>{getBusCategory(busData.route)}</Badge>
              </div>
              {busAtUserLocation && (
                <div className="bg-green-100 border border-green-300 rounded-md p-3 animate-pulse">
                  <p className="text-green-800 font-medium flex items-center">
                    <Bus className="w-4 h-4 mr-2" /> Bus at your location - Boarding now
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">{currentSpeed} km/h</div>
                  <div className="text-xs text-gray-600">Current Speed</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600">
                    {busStatus === 'arrived' ? '0 mins' : estimatedTime}
                  </div>
                  <div className="text-xs text-gray-600">
                    {busStatus === 'arrived' ? 'Waiting Time' : 'Estimated Time'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <Navigation2 className="w-5 h-5 mr-2 text-orange-500" />
            Live Location Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-80">
            <MapView 
              key="track-bus-map"
              trackingBus={busData ? {
                ...busData,
                from: userLocationName,
                to: destinationName,
                status: busStatus === 'en-route' ? undefined : busStatus,
                currentLocation: busLocation
              } : undefined} 
              showNearbyBuses={false} 
            />
          </div>
          {busStatus === 'approaching' && (
            <div className="bg-orange-100 p-3 border-t border-orange-200">
              <p className="text-sm text-orange-800 flex items-center">
                <Bus className="w-4 h-4 mr-2" /> 
                Bus is approaching your location at {userLocationName}
              </p>
            </div>
          )}
          {busStatus === 'arrived' && (
            <div className="bg-green-100 p-3 border-t border-green-200">
              <p className="text-sm text-green-800 flex items-center font-medium">
                <Bus className="w-4 h-4 mr-2" /> 
                Bus has arrived at your location. Please board now!
              </p>
            </div>
          )}
          {busStatus === 'departed' && journeyStarted && (
            <div className="bg-blue-100 p-3 border-t border-blue-200">
              <p className="text-sm text-blue-800 flex items-center">
                <Navigation2 className="w-4 h-4 mr-2" /> 
                Journey in progress: {userLocationName} → {destinationName}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Bus className="w-5 h-5 mr-2 text-orange-500" />
              Bus Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ETA</span>
                <span className="font-medium text-gray-900">{estimatedTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Speed</span>
                <span className="font-medium text-gray-900">{currentSpeed} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Available Seats</span>
                <span className="font-medium text-gray-900">{busData.seatsAvailable}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approximate Price</span>
                <span className="font-bold text-orange-600">{getApproximatePrice()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bus Category</span>
                <Badge className={getBusTypeColor("default")}>{getBusCategory(busData.route)}</Badge>
              </div>
            </div>

            {busData.womenSeats > 0 && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Women Reserved Seats:</strong> {busData.womenSeats} available
                </p>
                {busData.hasWomenConductor && (
                  <p className="text-xs text-orange-600 mt-1">✓ Women conductor available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{busData.driverName}</p>
                  <p className="text-sm text-gray-600">Driver</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-900">{busData.driverPhone}</p>
                  <p className="text-sm text-gray-600">Contact Number</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Emergency Contact:</strong> Available 24/7 for passenger assistance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200">
        <CardContent className="p-0">
          <div className="relative h-48 rounded-lg overflow-hidden">
            <img
              src={busData.image || "/placeholder.svg?height=200&width=400&query=orange bus"}
              alt={`${busData.route} bus`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full">
              <span className="font-semibold">{busData.route}</span>
            </div>
            <div className="absolute top-4 right-4 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {getBusCategory(busData.route)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
