"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Clock, Filter, Calendar, CalendarDays, Plus, Send } from "lucide-react"
import { sendScheduleRequestNotification } from "@/lib/notification-service"

type BusType = "intercity" | "village" | "cityToCity"

interface Schedule {
  route: string
  time: string
  destination: string
  type: BusType
  frequency: string
}

interface CalendarDay {
  date: string
  hasSchedule: boolean
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const fullDaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const timeSlots = [
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
]

const busTypes = {
  intercity: "Intercity",
  village: "Village",
  cityToCity: "City to City",
}

const busScheduleData: Record<string, Schedule[]> = {
  Monday: [
    {
      route: "Route 45A",
      time: "06:30",
      destination: "Whitefield - Electronic City",
      type: "intercity",
      frequency: "Every 15 min",
    },
    {
      route: "Route 12B",
      time: "07:00",
      destination: "Koramangala - Indiranagar",
      type: "cityToCity",
      frequency: "Every 20 min",
    },
    {
      route: "Route 23C",
      time: "07:30",
      destination: "Jayanagar - MG Road",
      type: "cityToCity",
      frequency: "Every 12 min",
    },
    {
      route: "Route 67V",
      time: "08:00",
      destination: "Bangalore - Mysore",
      type: "village",
      frequency: "Every 2 hours",
    },
    {
      route: "Route 89I",
      time: "09:00",
      destination: "Bangalore - Chennai",
      type: "intercity",
      frequency: "Every 3 hours",
    },
  ],
  Tuesday: [
    {
      route: "Route 67D",
      time: "06:45",
      destination: "Banashankari - Marathahalli",
      type: "cityToCity",
      frequency: "Every 18 min",
    },
    {
      route: "Route 89E",
      time: "07:15",
      destination: "HSR Layout - Bellandur",
      type: "cityToCity",
      frequency: "Every 25 min",
    },
    {
      route: "Route 34V",
      time: "08:30",
      destination: "Bangalore - Tumkur",
      type: "village",
      frequency: "Every 90 min",
    },
    {
      route: "Route 78I",
      time: "10:00",
      destination: "Bangalore - Hyderabad",
      type: "intercity",
      frequency: "Every 4 hours",
    },
  ],
  Wednesday: [
    {
      route: "Route 156F",
      time: "06:20",
      destination: "Rajajinagar - Hebbal",
      type: "cityToCity",
      frequency: "Every 10 min",
    },
    {
      route: "Route 45A",
      time: "07:00",
      destination: "Whitefield - Electronic City",
      type: "intercity",
      frequency: "Every 15 min",
    },
    {
      route: "Route 12B",
      time: "07:45",
      destination: "Koramangala - Indiranagar",
      type: "cityToCity",
      frequency: "Every 20 min",
    },
    {
      route: "Route 91V",
      time: "09:15",
      destination: "Bangalore - Mandya",
      type: "village",
      frequency: "Every 2 hours",
    },
  ],
  Thursday: [
    {
      route: "Route 234C",
      time: "06:00",
      destination: "Electronic City - Silk Board",
      type: "cityToCity",
      frequency: "Every 8 min",
    },
    {
      route: "Route 567I",
      time: "08:00",
      destination: "Bangalore - Coimbatore",
      type: "intercity",
      frequency: "Every 5 hours",
    },
    {
      route: "Route 123V",
      time: "09:30",
      destination: "Bangalore - Kolar",
      type: "village",
      frequency: "Every 2.5 hours",
    },
  ],
  Friday: [
    {
      route: "Route 789C",
      time: "05:30",
      destination: "Majestic - Airport",
      type: "cityToCity",
      frequency: "Every 30 min",
    },
    {
      route: "Route 456I",
      time: "07:30",
      destination: "Bangalore - Pune",
      type: "intercity",
      frequency: "Every 6 hours",
    },
    {
      route: "Route 321V",
      time: "10:00",
      destination: "Bangalore - Chikballapur",
      type: "village",
      frequency: "Every 3 hours",
    },
  ],
  Saturday: [
    {
      route: "Route 111C",
      time: "06:15",
      destination: "Yeshwantpur - Whitefield",
      type: "cityToCity",
      frequency: "Every 22 min",
    },
    {
      route: "Route 222I",
      time: "08:45",
      destination: "Bangalore - Mangalore",
      type: "intercity",
      frequency: "Every 4 hours",
    },
    {
      route: "Route 333V",
      time: "11:00",
      destination: "Bangalore - Ramanagara",
      type: "village",
      frequency: "Every 90 min",
    },
  ],
  Sunday: [
    {
      route: "Route 444C",
      time: "07:00",
      destination: "Bannerghatta - Koramangala",
      type: "cityToCity",
      frequency: "Every 35 min",
    },
    {
      route: "Route 555I",
      time: "09:00",
      destination: "Bangalore - Goa",
      type: "intercity",
      frequency: "Every 8 hours",
    },
    {
      route: "Route 666V",
      time: "12:00",
      destination: "Bangalore - Channapatna",
      type: "village",
      frequency: "Every 2 hours",
    },
  ],
}

// Mock functions to replace API calls
const getMockCalendarData = async (month: number, year: number, busType?: BusType): Promise<CalendarDay[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const daysInMonth = new Date(year, month, 0).getDate()
  const calendarData: CalendarDay[] = []
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const hasSchedule = busScheduleData[dayName] && busScheduleData[dayName].length > 0
    
    calendarData.push({
      date: date.toISOString().split('T')[0],
      hasSchedule
    })
  }
  
