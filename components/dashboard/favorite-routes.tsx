"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, ArrowRight, Plus, ChevronLeft, ChevronRight, Home, Briefcase, X } from "lucide-react"
import { useState } from "react"

interface FavoriteRoutesProps {
  onRouteClick?: (route: any) => void
}

const initialFavoriteRoutes = [
  {
    id: "1",
    name: "Home to Office",
    route: "Koramangala → Whitefield",
    frequency: "Every 15 min",
    from: "Koramangala",
    to: "Whitefield",
    busType: "intercity",
    icon: Home,
  },
  {
    id: "2",
    name: "University Route",
    route: "Banashankari → Indiranagar",
    frequency: "Every 20 min",
    from: "Banashankari",
    to: "Indiranagar",
    busType: "city",
    icon: Briefcase,
  },
]

export function FavoriteRoutes({ onRouteClick }: FavoriteRoutesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favoriteRoutes, setFavoriteRoutes] = useState(initialFavoriteRoutes)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRoute, setNewRoute] = useState({
    name: "",
    from: "",
    to: "",
    busType: "city",
  })

  const nextRoute = () => {
    setCurrentIndex((prev) => (prev + 1) % favoriteRoutes.length)
  }

  const prevRoute = () => {
    setCurrentIndex((prev) => (prev - 1 + favoriteRoutes.length) % favoriteRoutes.length)
  }

  const handleRouteClick = (route: any) => {
    onRouteClick?.(route)
  }

  const handleAddRoute = () => {
    if (newRoute.name && newRoute.from && newRoute.to) {
      const route = {
        id: Date.now().toString(),
        name: newRoute.name,
        route: `${newRoute.from} → ${newRoute.to}`,
        frequency: "Every 15 min",
        from: newRoute.from,
        to: newRoute.to,
        busType: newRoute.busType,
        icon: Star,
      }
      setFavoriteRoutes([...favoriteRoutes, route])
      setNewRoute({ name: "", from: "", to: "", busType: "city" })
      setShowAddForm(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Favorite Routes</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 md:hidden">
            <Button variant="ghost" size="sm" onClick={prevRoute} className="p-1 h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={nextRoute} className="p-1 h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-500 hover:text-orange-600 hidden md:flex"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Route
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-500 hover:text-orange-600 p-1 h-8 w-8 md:hidden"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Add New Favorite Route</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="p-1 h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Route name (e.g., Home to Office)"
                value={newRoute.name}
                onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                className="h-10"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="From location"
                  value={newRoute.from}
                  onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })}
                  className="h-10"
                />
                <Input
                  placeholder="To location"
                  value={newRoute.to}
                  onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddRoute} className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                  Add Route
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="md:hidden">
          {favoriteRoutes.length > 0 && (
            <Card
              className="shadow-sm border-orange-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => handleRouteClick(favoriteRoutes[currentIndex])}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Star className="w-4 h-4 text-orange-500 fill-current" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{favoriteRoutes[currentIndex].name}</p>
                      <p className="text-sm text-gray-600">{favoriteRoutes[currentIndex].route}</p>
                      <p className="text-xs text-gray-500">{favoriteRoutes[currentIndex].frequency}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="hidden md:block space-y-3">
          {favoriteRoutes.map((route) => {
            const IconComponent = route.icon
            return (
              <Card
                key={route.id}
                className="shadow-sm border-orange-200 hover:shadow-md transition-shadow cursor-pointer bg-white"
                onClick={() => handleRouteClick(route)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 rounded-full p-2">
                        <IconComponent className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{route.name}</p>
                        <p className="text-sm text-gray-600">{route.route}</p>
                        <p className="text-xs text-gray-500">{route.frequency}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
