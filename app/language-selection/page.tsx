"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, Globe } from "lucide-react"

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
]

export default function LanguageSelection() {
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLanguageSelect = async (languageCode: string) => {
    setIsLoading(true)
    setSelectedLanguage(languageCode)

    // Store language preference in localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    user.preferredLanguage = languageCode
    user.needsLanguageSelection = false
    localStorage.setItem("user", JSON.stringify(user))

    // Set global language preference for the app
    localStorage.setItem("appLanguage", languageCode)

    // Add language class to document for CSS-based translations if needed
    document.documentElement.setAttribute("data-language", languageCode)

    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Language</h1>
            <p className="text-gray-600 text-sm">Select your preferred language for the app</p>
          </div>

          {/* Language Options */}
          <div className="space-y-3 mb-8">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                disabled={isLoading}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                  selectedLanguage === language.code
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-25"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{language.name}</div>
                  <div className="text-sm text-gray-600">{language.nativeName}</div>
                </div>
                {selectedLanguage === language.code && <Check className="w-5 h-5 text-orange-500" />}
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <Button
            onClick={() => handleLanguageSelect(selectedLanguage)}
            disabled={isLoading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? "Setting up..." : "Continue to Dashboard"}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can change your language preference anytime from settings
          </p>
        </div>
      </div>
    </div>
  )
}
