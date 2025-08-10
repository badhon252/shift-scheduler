"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, LogIn } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-300">
      <section className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 md:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <CalendarDays className="h-4 w-4" />
                Shift Scheduler
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                View team schedules instantly. No login required.
              </h1>
              <p className="mt-3 text-gray-600">
                Browse a read‑only view of all published shifts. Administrators
                can sign in to add members, assign shifts, and manage changes
                securely.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/shift-schedule ">
                  <Button className="cursor-pointer">View Schedules</Button>
                </Link>
                <Link href="/admin" className="inline-flex ">
                  <Button className="cursor-pointer" variant="outline">
                    <LogIn className="h-4 w-4 mr-2" />
                    Admin Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl  bg-white p-4 shadow-sm">
              <div
                className="h-48 sm:h-56 rounded-lg bg-[url('/placeholder.svg?height=320&width=640')] bg-cover bg-center"
                aria-label="Calendar illustration"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
