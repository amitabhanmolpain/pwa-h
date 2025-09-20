"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Bus, Calendar, AlertTriangle, CheckCircle } from "lucide-react"
import { notificationService } from "@/lib/notification-service"

interface NotificationSettings {
  busArrival: boolean
  busDelay: boolean
  scheduleRequest: boolean
  generalUpdates: boolean
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    busArrival: true,
    busDelay: true,
    scheduleRequest: true,
    generalUpdates: true
  })
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    // Check if push notifications are enabled
    checkPushNotificationStatus()
  }, [])

  const checkPushNotificationStatus = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPushEnabled(Notification.permission === 'granted')
    }
  }

  const enablePushNotifications = async () => {
    setIsLoading(true)
    try {
      const enabled = await notificationService.initializePushNotifications()
      setIsPushEnabled(enabled)
      
      if (enabled) {
        // Send test notification
        await notificationService.sendCustomNotification(
          'Push Notifications Enabled',
          'You will now receive bus tracking and schedule updates on your mobile device!',
          'general'
        )
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error)
    }
    setIsLoading(false)
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings))
  }

  const sendTestNotification = async (type: string) => {
    try {
      switch (type) {
        case 'bus':
          await notificationService.sendBusNotification({
            busRoute: 'Route 45A',
            status: 'arrived',
            estimatedTime: '2 minutes'
          })
          break
        case 'schedule':
          await notificationService.sendScheduleNotification({
            requestId: 'test_123',
            route: 'Test Route',
            date: new Date().toLocaleDateString(),
            time: '09:00 AM',
            from: 'Your Location',
            to: 'Destination',
            status: 'submitted'
          })
          break
        case 'delay':
          await notificationService.sendBusNotification({
            busRoute: 'Route 45A',
            status: 'delayed',
            estimatedTime: '7 minutes'
          })
          break
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
        <p className="text-gray-600">Manage how you receive updates about your bus journey</p>
      </div>

      {/* Push Notification Status */}
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPushEnabled ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Push Notifications
          </CardTitle>
          <CardDescription>
            {isPushEnabled 
              ? 'Push notifications are enabled. You will receive updates on your mobile device.'
              : 'Enable push notifications to receive real-time updates on your mobile device.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isPushEnabled && (
            <Button 
              onClick={enablePushNotifications}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          )}
          {isPushEnabled && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Enabled
              </Badge>
              <span className="text-sm text-gray-600">Notifications are working</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Bus Arrival Notifications */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bus className="w-5 h-5 text-orange-500" />
              Bus Arrival
            </CardTitle>
            <CardDescription>Get notified when your bus arrives at your location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable notifications</span>
              <Switch
                checked={settings.busArrival}
                onCheckedChange={(checked) => updateSetting('busArrival', checked)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTestNotification('bus')}
              disabled={!isPushEnabled}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </CardContent>
        </Card>

        {/* Bus Delay Notifications */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Bus Delays
            </CardTitle>
            <CardDescription>Get notified when your bus is running late</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable notifications</span>
              <Switch
                checked={settings.busDelay}
                onCheckedChange={(checked) => updateSetting('busDelay', checked)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTestNotification('delay')}
              disabled={!isPushEnabled}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </CardContent>
        </Card>

        {/* Schedule Request Notifications */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
              Schedule Requests
            </CardTitle>
            <CardDescription>Get notified about your schedule request status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable notifications</span>
              <Switch
                checked={settings.scheduleRequest}
                onCheckedChange={(checked) => updateSetting('scheduleRequest', checked)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTestNotification('schedule')}
              disabled={!isPushEnabled}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </CardContent>
        </Card>

        {/* General Updates */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-purple-500" />
              General Updates
            </CardTitle>
            <CardDescription>Get notified about app updates and announcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable notifications</span>
              <Switch
                checked={settings.generalUpdates}
                onCheckedChange={(checked) => updateSetting('generalUpdates', checked)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => notificationService.sendCustomNotification(
                'General Update Test',
                'This is a test of general notifications from Bus Tracker!',
                'general'
              )}
              disabled={!isPushEnabled}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Make sure notifications are enabled in your browser settings</p>
            <p>• On mobile, add this app to your home screen for better notification support</p>
            <p>• Test notifications help ensure everything is working properly</p>
            <p>• You can change these settings anytime</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}