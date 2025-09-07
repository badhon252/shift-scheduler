import { PublicScheduler } from "@/components/scheduler/public-scheduler";
import React from "react";

export default function page() {
  return (
    <section
      id="schedule"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <PublicScheduler />
    </section>
  );
}
