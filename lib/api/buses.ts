import { BusData, SeatOccupancyData } from "@/types/buses"

// Mock bus data
const mockBusData: BusData[] = [
  {
    id: "1",
    route: "Route 45A",
    destination: "Electronic City",
    from: "Bangalore Central",
    to: "Electronic City",
    arrivalTime: "2 min",
    speed: "45 km/h",
    distance: "0.8 km",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43210",
    image: "/bangalore-volvo-bus-orange-grey.jpg",
    hasWomenConductor: true,
    womenSeats: 8,
    coordinates: { lat: 12.9716, lng: 77.5946 }
  },
  {
    id: "2",
    route: "Route 12B",
    destination: "MG Road",
    from: "Bangalore Central",
    to: "MG Road",
    arrivalTime: "5 min",
    speed: "32 km/h",
    distance: "1.2 km",
    driverName: "Suresh Reddy",
    driverPhone: "+91 98765 43211",
    image: "/bangalore-bmtc-bus-orange-grey.jpg",
    hasWomenConductor: false,
    womenSeats: 6,
    coordinates: { lat: 12.9752, lng: 77.6095 }
  },
  {
    id: "3",
    route: "Route 23C",
    destination: "Whitefield",
    from: "Bangalore Central",
    to: "Whitefield",
    arrivalTime: "7 min",
    speed: "38 km/h",
    distance: "1.5 km",
    driverName: "Manjunath S",
    driverPhone: "+91 98765 43212",
    image: "/bangalore-city-bus-orange-grey.jpg",
    hasWomenConductor: true,
    womenSeats: 8,
    coordinates: { lat: 12.9698, lng: 77.7500 }
  },
  {
    id: "4",
    route: "Route 67D",
    destination: "Banashankari",
    from: "Bangalore Central",
    to: "Banashankari",
    arrivalTime: "10 min",
    speed: "42 km/h",
    distance: "1.8 km",
    driverName: "Venkatesh M",
    driverPhone: "+91 98765 43213",
    image: "/bangalore-intercity-bus-orange-grey.jpg",
    hasWomenConductor: false,
    womenSeats: 6,
    coordinates: { lat: 12.9255, lng: 77.5468 }
  },
  {
    id: "5",
    route: "Route 89E",
    destination: "Koramangala",
    from: "Bangalore Central",
    to: "Koramangala",
    arrivalTime: "12 min",
    speed: "35 km/h",
    distance: "2.0 km",
    driverName: "Prakash N",
    driverPhone: "+91 98765 43214",
    image: "/bangalore-public-bus-orange-grey.jpg",
    hasWomenConductor: true,
    womenSeats: 8,
    coordinates: { lat: 12.9352, lng: 77.6245 }
  },
  {
    id: "6",
    route: "Route 156F",
    destination: "Indiranagar",
    from: "Bangalore Central",
    to: "Indiranagar",
    arrivalTime: "15 min",
    speed: "40 km/h",
    distance: "2.2 km",
    driverName: "Ravi Kumar",
    driverPhone: "+91 98765 43215",
    image: "/bangalore-metro-feeder-bus.jpg",
    hasWomenConductor: true,
    womenSeats: 8,
    coordinates: { lat: 12.9784, lng: 77.6408 }
  },
];

// Mock seat occupancy data
const mockSeatOccupancyData: Record<string, SeatOccupancyData> = {
  "1": {
    busId: "1",
    totalSeats: 40,
    occupiedSeats: 10,
    womenSeatsOccupied: 2,
    lastUpdated: new Date().toISOString(),
  },
  "2": {
    busId: "2",
    totalSeats: 45,
    occupiedSeats: 35,
    womenSeatsOccupied: 5,
    lastUpdated: new Date().toISOString(),
  },
  "3": {
    busId: "3",
    totalSeats: 42,
    occupiedSeats: 20,
    womenSeatsOccupied: 3,
    lastUpdated: new Date().toISOString(),
  },
  "4": {
    busId: "4",
    totalSeats: 50,
    occupiedSeats: 12,
    womenSeatsOccupied: 1,
    lastUpdated: new Date().toISOString(),
  },
  "5": {
    busId: "5",
    totalSeats: 38,
    occupiedSeats: 30,
    womenSeatsOccupied: 6,
    lastUpdated: new Date().toISOString(),
  },
  "6": {
    busId: "6",
    totalSeats: 44,
    occupiedSeats: 15,
    womenSeatsOccupied: 2,
    lastUpdated: new Date().toISOString(),
  },
};

