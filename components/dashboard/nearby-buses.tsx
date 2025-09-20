"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Clock, ChevronLeft, ChevronRight, Navigation, Info, MapPin, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { getNearbyBuses, getBusSeatOccupancy, calculateCrowdingStatus } from "@/lib/api/buses"
import type { BusData, SeatOccupancyData } from "@/types/buses"

const popularDestinations = [
  {
    name: "MG Road",
    coordinates: { lat: 12.9752, lng: 77.6095 }
  },
  {
    name: "Electronic City",
    coordinates: { lat: 12.8438, lng: 77.6606 }
  },
  {
    name: "Banashankari",
    coordinates: { lat: 12.9255, lng: 77.5468 }
  },
  {
    name: "Whitefield",
    coordinates: { lat: 12.9698, lng: 77.7500 }
  },
  {
    name: "Koramangala",
    coordinates: { lat: 12.9352, lng: 77.6245 }
  },
  {
    name: "Indiranagar",
    coordinates: { lat: 12.9784, lng: 77.6408 }
  }
];

interface NearbyBusesProps {
  onBusSelect?: (bus: BusData & { seatOccupancy: SeatOccupancyData }) => void
  onTrackBus?: (bus: BusData & { seatOccupancy: SeatOccupancyData }) => void
}

export function NearbyBuses({ onBusSelect, onTrackBus }: NearbyBusesProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [nearbyBuses, setNearbyBuses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [locationName, setLocationName] = useState<string>("your location")

  // Get user's current location and initialize buses
  useEffect(() => {
    setIsLoading(true);
    
    const initializeBuses = async () => {
      // Always fetch some nearby buses first
      try {
        // Default location (Bangalore center) to ensure buses always show
        const defaultBuses = await getNearbyBuses(12.9716, 77.5946, 10);
        if (defaultBuses.length > 0) {
          const busesWithOccupancy = await Promise.all(
            defaultBuses.slice(0, 6).map(async (bus) => {
              try {
                const occupancy = await getBusSeatOccupancy(bus.id);
                const crowdingStatus = calculateCrowdingStatus(occupancy);
                return {
                  ...bus,
                  seatOccupancy: {
                    ...occupancy,
                    crowdingStatus,
                  },
                };
              } catch (error) {
                return {
                  ...bus,
                  seatOccupancy: {
                    busId: bus.id,
                    totalSeats: 45,
                    occupiedSeats: Math.floor(Math.random() * 30) + 5,
                    womenSeatsOccupied: Math.floor(Math.random() * 5) + 1,
                    lastUpdated: new Date().toISOString(),
                    crowdingStatus: "Light" as const,
                  },
                };
              }
            })
          );
          setNearbyBuses(busesWithOccupancy);
        }
      } catch (error) {
        console.error("Error initializing buses:", error);
      }
      
      setIsLoading(false);
    };
    
    // Initialize buses immediately
    initializeBuses();
    
    // Then try to get user location for more accurate results
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // Mock location name generation
          const mockLocationNames = [
            "MG Road", "Brigade Road", "Koramangala", "Indiranagar", 
            "Whitefield", "Electronic City", "Banashankari", "Jayanagar",
            "HSR Layout", "BTM Layout", "Marathahalli", "Bellandur"
          ]
          
          // Simulate API delay and set random location name
          setTimeout(() => {
            const randomLocation = mockLocationNames[Math.floor(Math.random() * mockLocationNames.length)]
            setLocationName(randomLocation)
          }, 500)
        },
        (error) => {
          console.error("Error getting location:", error);
          // Keep default location and buses
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
          setLocationName("Bangalore");
        }
      );
    } else {
      // Geolocation not supported - keep default
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
      setLocationName("Bangalore");
    }
  }, []);

  // Fetch nearby buses from mock data
  useEffect(() => {
    const fetchNearbyBuses = async () => {
      try {
        let buses;
        
        if (userLocation) {
          // Try to fetch buses within 2km radius (using mock data)
          buses = await getNearbyBuses(userLocation.lat, userLocation.lng, 2);
        }
        
        // If no buses found nearby or no location, show default nearby buses
        if (!buses || buses.length === 0) {
          buses = await getNearbyBuses(12.9716, 77.5946, 10); // Larger radius around Bangalore center
        }
        
        // If still no buses (which shouldn't happen with mock data), add some default ones
        if (!buses || buses.length === 0) {
          buses = [
            {
              id: "default-1",
              route: "Route 45A",
              destination: "Electronic City",
              from: "MG Road",
              to: "Electronic City",
              arrivalTime: "3 min",
              speed: "45 km/h",
              distance: "0.5 km",
              driverName: "Rajesh Kumar",
              driverPhone: "+91 98765 43210",
              image: "/bangalore-volvo-bus-orange-grey.jpg",
              hasWomenConductor: true,
              womenSeats: 8,
              coordinates: { lat: 12.9716, lng: 77.5946 }
            },
            {
              id: "default-2", 
              route: "Route 12B",
              destination: "Whitefield",
              from: "Brigade Road",
              to: "Whitefield",
              arrivalTime: "6 min",
              speed: "35 km/h", 
              distance: "0.8 km",
              driverName: "Suresh Reddy",
              driverPhone: "+91 98765 43211",
              image: "/bangalore-bmtc-bus-orange-grey.jpg",
              hasWomenConductor: false,
              womenSeats: 6,
              coordinates: { lat: 12.9752, lng: 77.6095 }
            },
            {
              id: "default-3",
              route: "Route 23C", 
              destination: "Koramangala",
              from: "Indiranagar",
              to: "Koramangala",
              arrivalTime: "8 min",
              speed: "32 km/h",
              distance: "1.2 km", 
              driverName: "Manjunath S",
              driverPhone: "+91 98765 43212",
              image: "/bangalore-city-bus-orange-grey.jpg",
              hasWomenConductor: true,
              womenSeats: 8,
              coordinates: { lat: 12.9698, lng: 77.7500 }
            }
          ];
        }
        
        // Get occupancy data for each bus
        const busesWithOccupancy = await Promise.all(
          buses.map(async (bus) => {
            try {
              const occupancy = await getBusSeatOccupancy(bus.id);
              const crowdingStatus = calculateCrowdingStatus(occupancy);
              
              return {
                ...bus,
                seatOccupancy: {
                  ...occupancy,
                  crowdingStatus,
                },
              };
            } catch (error) {
              // If occupancy data fails, provide default occupancy
              return {
                ...bus,
                seatOccupancy: {
                  busId: bus.id,
                  totalSeats: 45,
                  occupiedSeats: Math.floor(Math.random() * 30) + 5, // Random 5-35 occupied
                  womenSeatsOccupied: Math.floor(Math.random() * 5) + 1,
                  lastUpdated: new Date().toISOString(),
                  crowdingStatus: "Light" as const,
                },
              };
            }
          })
        );
        
        // Sort by arrival time
        busesWithOccupancy.sort((a, b) => {
          const timeA = parseInt(a.arrivalTime.replace(" min", ""));
          const timeB = parseInt(b.arrivalTime.replace(" min", ""));
          return timeA - timeB;
        });
        
        setNearbyBuses(busesWithOccupancy);
      } catch (error) {
        console.error("Error fetching nearby buses:", error);
        toast({
          title: "Error",
          description: "Failed to load nearby buses. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchNearbyBuses();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(fetchNearbyBuses, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [userLocation]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const busesPerPage = isMobile ? 1 : 3
  const totalPages = nearbyBuses.length > 0 ? Math.ceil(nearbyBuses.length / busesPerPage) : 0
  const currentBuses = nearbyBuses.slice(currentPage * busesPerPage, (currentPage + 1) * busesPerPage)

  const nextPage = () => {
    if (totalPages > 0) {
      setCurrentPage((prev) => (prev + 1) % totalPages)
    }
  }

  const prevPage = () => {
    if (totalPages > 0) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
    }
  }

  const handleBusInfo = (bus: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBus(bus)
    onBusSelect?.(bus)
  }

  const handleTrackBus = (bus: any, e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Tracking Bus",
      description: `You are now tracking ${bus.route} - ${bus.destination}. Speed: ${bus.speed}, Seats: ${bus.seatsAvailable}`,
    })
    onTrackBus?.(bus)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Nearby Buses</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevPage}
            className="p-1 h-8 w-8 md:opacity-0 md:hover:opacity-100 transition-opacity"
            disabled={totalPages <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextPage}
            className="p-1 h-8 w-8 md:opacity-0 md:hover:opacity-100 transition-opacity"
            disabled={totalPages <= 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-orange-200 mb-2"></div>
            <div className="h-4 w-32 bg-orange-100 rounded"></div>
            <div className="mt-2 text-sm text-gray-500">Finding buses near you...</div>
          </div>
        </div>
      ) : nearbyBuses.length === 0 ? (
        <div className="py-8 text-center">
          <MapPin className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-gray-600">No buses found nearby at the moment.</p>
          <p className="text-sm text-gray-500 mt-1">Try again later or change your location.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentBuses.map((bus: any) => (
              <div key={bus.id} className="relative">
                <div className="relative w-full h-40 md:h-32 rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={bus.image || "/placeholder.svg?height=128&width=192&query=bangalore bus"}
                    alt={`${bus.route} bus`}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="font-semibold text-white text-sm">{bus.route}</p>
                      <p className="text-xs text-gray-200 truncate">{bus.destination}</p>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-200" />
                          <span className="text-sm font-medium text-white">{bus.arrivalTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-gray-200" />
                          <div className={`w-2 h-2 rounded-full ${bus.seatOccupancy.crowdingStatus.color}`}></div>
                          <span className="text-xs text-gray-200">{bus.seatOccupancy.crowdingStatus.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0 bg-white hover:bg-gray-100"
                      onClick={(e) => handleBusInfo(bus, e)}
                    >
                      <Info className="w-3 h-3 text-gray-900" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 w-6 p-0 bg-orange-500 hover:bg-orange-600"
                      onClick={(e) => handleTrackBus(bus, e)}
                    >
                      <Navigation className="w-3 h-3 text-white" />
                    </Button>
                  </div>
                </div>

                              {selectedBus?.id === bus.id && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{bus.route}</span>
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1"
                          onClick={(e) => handleTrackBus(bus, e)}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Track
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">{bus.destination}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Speed:</span>
                          <span className="ml-1 font-medium">{bus.speed}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Available Seats:</span>
                          <span className="ml-1 font-medium">
                            {bus.seatOccupancy.totalSeats - bus.seatOccupancy.occupiedSeats}
                            <span className="text-gray-400">/{bus.seatOccupancy.totalSeats}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Driver:</span>
                          <span className="ml-1 font-medium">{bus.driverName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">ETA:</span>
                          <span className="ml-1 font-medium">{bus.arrivalTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Distance:</span>
                          <span className="ml-1 font-medium">{bus.distance}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="ml-1 font-medium">
                            {new Date(bus.seatOccupancy.lastUpdated).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2">
                        {bus.hasWomenConductor && (
                          <div className="text-pink-600">
                            ✓ Women conductor | {bus.womenSeats - bus.seatOccupancy.womenSeatsOccupied} women seats available
                          </div>
                        )}
                        <div className={`flex items-center gap-1 ${bus.seatOccupancy.crowdingStatus.color.replace('bg-', 'text-')}`}>
                          <Users className="w-3 h-3" />
                          <span>{bus.seatOccupancy.crowdingStatus.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
