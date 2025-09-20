import { BusType } from '@/types/schedule'

// Types for API requests and responses
export interface DateRequest {
  from: string
  to: string
  date: string
  time: string
  busType: BusType
}

export interface ScheduleResponse {
  route: string
  time: string
  destination: string
  type: BusType
  frequency: string
}

export interface CalendarDate {
  date: string
  hasSchedule: boolean
  busTypes: BusType[]
}

// Mock schedule data
const mockScheduleData: ScheduleResponse[] = [
  {
    route: "Route 45A",
    time: "07:30 AM",
    destination: "Electronic City",
    type: "intercity",
    frequency: "Every 30 mins"
  },
  {
    route: "Route 12B", 
    time: "08:00 AM",
    destination: "MG Road",
    type: "cityToCity",
    frequency: "Every 15 mins"
  },
  {
    route: "Route 23C",
    time: "09:00 AM",
    destination: "Whitefield",
    type: "intercity",
    frequency: "Every 45 mins"
  },
  {
    route: "Route 67D",
    time: "10:15 AM",
    destination: "Banashankari",
    type: "cityToCity",
    frequency: "Every 20 mins"
  },
  {
    route: "Route 89E",
    time: "11:30 AM",
    destination: "Koramangala",
    type: "cityToCity",
    frequency: "Every 25 mins"
  },
  {
    route: "Route 156F",
    time: "02:00 PM",
    destination: "Indiranagar",
    type: "intercity",
    frequency: "Every 40 mins"
  },
  {
    route: "Village Route V1",
    time: "06:00 AM",
    destination: "Rural Punjab",
    type: "village",
    frequency: "Twice daily"
  },
  {
    route: "Village Route V2",
    time: "04:00 PM",
    destination: "Farm Areas",
    type: "village",
    frequency: "Once daily"
  }
];

// Generate mock calendar data for a month
function generateMockCalendarData(month: number, year: number, busType?: BusType): CalendarDate[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarData: CalendarDate[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const hasSchedule = Math.random() > 0.3; // 70% chance of having schedule
    
    let busTypes: BusType[] = [];
    if (hasSchedule) {
      // Randomly assign bus types
      const allTypes: BusType[] = ['intercity', 'village', 'cityToCity'];
      if (busType) {
        busTypes = [busType];
      } else {
        busTypes = allTypes.filter(() => Math.random() > 0.5);
        if (busTypes.length === 0) busTypes = [allTypes[0]]; // Ensure at least one type
      }
    }
    
    calendarData.push({
      date,
      hasSchedule,
      busTypes
    });
  }
  
  return calendarData;
}

export async function submitDateRequest(request: DateRequest): Promise<{ success: boolean; message: string }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        message: `Date request submitted successfully for ${request.from} to ${request.to} on ${request.date}`
      };
    } else {
      return {
        success: false,
        message: "Unable to process request at this time. Please try again."
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to submit date request: ' + message)
  }
}

export async function getCalendarData(month: number, year: number, busType?: BusType): Promise<CalendarDate[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return generateMockCalendarData(month, year, busType);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to fetch calendar data: ' + message)
  }
}

export async function getDaySchedule(date: string, busType?: BusType): Promise<ScheduleResponse[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let schedules = [...mockScheduleData];
    
    // Filter by bus type if specified
    if (busType) {
      schedules = schedules.filter(schedule => schedule.type === busType);
    }
    
    // Add some randomness to simulate different schedules on different days
    const randomSchedules = schedules.filter(() => Math.random() > 0.3);
    
    return randomSchedules.length > 0 ? randomSchedules : schedules.slice(0, 3);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to fetch day schedule: ' + message)
  }
}

export async function getWeekSchedule(date: string, busType?: BusType): Promise<Record<string, ScheduleResponse[]>> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const weekSchedule: Record<string, ScheduleResponse[]> = {};
    const startDate = new Date(date);
    
    // Generate schedule for 7 days starting from the given date
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      
      let schedules = [...mockScheduleData];
      
      // Filter by bus type if specified
      if (busType) {
        schedules = schedules.filter(schedule => schedule.type === busType);
      }
      
      // Add some randomness for each day
      weekSchedule[dateKey] = schedules.filter(() => Math.random() > 0.4);
      
      // Ensure at least one schedule per day
      if (weekSchedule[dateKey].length === 0) {
        weekSchedule[dateKey] = [schedules[i % schedules.length]];
      }
    }
    
    return weekSchedule;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to fetch week schedule: ' + message)
  }
}