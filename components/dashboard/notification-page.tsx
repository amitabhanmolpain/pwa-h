"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, X, Clock, MapPin, AlertCircle } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "arrival",
    title: "Bus Arriving Soon",
    message: "Route 45A will arrive at your stop in 3 minutes",
    time: "2 min ago",
    icon: Clock,
    color: "text-green-600",
    bgColor: "bg-green-50",
    read: false,
  },
  {
    id: 2,
    type: "delay",
    title: "Route Delayed",
    message: "Route 12B is running 10 minutes late due to traffic",
    time: "5 min ago",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    read: false,
  },
  {
    id: 3,
    type: "location",
    title: "Bus Location Update",
    message: "Your tracked bus Route 23C is now at Jayanagar 4th Block",
    time: "8 min ago",
    icon: MapPin,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    read: true,
  },
  {
    id: 4,
    type: "crowding",
    title: "Bus Capacity Alert",
    message: "Route 67D is currently crowded. Consider waiting for the next bus",
    time: "12 min ago",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    read: true,
  },
]

export function NotificationPage() {
  const [notificationList, setNotificationList] = useState(notifications)

  const markAsRead = (id: number) => {
    setNotificationList((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const deleteNotification = (id: number) => {
    setNotificationList((prev) => prev.filter((notif) => notif.id !== id))
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const unreadCount = notificationList.filter((n) => !n.read).length

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 rounded-full p-2">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notificationList.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          notificationList.map((notification) => {
            const IconComponent = notification.icon
            return (
              <div
                key={notification.id}
                className={`relative p-4 rounded-lg border transition-colors ${
                  notification.read ? "bg-white border-gray-200" : `${notification.bgColor} border-gray-300`
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${notification.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${notification.read ? "text-gray-700" : "text-gray-900"}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${notification.read ? "text-gray-500" : "text-gray-700"}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <div className="absolute top-4 right-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
