"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Calendar, Home } from "lucide-react"
import Link from "next/link"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth()
  const initials = (email: string | null | undefined) => (email ? email[0].toUpperCase() : "A")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-7 w-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Shift Scheduler Admin</h1>
            <Link href="/" className="ml-2 inline-flex items-center text-sm text-blue-600 hover:underline">
              <Home className="h-4 w-4 mr-1" />
              Public view
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">{initials(session?.user?.email)}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{session?.user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 hover:text-gray-800">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