export async function getNearbyBuses(lat: number, lng: number, radius: number = 2): Promise<BusData[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Always include some nearby buses for demo purposes
    let nearbyBuses = mockBusData.filter(bus => {
      // Calculate distance using Haversine formula for better accuracy
      const R = 6371; // Earth's radius in kilometers
      const dLat = (bus.coordinates.lat - lat) * Math.PI / 180;
      const dLng = (bus.coordinates.lng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(bus.coordinates.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km
      
      return distance <= radius;
    });
    
    // If no buses found within radius, add some buses at different distances within 3km
    if (nearbyBuses.length === 0 || nearbyBuses.length < 3) {
      // Create more buses at different distances and directions from user location
      const syntheticBuses = [
        {
          ...mockBusData[0],
          id: "nearby_1",
          coordinates: { 
            lat: lat + 0.009, // ~1km north
            lng: lng 
          },
          distance: "1.0 km",
          arrivalTime: "3 min"
        },
        {
          ...mockBusData[1],
          id: "nearby_2",
          coordinates: { 
            lat: lat - 0.018, // ~2km south
            lng: lng + 0.009 
          },
          distance: "2.1 km",
          arrivalTime: "6 min"
        },
        {
          ...mockBusData[2],
          id: "nearby_3",
          coordinates: { 
            lat: lat + 0.027, // ~3km northeast
            lng: lng + 0.018 
          },
          distance: "2.8 km",
          arrivalTime: "8 min"
        },
        {
          ...mockBusData[3],
          id: "nearby_4",
          coordinates: { 
            lat: lat - 0.009, // ~1km southwest
            lng: lng - 0.012 
          },
          distance: "1.5 km",
          arrivalTime: "4 min"
        },
        {
          ...mockBusData[4],
          id: "nearby_5",
          coordinates: { 
            lat: lat + 0.005, // ~0.5km northwest
            lng: lng - 0.007 
          },
          distance: "0.8 km",
          arrivalTime: "2 min"
        },
        {
          ...mockBusData[5],
          id: "nearby_6",
          coordinates: { 
            lat: lat + 0.014, // ~1.5km east
            lng: lng + 0.020 
          },
          distance: "1.8 km",
          arrivalTime: "5 min"
        }
      ];
      nearbyBuses = syntheticBuses;
    }
    
    // Update distances and arrival times based on user location
    const busesWithUpdatedDistance = nearbyBuses.map((bus, index) => {
      // Calculate distance using Haversine formula for accuracy
      const R = 6371; // Earth's radius in kilometers
      const dLat = (bus.coordinates.lat - lat) * Math.PI / 180;
      const dLng = (bus.coordinates.lng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(bus.coordinates.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in km
      
      // Simulate realistic arrival times based on distance (2-3 mins per km in city traffic)
      const baseTime = Math.max(1, Math.floor(distance * 2.5) + Math.floor(Math.random() * 3));
      
      return {
        ...bus,
        distance: `${distance.toFixed(1)} km`,
        arrivalTime: `${baseTime} min`
      };
    });
    
    // Sort by arrival time to show closest buses first
    busesWithUpdatedDistance.sort((a, b) => {
      const timeA = parseInt(a.arrivalTime.replace(" min", ""));
      const timeB = parseInt(b.arrivalTime.replace(" min", ""));
      return timeA - timeB;
    });
    
    return busesWithUpdatedDistance;
  } catch (error) {
    console.error('Error in getNearbyBuses:', error);
    // Return default buses as fallback
    return mockBusData.slice(0, 3);
  }
}

export async function getBusSeatOccupancy(busId: string): Promise<SeatOccupancyData> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const occupancyData = mockSeatOccupancyData[busId];
    if (!occupancyData) {
      throw new Error('Bus not found');
    }
    
    return {
      ...occupancyData,
      lastUpdated: new Date().toISOString(), // Always return current time
    };
  } catch (error) {
    console.error('Error fetching bus occupancy:', error)
    return {
      busId: '',
      totalSeats: 0,
      occupiedSeats: 0,
      womenSeatsOccupied: 0,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export async function updateBusSeatOccupancy(
  busId: string, 
  data: Partial<SeatOccupancyData>
): Promise<SeatOccupancyData> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update mock data
    if (mockSeatOccupancyData[busId]) {
      mockSeatOccupancyData[busId] = {
        ...mockSeatOccupancyData[busId],
        ...data,
        lastUpdated: new Date().toISOString(),
      };
      return mockSeatOccupancyData[busId];
    } else {
      throw new Error('Bus not found');
    }
  } catch (error) {
    console.error('Error updating bus occupancy:', error)
    throw error
  }
}

export function calculateCrowdingStatus(occupancyData: SeatOccupancyData): {
  status: 'Available' | 'Half Full' | 'Nearly Full' | 'Crowded',
  color: string
} {
  const occupancyPercentage = (occupancyData.occupiedSeats / occupancyData.totalSeats) * 100

  if (occupancyPercentage <= 25) {
    return { status: 'Available', color: 'bg-green-500' }
  } else if (occupancyPercentage <= 50) {
    return { status: 'Half Full', color: 'bg-yellow-500' }
  } else if (occupancyPercentage <= 75) {
    return { status: 'Nearly Full', color: 'bg-orange-500' }
  } else {
    return { status: 'Crowded', color: 'bg-red-500' }
  }
}