  return calendarData
}

const getMockDaySchedule = async (date: string, busType?: BusType): Promise<Schedule[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
  let schedules = busScheduleData[dayOfWeek] || []
  
  if (busType) {
    schedules = schedules.filter(schedule => schedule.type === busType)
  }
  
  return schedules
}

const getMockWeekSchedule = async (date: string, busType?: BusType): Promise<Record<string, Schedule[]>> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const weekSchedule: Record<string, Schedule[]> = {}
  
  Object.keys(busScheduleData).forEach(day => {
    let schedules = busScheduleData[day]
    if (busType) {
      schedules = schedules.filter(schedule => schedule.type === busType)
    }
    weekSchedule[day] = schedules
  })
  
  return weekSchedule
}

const submitMockDateRequest = async (request: {
  from: string
  to: string
  date: string
  time: string
  busType: BusType
}): Promise<{ success: boolean; message: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock success response
  return {
    success: true,
    message: `Request submitted for ${request.from} to ${request.to} on ${request.date}`
  }
}

export function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"day" | "week">("day")
  const [selectedBusType, setSelectedBusType] = useState<BusType | "all">("all")
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestData, setRequestData] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    busType: "",
  })
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [daySchedules, setDaySchedules] = useState<Schedule[]>([])
  const [weekSchedules, setWeekSchedules] = useState<Record<string, Schedule[]>>({})
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const fetchCalendarData = async () => {
    try {
      setIsLoadingCalendar(true)
      setCalendarError(null)
      const data = await getMockCalendarData(
        currentDate.getMonth() + 1,
        currentDate.getFullYear(),
        selectedBusType === 'all' ? undefined : selectedBusType
      )
      setCalendarData(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch calendar data'
      setCalendarError(message)
    } finally {
      setIsLoadingCalendar(false)
    }
  }

  // Fetch calendar data when month or bus type changes
  useEffect(() => {
    fetchCalendarData()
  }, [currentDate.getMonth(), currentDate.getFullYear(), selectedBusType])

  const fetchDaySchedule = async (date: Date) => {
    try {
      setIsLoadingSchedules(true)
      setScheduleError(null)
      const data = await getMockDaySchedule(
        date.toISOString().split('T')[0],
        selectedBusType === 'all' ? undefined : selectedBusType
      )
      setDaySchedules(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch day schedule'
      setScheduleError(message)
    } finally {
      setIsLoadingSchedules(false)
    }
  }

  const fetchWeekSchedule = async (date: Date) => {
    try {
      setIsLoadingSchedules(true)
      setScheduleError(null)
      const data = await getMockWeekSchedule(
        date.toISOString().split('T')[0],
        selectedBusType === 'all' ? undefined : selectedBusType
      )
      setWeekSchedules(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch week schedule'
      setScheduleError(message)
    } finally {
      setIsLoadingSchedules(false)
    }
  }

  // Fetch schedule data when date, view mode, or bus type changes
  useEffect(() => {
    if (viewMode === 'day') {
      fetchDaySchedule(selectedDate)
    } else {
      fetchWeekSchedule(selectedDate)
    }
  }, [selectedDate, viewMode, selectedBusType])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const selectedDateKey = formatDateKey(selectedDate)
  const schedulesForSelectedDate = busScheduleData[selectedDateKey] || []

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateKey = formatDateKey(date)
      const calendarDay = calendarData.find(d => d.date === dateKey)
      const isSelected = date.toDateString() === selectedDate.toDateString()
      const isToday = date.toDateString() === new Date().toDateString()

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors relative ${
            isSelected
              ? "bg-orange-500 text-white"
              : isToday
                ? "bg-orange-100 text-orange-600"
                : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const getFilteredSchedules = () => {
    if (viewMode === "day") {
      if (selectedBusType === "all") {
        return daySchedules
      }
      return daySchedules.filter((schedule) => schedule.type === selectedBusType)
    } else {
      return weekSchedules
    }
  }

  const renderDaySchedule = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Schedule for{" "}
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h3>

        {isLoadingSchedules ? (
          <div className="flex justify-center items-center h-40">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : scheduleError ? (
          <div className="text-red-600 text-center p-4">{scheduleError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timeSlots.map((time) => {
              const busesAtTime = daySchedules.filter((schedule: Schedule) => 
                schedule.time.startsWith(time.substring(0, 2))
              )

              return (
                <div key={time} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">{time}</span>
                  </div>

                  {busesAtTime.length > 0 ? (
                    <div className="space-y-2">
                      {busesAtTime.map((bus: Schedule, index: number) => (
                        <div key={index} className="bg-orange-50 p-2 rounded text-sm">
                          <div className="font-medium text-orange-600">{bus.route}</div>
                          <div className="text-gray-600 text-xs">{bus.destination}</div>
                          <div className="text-gray-500 text-xs">{bus.frequency}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No buses</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderWeekSchedule = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>

        {isLoadingSchedules ? (
          <div className="flex justify-center items-center h-40">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : scheduleError ? (
          <div className="text-red-600 text-center p-4">{scheduleError}</div>
        ) : (
          <div className="space-y-6">
            {fullDaysOfWeek.map((day) => (
              <div key={day} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CalendarDays className="w-4 h-4 text-orange-500 mr-2" />
                  {day}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(weekSchedules as Record<string, Schedule[]>)[day]?.map((bus: Schedule, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {bus.route}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{bus.time}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{bus.destination}</div>
                      <div className="text-xs text-gray-500">{bus.frequency}</div>
                      <div className="text-xs text-orange-600 capitalize mt-1">{bus.type}</div>
                    </div>
                  )) || <div className="text-gray-400 text-sm col-span-full">No buses scheduled</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleRequestSubmit = async () => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      const response = await submitMockDateRequest({
        from: requestData.from,
        to: requestData.to,
        date: requestData.date,
        time: requestData.time,
        busType: requestData.busType as BusType
      })

      if (response.success) {
        // Send push notification for successful request submission
        try {
          await sendScheduleRequestNotification({
            route: `${requestData.from} → ${requestData.to}`,
            date: requestData.date,
            time: requestData.time,
            from: requestData.from,
            to: requestData.to,
            status: 'submitted'
          })
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError)
        }

        setShowRequestDialog(false)
        setRequestData({ from: "", to: "", date: "", time: "", busType: "" })
        
        // Show success toast
        alert('Request submitted successfully! You will receive a notification on your mobile device.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bus Schedule</h2>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Request Date
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Request New Travel Date</DialogTitle>
              <DialogDescription>Request a new bus route for a date not in our current schedule</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    placeholder="Starting location"
                    value={requestData.from}
                    onChange={(e) => setRequestData({ ...requestData, from: e.target.value })}
                    className="border-gray-300 focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    placeholder="Destination"
                    value={requestData.to}
                    onChange={(e) => setRequestData({ ...requestData, to: e.target.value })}
                    className="border-gray-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Travel Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={requestData.date}
                    onChange={(e) => setRequestData({ ...requestData, date: e.target.value })}
                    className="border-gray-300 focus:border-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Preferred Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={requestData.time}
                    onChange={(e) => setRequestData({ ...requestData, time: e.target.value })}
                    className="border-gray-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="busType">Bus Type</Label>
                <Select
                  value={requestData.busType}
                  onValueChange={(value) => setRequestData({ ...requestData, busType: value })}
                >
                  <SelectTrigger className="border-gray-300 focus:border-orange-500">
                    <SelectValue placeholder="Select bus type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="village">Village</SelectItem>
                    <SelectItem value="cityToCity">City to City</SelectItem>
                    <SelectItem value="intercity">Intercity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {submitError && (
                <div className="text-sm text-red-600 mb-2">
                  {submitError}
                </div>
              )}
              <Button
                onClick={handleRequestSubmit}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!requestData.from || !requestData.to || !requestData.date || !requestData.busType || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
            className={viewMode === "day" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Day View
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
            className={viewMode === "week" ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Week View
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select 
            value={selectedBusType} 
            onValueChange={(value: BusType | "all") => setSelectedBusType(value)}
          >
            <SelectTrigger className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              <SelectValue placeholder="Select bus type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buses</SelectItem>
              <SelectItem value="intercity">Intercity Buses</SelectItem>
              <SelectItem value="village">Village Buses</SelectItem>
              <SelectItem value="cityToCity">City to City</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === "day" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoadingCalendar ? (
            <div className="flex justify-center items-center h-40">
              <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : calendarError ? (
            <div className="text-red-600 text-center p-4">{calendarError}</div>
          ) : (
            <div className="grid grid-cols-7 gap-1 mb-6">{renderCalendarDays()}</div>
          )}
        </div>
      )}

      {viewMode === "day" ? renderDaySchedule() : renderWeekSchedule()}
    </div>
  )
}
