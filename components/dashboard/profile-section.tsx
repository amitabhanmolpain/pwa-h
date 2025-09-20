"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Edit3,
  Save,
  X,
  Camera,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Bus,
} from "lucide-react"

interface UserData {
  name: string
  email: string
  phone?: string
  address?: string
  language?: string
  avatar?: string
  joinDate?: string
  totalTrips?: number
  favoriteRoutes?: string[]
}

interface CalendarRequest {
  id: string
  busRoute: string
  date: string
  time: string
  status: "pending" | "accepted" | "rejected"
  requestDate: string
}

interface TravelHistory {
  id: string
  busRoute: string
  from: string
  to: string
  date: string
  time: string
  busId: string
}

export function ProfileSection() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UserData | null>(null)
  const [calendarRequests] = useState<CalendarRequest[]>([
    {
      id: "1",
      busRoute: "Whitefield to Electronic City",
      date: "2024-09-20",
      time: "09:00 AM",
      status: "accepted",
      requestDate: "2024-09-15",
    },
    {
      id: "2",
      busRoute: "Koramangala to Whitefield",
      date: "2024-09-22",
      time: "06:30 PM",
      status: "pending",
      requestDate: "2024-09-16",
    },
    {
      id: "3",
      busRoute: "HSR Layout to Marathahalli",
      date: "2024-09-18",
      time: "08:15 AM",
      status: "rejected",
      requestDate: "2024-09-14",
    },
  ])

  const [travelHistory] = useState<TravelHistory[]>([
    {
      id: "1",
      busRoute: "Route 45A",
      from: "Whitefield",
      to: "Electronic City",
      date: "2024-09-10",
      time: "09:00 AM",
      busId: "KA-01-AB-1234",
    },
    {
      id: "2",
      busRoute: "Route 23B",
      from: "Koramangala",
      to: "Whitefield",
      date: "2024-09-08",
      time: "06:30 PM",
      busId: "KA-01-CD-5678",
    },
    {
      id: "3",
      busRoute: "Route 67C",
      from: "HSR Layout",
      to: "Marathahalli",
      date: "2024-09-05",
      time: "08:15 AM",
      busId: "KA-01-EF-9012",
    },
    {
      id: "4",
      busRoute: "Route 12D",
      from: "Indiranagar",
      to: "Banashankari",
      date: "2024-09-03",
      time: "07:45 AM",
      busId: "KA-01-GH-3456",
    },
  ])

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      const profileData: UserData = {
        name: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        language: user.language || "English",
        avatar: user.avatar || "",
        joinDate: user.joinDate || new Date().toLocaleDateString(),
        totalTrips: user.totalTrips || 0,
        favoriteRoutes: user.favoriteRoutes || [],
      }
      setUserData(profileData)
      setEditData(profileData)
    }
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editData) {
      const updatedUser = { ...editData, isAuthenticated: true }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUserData(editData)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditData(userData)
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof UserData, value: string) => {
    if (editData) {
      setEditData({ ...editData, [field]: value })
    }
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (editData) {
          setEditData({ ...editData, avatar: result })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/signup" // Redirect to signup page
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <Button onClick={handleEdit} className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-orange-50 to-white border-orange-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="relative flex justify-center sm:justify-start">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-orange-200">
                <AvatarImage src={userData.avatar || ""} alt={userData.name} />
                <AvatarFallback className="bg-orange-500 text-white text-xl md:text-2xl font-bold">
                  {userData.avatar ? (
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Camera className="w-8 h-8 text-white opacity-70" />
                    </div>
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className="cursor-pointer inline-flex items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 text-white p-2 transition-colors shadow-lg border-2 border-white"
                >
                  <Camera className="w-4 h-4" />
                </label>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{userData.name}</h2>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm md:text-base break-all">{userData.email}</span>
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs md:text-sm">
                  Member since {userData.joinDate}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Personal Information */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-gray-900 text-lg md:text-xl">
              <User className="w-5 h-5 mr-2 text-orange-500" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-sm">Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editData?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900 font-medium text-sm md:text-base">{userData.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <p className="text-gray-600 flex items-center text-sm md:text-base">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
                <span className="break-all">{userData.email}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editData?.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900 flex items-center text-sm md:text-base">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
                  {userData.phone || "Not provided"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Preferences */}
        <Card className="border-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-gray-900 text-lg md:text-xl">
              <MapPin className="w-5 h-5 mr-2 text-orange-500" />
              Location & Preferences
            </CardTitle>
            <CardDescription className="text-sm">Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData?.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter your address"
                  className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                />
              ) : (
                <p className="text-gray-900 flex items-start text-sm md:text-base">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-orange-500" />
                  <span>{userData.address || "Not provided"}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Preferred Language
              </Label>
              {isEditing ? (
                <Select
                  value={editData?.language || "English"}
                  onValueChange={(value) => handleInputChange("language", value)}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Punjabi">Punjabi</SelectItem>
                    <SelectItem value="Urdu">Urdu</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-900 flex items-center text-sm md:text-base">
                  <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
                  {userData.language}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 text-lg md:text-xl">
            <Calendar className="w-5 h-5 mr-2 text-orange-500" />
            Your Calendar Requests
          </CardTitle>
          <CardDescription className="text-sm">Status of your personal bus scheduling requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calendarRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-gray-900 text-sm md:text-base">{request.busRoute}</h4>
                  <p className="text-xs md:text-sm text-gray-600">
                    {request.date} at {request.time}
                  </p>
                  <p className="text-xs text-gray-500">Requested on {request.requestDate}</p>
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4">
                  <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 text-xs`}>
                    {getStatusIcon(request.status)}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900 text-lg md:text-xl">
            <Bus className="w-5 h-5 mr-2 text-orange-500" />
            Travel History
          </CardTitle>
          <CardDescription className="text-sm">All buses you have traveled till now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {travelHistory.map((trip) => (
              <div
                key={trip.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-orange-100 hover:border-orange-200 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm md:text-base">{trip.busRoute}</h4>
                    <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                      {trip.busId}
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">
                    {trip.from} → {trip.to}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trip.date} at {trip.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
