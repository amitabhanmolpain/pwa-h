"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, AlertTriangle, Info, CheckCircle } from "lucide-react"

interface Notification {
  id: string
  type: "delay" | "info" | "success"
  title: string
  message: string
  timestamp: string
  route?: string
  isRead: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "delay",
    title: "Route 45A Delayed",
    message: "Your bus is running 5 minutes late due to traffic congestion near IT Park.",
    timestamp: "2 min ago",
    route: "45A",
    isRead: false,
  },
  {
    id: "2",
    type: "info",
    title: "New Route Available",
    message: "Route 67D now serves your favorite destination with faster connectivity.",
    timestamp: "1 hour ago",
    isRead: false,
  },
  {
    id: "3",
    type: "success",
    title: "Journey Completed",
    message: "You've successfully completed your journey from Sector 17 to IT Park.",
    timestamp: "3 hours ago",
    route: "45A",
    isRead: true,
  },
]

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "delay":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))}
          className="text-primary"
        >
          Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`shadow-sm ${!notification.isRead ? "bg-primary/5 border-primary/20" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-card-foreground">{notification.title}</p>
                        {notification.route && (
                          <Badge variant="outline" className="text-xs">
                            {notification.route}
                          </Badge>
                        )}
                        {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-primary text-xs"
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notification.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
