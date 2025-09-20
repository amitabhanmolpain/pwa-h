import { BusType } from '@/types/schedule'

export interface Driver {
  id: string
  name: string
  phone: string
  rating: number
  totalTrips: number
  verified: boolean
}

export interface Bus {
  id: string
  route: string
  from: string
  to: string
  departure: string
  arrival: string
  seatsAvailable: number
  totalSeats: number
  speed: string
  hasWomenConductor: boolean
  womenSeats: number
  image: string
  driver: Driver
  type: BusType
  price: string
  busCategory: string
  currentLocation?: {
    lat: number
    lng: number
  }
}

export interface SearchParams {
  from?: string
  to?: string
  busId?: string
  womenOnly?: boolean
  busType?: BusType | 'all'
}

// Mock drivers data
const mockDrivers: Driver[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    rating: 4.8,
    totalTrips: 1250,
    verified: true
  },
  {
    id: "2", 
    name: "Suresh Reddy",
    phone: "+91 98765 43211",
    rating: 4.6,
    totalTrips: 980,
    verified: true
  },
  {
    id: "3",
    name: "Manjunath S",
    phone: "+91 98765 43212", 
    rating: 4.9,
    totalTrips: 1450,
    verified: true
  },
  {
    id: "4",
    name: "Venkatesh M",
    phone: "+91 98765 43213",
    rating: 4.7,
    totalTrips: 890,
    verified: true
  },
  {
    id: "5",
    name: "Prakash N",
    phone: "+91 98765 43214",
    rating: 4.5,
    totalTrips: 750,
    verified: false
  }
];

// Mock buses data
const mockBuses: Bus[] = [
  {
    id: "1",
    route: "Route 45A",
    from: "Bangalore Central",
    to: "Electronic City",
    departure: "07:30 AM",
    arrival: "09:15 AM",
    seatsAvailable: 12,
    totalSeats: 40,
    speed: "45 km/h",
    hasWomenConductor: true,
    womenSeats: 8,
    image: "/bangalore-volvo-bus-orange-grey.jpg",
    driver: mockDrivers[0],
    type: "intercity",
    price: "₹85",
    busCategory: "AC Volvo",
    currentLocation: { lat: 12.9716, lng: 77.5946 }
  },
  {
    id: "2",
    route: "Route 12B",
    from: "Koramangala",
    to: "MG Road",
    departure: "08:00 AM", 
    arrival: "08:45 AM",
    seatsAvailable: 3,
    totalSeats: 45,
    speed: "32 km/h",
    hasWomenConductor: false,
    womenSeats: 6,
    image: "/bangalore-bmtc-bus-orange-grey.jpg",
    driver: mockDrivers[1],
    type: "cityToCity",
    price: "₹25",
    busCategory: "Regular",
    currentLocation: { lat: 12.9352, lng: 77.6245 }
  },
  {
    id: "3",
    route: "Route 23C",
    from: "Banashankari",
    to: "Whitefield",
    departure: "09:00 AM",
    arrival: "11:30 AM",
    seatsAvailable: 18,
    totalSeats: 42,
    speed: "38 km/h",
    hasWomenConductor: true,
    womenSeats: 8,
    image: "/bangalore-city-bus-orange-grey.jpg",
    driver: mockDrivers[2],
    type: "intercity",
    price: "₹120",
    busCategory: "Semi-AC",
    currentLocation: { lat: 12.9255, lng: 77.5468 }
  },
  {
    id: "4",
    route: "Route 67D",
    from: "Indiranagar",
    to: "Banashankari",
    departure: "10:15 AM",
    arrival: "11:45 AM",
    seatsAvailable: 25,
    totalSeats: 50,
    speed: "42 km/h",
    hasWomenConductor: false,
    womenSeats: 6,
    image: "/bangalore-intercity-bus-orange-grey.jpg",
    driver: mockDrivers[3],
    type: "cityToCity",
    price: "₹35",
    busCategory: "Regular",
    currentLocation: { lat: 12.9784, lng: 77.6408 }
  },
  {
    id: "5",
    route: "Route 89E",
    from: "Electronic City",
    to: "Koramangala",
    departure: "11:30 AM",
    arrival: "12:45 PM",
    seatsAvailable: 5,
    totalSeats: 38,
    speed: "35 km/h",
    hasWomenConductor: true,
    womenSeats: 8,
    image: "/bangalore-public-bus-orange-grey.jpg",
    driver: mockDrivers[4],
    type: "cityToCity",
    price: "₹30",
    busCategory: "Regular",
    currentLocation: { lat: 12.8438, lng: 77.6606 }
  },
  {
    id: "6",
    route: "Route 156F",
    from: "Whitefield",
    to: "Indiranagar",
    departure: "02:00 PM",
    arrival: "03:30 PM",
    seatsAvailable: 20,
    totalSeats: 44,
    speed: "40 km/h",
    hasWomenConductor: true,
    womenSeats: 8,
    image: "/bangalore-metro-feeder-bus.jpg",
    driver: mockDrivers[0],
    type: "intercity",
    price: "₹95",
    busCategory: "AC",
    currentLocation: { lat: 12.9698, lng: 77.7500 }
  }
];

export async function searchAvailableBuses(params: SearchParams): Promise<Bus[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let filteredBuses = [...mockBuses];
    
    // Filter by from location
    if (params.from) {
      filteredBuses = filteredBuses.filter(bus => 
        bus.from.toLowerCase().includes(params.from!.toLowerCase())
      );
    }
    
    // Filter by to location
    if (params.to) {
      filteredBuses = filteredBuses.filter(bus => 
        bus.to.toLowerCase().includes(params.to!.toLowerCase())
      );
    }
    
    // Filter by bus ID
    if (params.busId) {
      filteredBuses = filteredBuses.filter(bus => bus.id === params.busId);
    }
    
    // Filter by women-only requirements
    if (params.womenOnly) {
      filteredBuses = filteredBuses.filter(bus => 
        bus.hasWomenConductor && bus.womenSeats > 0
      );
    }
    
    // Filter by bus type
    if (params.busType && params.busType !== 'all') {
      filteredBuses = filteredBuses.filter(bus => bus.type === params.busType);
    }
    
    return filteredBuses;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to search buses: ' + message)
  }
}

export async function getRouteDrivers(route: string): Promise<Driver[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Filter drivers based on route (simplified matching)
    const routeDrivers = mockDrivers.filter(driver => 
      mockBuses.some(bus => bus.route === route && bus.driver.id === driver.id)
    );
    
    return routeDrivers.length > 0 ? routeDrivers : [mockDrivers[0]]; // Return at least one driver
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to fetch route drivers: ' + message)
  }
}

export async function getNearbyDrivers(lat: number, lng: number, radius: number = 5): Promise<Driver[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return random subset of drivers as "nearby" (simplified for demo)
    const shuffled = [...mockDrivers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(3, shuffled.length));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to fetch nearby drivers: ' + message)
  }
}