"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Navigation, Maximize2, Bell, AlertTriangle, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { notificationService, sendBusArrivalNotification, sendBusDelayNotification } from "@/lib/notification-service"
import {
  getNearbyStops,
  getRouteDetails,
  getOptimizedRoute,
  getTrafficConditions,
  searchLocations,
  type NearbyStop,
  type BusRoute,
  type MapLocation,
  type RoutePoint
} from "@/lib/api/map"
import { getNearbyBuses } from "@/lib/api/buses"
import type { BusData } from "@/types/buses"

type BusStatus = 'approaching' | 'arrived' | 'departed' | 'en_route'

interface TrackingBus {
  route: string
  routeId?: string
  from?: string
  to?: string
  status?: BusStatus
  type?: string
  currentLocation?: { lat: number; lng: number }
  destinationLocation?: { lat: number; lng: number }
  // Extended properties to support bus tracking
  busId?: string
  driverName?: string
  driverPhone?: string
  seatsAvailable?: number
  womenSeats?: number
  hasWomenConductor?: boolean
  image?: string
  destination?: string
}

interface MapViewProps {
  trackingBus?: TrackingBus
  showNearbyBuses?: boolean
  onSOSClick?: () => void
  onNotificationClick?: () => void
}

interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap
  remove: () => void
  removeLayer: (layer: any) => LeafletMap
  panTo: (latLng: [number, number], options?: { animate?: boolean; duration?: number }) => LeafletMap
  fitBounds: (bounds: any, options?: { padding?: [number, number] }) => LeafletMap
  addLayer: (layer: any) => LeafletMap
  getContainer: () => HTMLElement
}

type Marker = {
  setLatLng: (latLng: [number, number] | { lat: number; lng: number }) => void
  remove: () => void
  bindPopup: (content: string) => Marker
  openPopup: () => void
  addTo: (map: LeafletMap) => Marker
}

type RouteLayer = {
  remove: () => void
  getBounds: () => any
  addTo: (map: LeafletMap) => RouteLayer
}

