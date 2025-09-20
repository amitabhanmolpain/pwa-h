export type BusType = 'intercity' | 'village' | 'cityToCity'

export interface Schedule {
  route: string
  time: string
  destination: string
  type: BusType
  frequency: string
}

export interface ScheduleRequest {
  from: string
  to: string
  date: string
  time: string
  busType: BusType
}

export interface CalendarDay {
  date: string
  hasSchedule: boolean
  busTypes: BusType[]
}