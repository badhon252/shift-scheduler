"use client"

import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ShiftScheduler } from "@/components/scheduler/shift-scheduler"
import { AdminAuthForm } from "@/components/auth/admin-auth-form"

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <AdminAuthForm />
  }

  return (
    <DashboardLayout>
      <ShiftScheduler />
    </DashboardLayout>
  )
}
