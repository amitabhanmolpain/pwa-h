import { toast } from "@/hooks/use-toast"

// MagicBell API configuration
const MAGICBELL_API_KEY = "pk_dzzDK9540wsxT8Yn95d1_2501605663"
const MAGICBELL_API_URL = "https://api.magicbell.com"

export interface NotificationData {
  title: string
  content: string
  category?: string
  actionUrl?: string
  recipients?: string[]
  customAttributes?: Record<string, any>
}

export interface BusNotificationData {
  busRoute: string
  busId?: string
  status: 'approaching' | 'arrived' | 'delayed' | 'departed'
  estimatedTime?: string
  location?: string
}

export interface ScheduleNotificationData {
  requestId: string
  route: string
  date: string
  time: string
  status: 'submitted' | 'confirmed' | 'rejected'
  from: string
  to: string
}

class NotificationService {
  private apiKey: string
  private baseUrl: string
  private userId: string | null = null

  constructor() {
    this.apiKey = MAGICBELL_API_KEY
    this.baseUrl = MAGICBELL_API_URL
    this.initializeUser()
  }

  private initializeUser() {
    // Get user ID from localStorage or generate a unique one
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        this.userId = user.email || `user_${Date.now()}`
      } else {
        this.userId = `anonymous_${Date.now()}`
      }
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'X-MAGICBELL-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('MagicBell API error:', error)
      // Fallback to local notification
      this.showLocalNotification(body?.notification?.title || 'Notification', body?.notification?.content || '')
      throw error
    }
  }

  private showLocalNotification(title: string, content: string) {
    // Show browser notification as fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: content,
          icon: '/bus.png',
          badge: '/bus.png'
        })
      }
    }
    
    // Also show toast notification
    toast({
      title: title,
      description: content,
    })
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      const notificationPayload = {
        notification: {
          title: data.title,
          content: data.content,
          category: data.category || 'general',
          action_url: data.actionUrl,
          custom_attributes: {
            app: 'bus-tracker',
            timestamp: new Date().toISOString(),
            ...data.customAttributes
          }
        },
        recipients: data.recipients || [
          {
            email: this.userId,
            external_id: this.userId
          }
        ]
      }

      await this.makeRequest('/notifications', 'POST', notificationPayload)
      return true
    } catch (error) {
      console.error('Failed to send notification:', error)
      return false
    }
  }

  async sendBusNotification(busData: BusNotificationData): Promise<boolean> {
    let title = ''
    let content = ''
    let category = 'bus_tracking'

    switch (busData.status) {
      case 'approaching':
        title = `🚌 Bus ${busData.busRoute} Approaching`
        content = `Your bus is approaching your location. Estimated arrival: ${busData.estimatedTime || '2-3 minutes'}`
        break
      case 'arrived':
        title = `✅ Bus ${busData.busRoute} Arrived`
        content = `Your bus has arrived at your location! Please board now.`
        break
      case 'delayed':
        title = `⏰ Bus ${busData.busRoute} Delayed`
        content = `Your bus is running late. New estimated arrival: ${busData.estimatedTime || 'Unknown'}`
        break
      case 'departed':
        title = `🚌 Bus ${busData.busRoute} Departed`
        content = `Your bus has departed and is en route to ${busData.location || 'destination'}.`
        break
    }

    return this.sendNotification({
      title,
      content,
      category,
      customAttributes: {
        bus_route: busData.busRoute,
        bus_id: busData.busId,
        bus_status: busData.status,
        estimated_time: busData.estimatedTime
      }
    })
  }

  async sendScheduleNotification(scheduleData: ScheduleNotificationData): Promise<boolean> {
    let title = ''
    let content = ''
    let category = 'schedule_request'

    switch (scheduleData.status) {
      case 'submitted':
        title = `📅 Schedule Request Submitted`
        content = `Your request for ${scheduleData.route} on ${scheduleData.date} at ${scheduleData.time} has been submitted successfully.`
        break
      case 'confirmed':
        title = `✅ Schedule Request Confirmed`
        content = `Great news! Your request for ${scheduleData.route} on ${scheduleData.date} at ${scheduleData.time} has been confirmed.`
        break
      case 'rejected':
        title = `❌ Schedule Request Update`
        content = `Your request for ${scheduleData.route} on ${scheduleData.date} at ${scheduleData.time} could not be accommodated.`
        break
    }

    return this.sendNotification({
      title,
      content,
      category,
      customAttributes: {
        request_id: scheduleData.requestId,
        route: scheduleData.route,
        date: scheduleData.date,
        time: scheduleData.time,
        from: scheduleData.from,
        to: scheduleData.to,
        status: scheduleData.status
      }
    })
  }

  async sendCustomNotification(title: string, message: string, category?: string): Promise<boolean> {
    return this.sendNotification({
      title,
      content: message,
      category: category || 'general'
    })
  }

  // Initialize service worker for push notifications
  async initializePushNotifications(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return false
    }

    try {
      // Request notification permission
      const permissionGranted = await this.requestNotificationPermission()
      if (!permissionGranted) {
        console.warn('Notification permission denied')
        return false
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered successfully')
      
      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export utility functions
export const sendBusArrivalNotification = (busRoute: string, estimatedTime?: string) => {
  return notificationService.sendBusNotification({
    busRoute,
    status: 'arrived',
    estimatedTime
  })
}

export const sendBusDelayNotification = (busRoute: string, estimatedTime: string) => {
  return notificationService.sendBusNotification({
    busRoute,
    status: 'delayed',
    estimatedTime
  })
}

export const sendScheduleRequestNotification = (requestData: Omit<ScheduleNotificationData, 'requestId'>) => {
  const requestId = `req_${Date.now()}`
  return notificationService.sendScheduleNotification({
    ...requestData,
    requestId,
    status: 'submitted'
  })
}

// Initialize push notifications when module loads (browser only)
if (typeof window !== 'undefined') {
  notificationService.initializePushNotifications()
}