export function MapView({ 
  trackingBus, 
  showNearbyBuses = true,
  onSOSClick,
  onNotificationClick
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [isMapInitialized, setIsMapInitialized] = useState(false)
  const [searchRadius, setSearchRadius] = useState(2) // Default 2km radius
  
  // State for markers and layers
  const [busMarkers, setBusMarkers] = useState<Marker[]>([])
  const [stopMarkers, setStopMarkers] = useState<Marker[]>([])
  const [trackingMarker, setTrackingMarker] = useState<Marker | null>(null)
  const [routeLayer, setRouteLayer] = useState<RouteLayer | null>(null)
  const [userMarker, setUserMarker] = useState<Marker | null>(null)
  const [radiusCircle, setRadiusCircle] = useState<any>(null) // Circle to show search radius
  
  // New state for enhanced tracking
  const [isTrackingActive, setIsTrackingActive] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<BusStatus>('approaching')
  const [busRoute, setBusRoute] = useState<{ lat: number; lng: number }[]>([])
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0)
  const [busNotificationShown, setBusNotificationShown] = useState(false)
  
  // State for API data
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([])
  const [nearbyBuses, setNearbyBuses] = useState<BusData[]>([])
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null)
  const [trafficInfo, setTrafficInfo] = useState<{ condition: 'light' | 'moderate' | 'heavy'; delay: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch and display nearby bus stops (using mock data)
  const updateNearbyStops = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true)
      
      // Clear existing stop markers
      stopMarkers.forEach(marker => marker.remove())
      setStopMarkers([])
      
      const stops = await getNearbyStops(lat, lng)
      setNearbyStops(stops)
      
      // Add markers for each bus stop
      if (map && stops.length > 0) {
        const L = (window as any).L
        const newMarkers = stops.map(stop => {
          const stopIcon = L.divIcon({
            className: "custom-stop-marker",
            html: `<div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; padding: 6px 10px; border-radius: 14px; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">STOP</div>`,
            iconSize: [50, 32],
            iconAnchor: [25, 16],
          })

          return L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-3 min-w-48">
                <h3 class="font-bold text-gray-900 mb-2">${stop.name}</h3>
                <div class="space-y-2 text-sm">
                  ${stop.nextBuses.map(bus => `
                    <div class="border-t pt-2">
                      <p class="text-gray-600">Route: <span class="font-medium">${bus.routeName}</span></p>
                      <p class="text-gray-600">Arrival: <span class="font-medium">${bus.estimatedArrival}</span></p>
                    </div>
                  `).join('')}
                </div>
              </div>
            `)
        })
        
        setStopMarkers(newMarkers)
      }
    } catch (err) {
      console.error('Error loading nearby stops:', err)
      setError('Failed to load nearby bus stops')
      toast({
        title: "Error",
        description: "Failed to load nearby bus stops. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [map, stopMarkers])

  // Function to fetch and display nearby buses on the map
  const updateNearbyBuses = useCallback(async (lat: number, lng: number) => {
    if (!map) return
    
    try {
      setIsLoading(true)
      const buses = await getNearbyBuses(lat, lng, searchRadius) // Use dynamic radius
      setNearbyBuses(buses)

      // Clear existing bus markers
      busMarkers.forEach(marker => marker.remove())
      setBusMarkers([])

      if (buses.length > 0) {
        const L = (window as any).L
        const newBusMarkers: Marker[] = []

        buses.forEach((bus: BusData) => {
          // Don't show nearby bus marker if it's being tracked
          if (trackingBus && trackingBus.routeId === bus.route) return

          // Create bus icon
          const busIcon = L.divIcon({
            html: `<img src="/bus.png" style="width: 32px; height: 32px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" alt="Bus" />`,
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          })

          const marker = L.marker([bus.coordinates.lat, bus.coordinates.lng], { icon: busIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-3 min-w-[200px]">
                <h4 class="font-bold text-lg text-orange-600">${bus.route}</h4>
                <p class="text-sm text-gray-600">To: ${bus.destination}</p>
                <p class="text-sm text-gray-600">Arrival: ${bus.arrivalTime}</p>
                <p class="text-sm text-gray-600">Distance: ${bus.distance}</p>
                <p class="text-sm text-gray-500">Driver: ${bus.driverName}</p>
                <div class="mt-2 pt-2 border-t">
                  <div class="text-xs text-gray-400">Click "Track" in dashboard to follow this bus</div>
                </div>
              </div>
            `)

          newBusMarkers.push(marker)
        })

        setBusMarkers(newBusMarkers)
      }
    } catch (error) {
      console.error('Error updating nearby buses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [map, busMarkers, trackingBus, searchRadius])
  
  // Function to update the radius circle
  const updateRadiusCircle = useCallback(() => {
    if (!map || !userLocation || !showNearbyBuses) return

    // Remove existing circle
    if (radiusCircle) {
      radiusCircle.remove()
      setRadiusCircle(null)
    }

    const L = (window as any).L
    
    // Create new circle showing search radius
    const circle = L.circle([userLocation.lat, userLocation.lng], {
      radius: searchRadius * 1000, // Convert km to meters
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.1,
      weight: 2,
      opacity: 0.6,
      dashArray: '5, 5'
    }).addTo(map)

    setRadiusCircle(circle)
  }, [map, userLocation, searchRadius, showNearbyBuses, radiusCircle])

  // Update radius circle when location or radius changes
  useEffect(() => {
    updateRadiusCircle()
  }, [updateRadiusCircle])
  
  // Function to fetch and display route details (using mock data)
  const updateRouteDetails = useCallback(async (routeId: string) => {
    try {
      setIsLoading(true)
      const route = await getRouteDetails(routeId)
      setSelectedRoute(route)

      if (map && route.points.length > 0) {
        const L = (window as any).L
        const routeCoordinates = route.points.map(point => [point.latitude, point.longitude])
        
        // Remove existing route layer
        if (routeLayer) {
          routeLayer.remove()
        }

        // Create new route layer with color based on traffic
        const trafficConditions = await getTrafficConditions(
          route.points.map(point => ({ lat: point.latitude, lng: point.longitude }))
        )
        setTrafficInfo(trafficConditions)

        const routeColor = trafficConditions.condition === 'heavy' ? '#dc2626' : 
                          trafficConditions.condition === 'moderate' ? '#f97316' : 
                          '#22c55e'

        const newRouteLayer = L.polyline(routeCoordinates, {
          color: routeColor,
          weight: 4,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: trafficConditions.condition === 'heavy' ? '10, 10' : null,
        }).addTo(map)

        setRouteLayer(newRouteLayer)
        
        // Add markers for stops along the route
        route.points
          .filter(point => point.stopType !== 'waypoint')
          .forEach(point => {
            const stopIcon = L.divIcon({
              className: "custom-route-stop-marker",
              html: `<div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 6px 10px; border-radius: 14px; font-size: 11px; font-weight: 900; border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">${point.stopType === 'pickup' ? 'PICK UP' : 'DROP OFF'}</div>`,
              iconSize: [70, 32],
              iconAnchor: [35, 16],
            })

            L.marker([point.latitude, point.longitude], { icon: stopIcon })
              .addTo(map)
              .bindPopup(`
                <div class="p-3">
                  <p class="font-medium text-gray-900">${point.stopType === 'pickup' ? 'Pick-up Point' : 'Drop-off Point'}</p>
                  ${point.waitTime ? `<p class="text-sm text-gray-600">Wait time: ${point.waitTime} mins</p>` : ''}
                  ${point.distance ? `<p class="text-sm text-gray-600">Distance: ${point.distance.toFixed(1)} km</p>` : ''}
                </div>
              `)
          })

        // Fit map bounds to show entire route
        map.fitBounds(newRouteLayer.getBounds(), { padding: [50, 50] })

        // Show traffic alert if conditions are heavy
        if (trafficConditions.condition === 'heavy') {
          toast({
            title: "Heavy Traffic Alert",
            description: `Expected delay of ${trafficConditions.delay} minutes on this route.`,
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      console.error('Error loading route details:', err)
      setError('Failed to load route details')
      toast({
        title: "Error",
        description: "Failed to load route details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [map, routeLayer])

  // Initialize map when component mounts
  useEffect(() => {
    if (!userLocation || !mapRef.current || isMapInitialized) return

    const initializeMap = async () => {
      try {
        // Prevent multiple initializations
        if (isMapInitialized || !mapRef.current) return
        
        const L = (window as any).L
        
        // Clear any existing map on this container
        if ((mapRef.current as any)._leaflet_id) {
          // Container already has a map, clear it
          (mapRef.current as any)._leaflet_id = null
          mapRef.current.innerHTML = ''
        }
        
        // Create map centered on user's location
        const newMap = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 15)
        
        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          minZoom: 4,
          detectRetina: true,
          updateWhenIdle: true,
        }).addTo(newMap)
        
        setMap(newMap)
        setIsMapInitialized(true)
        
        // Add user marker
        const userIcon = L.divIcon({
          className: "custom-user-marker",
          html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })
        
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(newMap)
          .bindPopup('<div class="p-2 text-sm font-medium">Your Location</div>')
        
        setUserMarker(marker)
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    // Load Leaflet if not already loaded
    if (!(window as any).L) {
      Promise.all([
        loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
        loadStylesheet("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
      ]).then(initializeMap)
    } else {
      initializeMap()
    }
  }, [userLocation, isMapInitialized])

  // Enhanced tracking bus system with arrival simulation and smooth movement
  useEffect(() => {
    if (!map || !trackingBus || !userLocation) return

    const L = (window as any).L
    
    // Helper function to generate route points between two locations
    const generateRoutePoints = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
      const points = []
      const steps = 20 // Number of interpolation steps for smooth movement
      
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps
        const lat = start.lat + (end.lat - start.lat) * ratio
        const lng = start.lng + (end.lng - start.lng) * ratio
        
        // Add some randomness to simulate road following
        const offset = 0.001 * Math.sin(ratio * Math.PI * 4) // Creates a slight curve
        points.push({ 
          lat: lat + offset, 
          lng: lng + offset * 0.5 
        })
      }
      return points
    }
    
    // Helper function to show notification using MagicBell push notifications
    const showBusNotification = async (message: string, status: 'approaching' | 'arrived' | 'delayed' | 'departed' = 'arrived') => {
      try {
        // Send push notification using MagicBell service
        await notificationService.sendBusNotification({
          busRoute: trackingBus.route,
          busId: trackingBus.busId,
          status: status,
          estimatedTime: status === 'delayed' ? '5-7 minutes' : '2-3 minutes',
          location: status === 'departed' ? trackingBus.to || trackingBus.destination : 'your location'
        })
      } catch (error) {
        console.error('Failed to send push notification:', error)
        
        // Fallback to browser notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Bus Tracking', {
              body: message,
              icon: '/bus.png',
              badge: '/bus.png'
            })
          }
        }
      }
      
      // Also show toast notification for immediate feedback
      toast({
        title: 'Bus Update',
        description: message,
      })
    }

    let animationId: number
    let routePoints: { lat: number; lng: number }[] = []
    let currentIndex = 0
    let marker: any = null
    let routeLine: any = null

    const initializeTracking = async () => {
      // Step 1: Bus approaches user location
      const busStartLocation = {
        lat: userLocation.lat + 0.02, // Start 2km away
        lng: userLocation.lng + 0.015
      }
      
      // Step 2: Generate route from bus start to user location
      const approachingRoute = generateRoutePoints(busStartLocation, userLocation)
      
      // Step 3: Generate route from user location to destination
      const destinationLocation = trackingBus.destinationLocation || {
        lat: userLocation.lat + 0.025,
        lng: userLocation.lng - 0.02
      }
      const journeyRoute = generateRoutePoints(userLocation, destinationLocation)
      
      // Combine routes: approaching + journey
      routePoints = [...approachingRoute, ...journeyRoute]
      
      // Create tracking bus icon
      const trackingBusIcon = L.divIcon({
        html: `<img src="/bus.png" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(220,38,38,0.4)) hue-rotate(340deg) saturate(120%);" alt="Tracking Bus" />`,
        className: 'custom-div-icon tracking-bus',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      })

      // Create initial marker
      marker = L.marker([routePoints[0].lat, routePoints[0].lng], { icon: trackingBusIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-3 min-w-[220px]">
            <h4 class="font-bold text-lg text-red-600">🎯 Tracking: ${trackingBus.route}</h4>
            <p class="text-sm text-gray-600">From: ${trackingBus.from || 'Current Location'}</p>
            <p class="text-sm text-gray-600">To: ${trackingBus.to || trackingBus.destination || 'Destination'}</p>
            <p class="text-sm text-gray-600">Status: <span id="bus-status">Approaching your location</span></p>
            <div class="mt-2 text-xs text-gray-500">Live tracking active</div>
          </div>
        `)

      setTrackingMarker(marker)

      // Draw route line
      const routeLatLngs = routePoints.map(point => [point.lat, point.lng])
      routeLine = L.polyline(routeLatLngs, {
        color: '#dc2626',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5'
      }).addTo(map)
      
      setRouteLayer(routeLine)
      
      // Start animation
      animateBusMovement()
    }

    const animateBusMovement = () => {
      if (currentIndex >= routePoints.length) return

      const currentPoint = routePoints[currentIndex]
      
      // Update marker position with smooth transition
      if (marker) {
        marker.setLatLng([currentPoint.lat, currentPoint.lng])
        
        // Update popup status
        const isNearUser = currentIndex < routePoints.length / 2
        const isAtUser = currentIndex === Math.floor(routePoints.length / 2)
        const isDeparted = currentIndex > Math.floor(routePoints.length / 2)
        
        if (isAtUser && !busNotificationShown) {
          showBusNotification(`Your bus ${trackingBus.route} has arrived at your location!`, 'arrived')
          setBusNotificationShown(true)
          setTrackingStatus('arrived')
          
          // Update popup status
          const statusElement = document.getElementById('bus-status')
          if (statusElement) {
            statusElement.textContent = 'Arrived at your location'
            statusElement.style.color = '#059669'
          }
          
          // Wait 3 seconds before departing
          setTimeout(() => {
            setTrackingStatus('en_route')
            if (statusElement) {
              statusElement.textContent = 'En route to destination'
              statusElement.style.color = '#dc2626'
            }
          }, 3000)
        } else if (isNearUser) {
          setTrackingStatus('approaching')
        } else if (isDeparted) {
          setTrackingStatus('en_route')
        }
      }

      currentIndex++
      
      // Continue animation
      animationId = requestAnimationFrame(() => {
        setTimeout(animateBusMovement, 200) // Smooth 200ms intervals
      })
    }

    // Initialize tracking
    initializeTracking()

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (marker) {
        marker.remove()
      }
      if (routeLine) {
        routeLine.remove()
      }
    }
  }, [map, trackingBus, userLocation, onNotificationClick, busNotificationShown])

  // Simulate random bus delays for demonstration
  useEffect(() => {
    if (!trackingBus) return

    const delayInterval = setInterval(() => {
      // 20% chance of delay notification
      if (Math.random() < 0.2) {
        const delayMinutes = Math.floor(Math.random() * 10) + 5 // 5-15 minutes delay
        showBusNotification(
          `Your bus ${trackingBus.route} is running ${delayMinutes} minutes late due to traffic conditions.`,
          'delayed'
        )
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(delayInterval)
  }, [trackingBus])

  // Update nearby buses display on map
  useEffect(() => {
    if (userLocation && map && showNearbyBuses) {
      updateNearbyBuses(userLocation.lat, userLocation.lng)
    }
  }, [userLocation, map, showNearbyBuses, updateNearbyBuses, searchRadius])

  // Get user's location and set up location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      // Get initial location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(newLocation)
        },
        (error) => {
          console.error("Error getting location:", error)
          setUserLocation({ lat: 12.9716, lng: 77.5946 }) // Default to Bangalore
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
      
      // Set up continuous location tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (userMarker) {
            const newPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            userMarker.setLatLng(newPos)
            setUserLocation(newPos)
          }
        },
        (error) => {
          console.error("Error watching location:", error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
      
      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [userMarker])

  // Reset map state when component unmounts
  useEffect(() => {
    return () => {
      // Reset initialization state to allow remounting
      setIsMapInitialized(false)
      setMap(null)
      setBusMarkers([])
      setStopMarkers([])
      setTrackingMarker(null)
      setRouteLayer(null)
      setUserMarker(null)
      setRadiusCircle(null)
    }
  }, [])

  // Bus movement animation effect
  useEffect(() => {
    if (!showNearbyBuses || busMarkers.length === 0 || !userLocation) return

    const moveInterval = setInterval(() => {
      busMarkers.forEach((marker, index) => {
        const currentLatLng = marker.getLatLng()
        
        // Generate small random movement (simulate bus movement)
        const moveDistance = 0.0005 // About 50 meters
        const randomDirection = Math.random() * 2 * Math.PI
        
        const newLat = currentLatLng.lat + (Math.cos(randomDirection) * moveDistance)
        const newLng = currentLatLng.lng + (Math.sin(randomDirection) * moveDistance)
        
        // Ensure buses don't move too far from user location (keep within 5km)
        const distanceFromUser = Math.sqrt(
          Math.pow(newLat - userLocation.lat, 2) + Math.pow(newLng - userLocation.lng, 2)
        )
        
        if (distanceFromUser < 0.045) { // About 5km in degrees
          // Smooth animation transition
          marker.setLatLng([newLat, newLng])
        }
      })
    }, 3000) // Move every 3 seconds

    return () => clearInterval(moveInterval)
  }, [busMarkers, showNearbyBuses, userLocation])

  // Cleanup function
  useEffect(() => {
    return () => {
      try {
        // Clean up all markers and layers safely
        if (userMarker) {
          userMarker.remove()
        }
        if (busMarkers && busMarkers.length > 0) {
          busMarkers.forEach(marker => {
            try {
              marker.remove()
            } catch (error) {
              console.warn('Error removing bus marker:', error)
            }
          })
        }
        if (stopMarkers && stopMarkers.length > 0) {
          stopMarkers.forEach(marker => {
            try {
              marker.remove()
            } catch (error) {
              console.warn('Error removing stop marker:', error)
            }
          })
        }
        if (trackingMarker) {
          try {
            trackingMarker.remove()
          } catch (error) {
            console.warn('Error removing tracking marker:', error)
          }
        }
        if (routeLayer) {
          try {
            routeLayer.remove()
          } catch (error) {
            console.warn('Error removing route layer:', error)
          }
        }
        if (radiusCircle) {
          try {
            radiusCircle.remove()
          } catch (error) {
            console.warn('Error removing radius circle:', error)
          }
        }

        // Remove the map instance if it exists and is still connected
        if (map && mapRef.current && mapRef.current.parentNode) {
          try {
            map.remove()
          } catch (error) {
            console.warn('Error removing map:', error)
          }
        }
      } catch (error) {
        console.warn('Error during map cleanup:', error)
      }
    }
  }, [])

  // Helper function to load external scripts
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject()
      document.head.appendChild(script)
    })
  }

  // Helper function to load external stylesheets
  const loadStylesheet = (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = () => resolve()
      link.onerror = () => reject()
      document.head.appendChild(link)
    })
  }

  return (
    <div className="relative w-full">
      {/* Notification Button - Left side on desktop, top on mobile */}
      <Button 
        size="sm" 
        variant="secondary" 
        className="absolute top-2 left-2 z-[1000] shadow-lg bg-white hover:bg-orange-50 h-8 p-2 flex items-center gap-1 border-2 border-gray-200 md:left-2 max-md:right-16"
        onClick={onNotificationClick}
        style={{ position: 'absolute', zIndex: 1000 }}
      >
        <Bell className="w-4 h-4 text-orange-600" />
        <span className="text-orange-600 hidden sm:inline">Alerts</span>
      </Button>

      {/* SOS Button - Right side on desktop, below alerts on mobile */}
      <Button 
        size="sm" 
        variant="destructive" 
        className="absolute top-2 right-2 z-[1000] shadow-lg flex items-center gap-1 font-medium bg-red-600 hover:bg-red-700 text-white border-2 border-white md:right-2 max-md:top-12 max-md:right-2"
        onClick={onSOSClick}
        style={{ position: 'absolute', zIndex: 1000 }}
      >
        <AlertTriangle className="w-4 h-4" />
        SOS
      </Button>

      {/* Radius Control - Only show when displaying nearby buses */}
      {showNearbyBuses && (
        <div className="absolute top-12 right-2 z-50 bg-white rounded-lg shadow-md border border-gray-200 p-2 md:top-12 max-md:top-20">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span className="text-gray-700 whitespace-nowrap">Radius:</span>
            <select 
              value={searchRadius} 
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={1}>1km</option>
              <option value={2}>2km</option>
              <option value={3}>3km</option>
              <option value={5}>5km</option>
            </select>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className={`relative overflow-hidden transition-all duration-300 rounded-lg border-2 border-orange-200 ${
          isFullscreen ? "fixed inset-4 z-50 h-auto" : "h-48 md:h-64 lg:h-80"
        }`}
      >
        {/* Map Controls */}
        <div className="absolute bottom-2 right-2 flex flex-col space-y-2 z-10">
          <Button 
            size="sm" 
            variant="secondary" 
            className="shadow-md bg-white hover:bg-orange-50 h-8 w-8 p-0"
            onClick={() => userLocation && map?.setView([userLocation.lat, userLocation.lng], 15)}
          >
            <Navigation className="w-4 h-4 text-orange-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="shadow-md bg-white hover:bg-orange-50 h-8 w-8 p-0"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-4 h-4 text-orange-600" />
          </Button>
        </div>

        {isFullscreen && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 left-20 shadow-md bg-white hover:bg-orange-50 h-8 w-8 p-0 z-10"
            onClick={() => setIsFullscreen(false)}
          >
            <span className="text-orange-600">✕</span>
          </Button>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <p className="text-sm font-medium">Loading...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom CSS for smooth tracking bus animations */}
      <style jsx>{`
        .tracking-bus {
          transition: all 0.2s ease-out !important;
          animation: busMoving 2s ease-in-out infinite alternate;
        }
        
        @keyframes busMoving {
          0% { 
            transform: translateY(0px);
            filter: drop-shadow(0 4px 8px rgba(220,38,38,0.4)) hue-rotate(340deg) saturate(120%);
          }
          100% { 
            transform: translateY(-2px);
            filter: drop-shadow(0 6px 12px rgba(220,38,38,0.6)) hue-rotate(340deg) saturate(130%);
          }
        }
        
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  )
}