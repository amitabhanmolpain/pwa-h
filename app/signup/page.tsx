import { SignupForm } from "@/components/auth/signup-form"
import { PWAInstall } from "@/components/pwa-install"
import { Bus } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Bus className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Marg Darshak</h1>
          <p className="text-muted-foreground lg:text-lg">Create your account to start tracking buses</p>
        </div>
        <SignupForm />
      </div>
      <PWAInstall />
    </div>
  )
}
