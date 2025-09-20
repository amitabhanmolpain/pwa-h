export interface BusData {
  id: string
  route: string
  destination: string
  from: string
  to: string
  speed: string
  arrivalTime: string
  distance: string
  driverName: string
  driverPhone: string
  hasWomenConductor: boolean
  womenSeats: number
  image: string
  coordinates: {
    lat: number
    lng: number
  }
}

export interface SeatOccupancyData {
  busId: string
  totalSeats: number
  occupiedSeats: number
  womenSeatsOccupied: number
  lastUpdated: string  // ISO date string
  crowdingStatus?: {
    status: 'Available' | 'Half Full' | 'Nearly Full' | 'Crowded'
    color: string
  }
}

export interface NearbyBusResponse extends BusData {
  seatOccupancy: SeatOccupancyData
}