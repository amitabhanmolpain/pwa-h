"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight, IndianRupee, Bus } from "lucide-react"

interface RouteOption {
  id: string
  duration: string
  cost: number
  transfers: number
  buses: string[]
  walkingTime: string
  steps: Array<{
    type: "walk" | "bus"
    description: string
    duration: string
    route?: string
  }>
}

const mockRoutes: RouteOption[] = [
  {
    id: "1",
    duration: "45 min",
    cost: 25,
    transfers: 1,
    buses: ["Route 45A", "Route 12B"],
    walkingTime: "8 min",
    steps: [
      { type: "walk", description: "Walk to Sector 17 Bus Stop", duration: "5 min" },
      { type: "bus", description: "Take Route 45A to IT Park", duration: "25 min", route: "45A" },
      { type: "walk", description: "Walk to connecting stop", duration: "3 min" },
      { type: "bus", description: "Take Route 12B to destination", duration: "12 min", route: "12B" },
    ],
  },
  {
    id: "2",
    duration: "52 min",
    cost: 20,
    transfers: 0,
    buses: ["Route 23C"],
    walkingTime: "6 min",
    steps: [
      { type: "walk", description: "Walk to main bus stop", duration: "6 min" },
      { type: "bus", description: "Take Route 23C direct", duration: "46 min", route: "23C" },
    ],
  },
]

export function RoutePlanner() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [routes, setRoutes] = useState<RouteOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!from || !to) return

    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      setRoutes(mockRoutes)
      setIsSearching(false)
    }, 1000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Plan Your Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Input placeholder="From (current location)" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input placeholder="To (destination)" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !from || !to} className="w-full">
            {isSearching ? "Searching..." : "Find Routes"}
          </Button>
        </CardContent>
      </Card>

      {routes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Route Options</h3>
          {routes.map((route) => (
            <Card
              key={route.id}
              className={`cursor-pointer transition-all ${selectedRoute === route.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary">{route.duration}</p>
                      <p className="text-xs text-muted-foreground">Total time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold flex items-center">
                        <IndianRupee className="w-4 h-4" />
                        {route.cost}
                      </p>
                      <p className="text-xs text-muted-foreground">Cost</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {route.transfers} transfer{route.transfers !== 1 ? "s" : ""}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{route.walkingTime} walking</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-3">
                  {route.buses.map((bus, index) => (
                    <div key={bus} className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        <Bus className="w-3 h-3 mr-1" />
                        {bus}
                      </Badge>
                      {index < route.buses.length - 1 && <ArrowRight className="w-3 h-3 mx-2 text-muted-foreground" />}
                    </div>
                  ))}
                </div>

                {selectedRoute === route.id && (
                  <div className="border-t pt-3 space-y-2">
                    <h4 className="font-medium text-sm">Step-by-step directions:</h4>
                    {route.steps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-card-foreground">{step.description}</p>
                          <p className="text-muted-foreground text-xs">{step.duration}</p>
                        </div>
                        {step.type === "bus" && (
                          <Badge variant="secondary" className="text-xs">
                            {step.route}
                          </Badge>
                        )}
                      </div>
                    ))}
                    <Button className="w-full mt-3">Start Journey</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
