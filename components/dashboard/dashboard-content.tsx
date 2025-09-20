"use client"

import { useState, useEffect } from "react"
import { MapView } from "@/components/dashboard/map-view"
import { NearbyBuses } from "@/components/dashboard/nearby-buses"
import { FavoriteRoutes } from "@/components/dashboard/favorite-routes"
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar"
import { BottomNavigation } from "@/components/dashboard/bottom-navigation"
import { SearchSection } from "@/components/dashboard/search-section"
import { SOSPage } from "@/components/dashboard/sos-page"
import { NotificationPage } from "@/components/dashboard/notification-page"
import { TrackSection } from "@/components/dashboard/track-section"
import { ProfileSection } from "@/components/dashboard/profile-section"
import { FloatingChatbot } from "@/components/dashboard/floating-chatbot"
import { Home, Search, MapPin, Calendar, User, Bell, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState("home")
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [popularRouteIndex, setPopularRouteIndex] = useState(0)
  const [searchData, setSearchData] = useState<any>(null)
  const [locationPermission, setLocationPermission] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((result) => {
          setLocationPermission(result.state)
          if (result.state === "prompt") {
            setShowLocationModal(true)
          }
        })
        .catch(() => {
          setShowLocationModal(true)
        })
    }
  }, [])

  const handleLocationRequest = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission("granted")
        setShowLocationModal(false)
      },
      (error) => {
        setLocationPermission("denied")
        setShowLocationModal(false)
      },
    )
  }

  const handleSearchClick = () => {
    setActiveTab("search")
  }

  const handleSOSClick = () => {
    setActiveTab("sos")
  }

  const handleNotificationClick = () => {
    setActiveTab("notifications")
  }

  const handleBusSelect = (bus: any) => {
    setSelectedBus(bus)
  }

  const handleTrackBus = (bus: any) => {
    setSelectedBus(bus)
    setActiveTab("track")
  }

  const handleSearch = (searchData: any) => {
    console.log("[v0] Search initiated with data:", searchData)
  }

  const popularRoutes = [
    {
      id: 1,
      name: "Whitefield - Electronic City",
      duration: "1h 45m",
      price: "₹85",
      from: "Whitefield",
      to: "Electronic City",
      busType: "intercity",
    },
    {
      id: 2,
      name: "Koramangala - Indiranagar",
      duration: "45m",
      price: "₹25",
      from: "Koramangala",
      to: "Indiranagar",
      busType: "city",
    },
    {
      id: 3,
      name: "Banashankari - Vijayanagar",
      duration: "45m",
      price: "₹30",
      from: "Banashankari",
      to: "Vijayanagar",
      busType: "city",
    },
  ]

  const handleRouteClick = (route: any) => {
    setSearchData({
      from: route.from,
      to: route.to,
      busType: route.busType,
    })
    setActiveTab("search")
  }

  const nextPopularRoute = () => {
    setPopularRouteIndex((prev) => (prev + 1) % popularRoutes.length)
  }

  const prevPopularRoute = () => {
    setPopularRouteIndex((prev) => (prev - 1 + popularRoutes.length) % popularRoutes.length)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="mx-4 max-w-md">
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Enable Location Access</h3>
              <p className="text-gray-600 mb-4">
                We need your location to show nearby buses and provide better route suggestions.
              </p>
              <div className="flex space-x-3">
                <Button onClick={() => setShowLocationModal(false)} variant="outline" className="flex-1">
                  Skip
                </Button>
                <Button onClick={handleLocationRequest} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  Allow Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-orange-500 rounded-full p-2">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-black">MargDarshak</span>
          </div>
          <nav className="space-y-2">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "search", label: "Search", icon: Search },
              { id: "track", label: "Track", icon: MapPin },
              { id: "schedule", label: "Schedule", icon: Calendar },
              { id: "profile", label: "Profile", icon: User },
            ].map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-orange-500 text-white"
                      : "text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen pb-20 lg:pb-4">
          {activeTab === "home" && (
            <div className="space-y-0">
              <div className="relative">
                <MapView 
                  key="dashboard-home-map"
                  showNearbyBuses={true} 
                  onSOSClick={handleSOSClick}
                  onNotificationClick={handleNotificationClick}
                />
              </div>

              <div className="px-4 lg:px-6 space-y-6 pt-6">
                <Button
                  onClick={handleSearchClick}
                  className="w-full bg-black hover:bg-gray-900 text-white py-4 md:py-6 text-base md:text-lg rounded-xl justify-between"
                >
                  <span>Where would you like to go?</span>
                  <MapPin className="w-5 h-5" />
                </Button>

                <FavoriteRoutes onRouteClick={handleRouteClick} />

                <NearbyBuses onBusSelect={handleBusSelect} onTrackBus={handleTrackBus} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Popular Routes</h3>
                    <div className="flex items-center space-x-2 md:hidden">
                      <Button variant="ghost" size="sm" onClick={prevPopularRoute} className="p-1 h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={nextPopularRoute} className="p-1 h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="md:hidden">
                    <div
                      onClick={() => handleRouteClick(popularRoutes[popularRouteIndex])}
                      className="bg-white border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold text-gray-900 text-sm">{popularRoutes[popularRouteIndex].name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-600">{popularRoutes[popularRouteIndex].duration}</span>
                        <span className="text-sm font-bold text-orange-600">
                          {popularRoutes[popularRouteIndex].price}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex space-x-4 overflow-x-auto pb-2">
                    {popularRoutes.map((route) => (
                      <div
                        key={route.id}
                        onClick={() => handleRouteClick(route)}
                        className="flex-shrink-0 bg-white border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow min-w-[200px]"
                      >
                        <h4 className="font-semibold text-gray-900 text-sm">{route.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-600">{route.duration}</span>
                          <span className="text-sm font-bold text-orange-600">{route.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "search" && (
            <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
              <SearchSection onSearch={handleSearch} onTrackBus={handleTrackBus} searchData={searchData} />
            </div>
          )}

          {activeTab === "track" && (
            <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
              <TrackSection busData={selectedBus} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
              <ScheduleCalendar />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="px-4 lg:px-6 py-4">
              <ProfileSection />
            </div>
          )}

          {activeTab === "sos" && (
            <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
              <SOSPage />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto">
              <NotificationPage />
            </div>
          )}
        </main>

        <div className="lg:hidden">
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Floating AI Chatbot - Available on all pages */}
      <FloatingChatbot />
    </div>
  )
}
