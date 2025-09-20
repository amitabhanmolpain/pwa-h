"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Plus, Trash2, AlertTriangle } from "lucide-react"

const emergencyContacts = [
  { id: "1", name: "Police", number: "100", color: "bg-blue-500" },
  { id: "2", name: "Fire Department", number: "101", color: "bg-red-500" },
  { id: "3", name: "Ambulance", number: "108", color: "bg-green-500" },
]

export function SOSPage() {
  const [customContacts, setCustomContacts] = useState<Array<{ id: string; name: string; number: string }>>([])
  const [newContactName, setNewContactName] = useState("")
  const [newContactNumber, setNewContactNumber] = useState("")

  const addCustomContact = () => {
    if (newContactName && newContactNumber) {
      const newContact = {
        id: Date.now().toString(),
        name: newContactName,
        number: newContactNumber,
      }
      setCustomContacts([...customContacts, newContact])
      setNewContactName("")
      setNewContactNumber("")
    }
  }

  const removeCustomContact = (id: string) => {
    setCustomContacts(customContacts.filter((contact) => contact.id !== id))
  }

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Emergency SOS</h1>
          <p className="text-gray-600">Quick access to emergency services</p>
        </div>

        {/* Emergency Contacts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Emergency Services</h2>
          {emergencyContacts.map((contact) => (
            <Button
              key={contact.id}
              onClick={() => callNumber(contact.number)}
              className={`w-full ${contact.color} hover:opacity-90 text-white p-4 h-auto`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">{contact.name}</span>
                </div>
                <span className="text-lg font-bold">{contact.number}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Custom Contacts */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Personal Contacts</h2>

          {customContacts.map((contact) => (
            <div key={contact.id} className="flex items-center space-x-2">
              <Button
                onClick={() => callNumber(contact.number)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{contact.name}</span>
                  <span>{contact.number}</span>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeCustomContact(contact.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Add New Contact */}
          <div className="space-y-2 p-4 bg-white rounded-lg border">
            <h3 className="font-medium text-gray-900">Add Emergency Contact</h3>
            <Input
              placeholder="Contact name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
            <Input
              placeholder="Phone number"
              value={newContactNumber}
              onChange={(e) => setNewContactNumber(e.target.value)}
            />
            <Button onClick={addCustomContact} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
