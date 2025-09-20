import { redirect } from "next/navigation"

export default function HomePage() {
  // For now, redirect to login - in a real app, check auth status
  redirect("/login")
}
