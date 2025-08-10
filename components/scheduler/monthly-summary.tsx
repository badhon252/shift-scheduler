"use client";

import { useMemo } from "react";
import type { Shift } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MonthlySummaryProps {
  shifts: Shift[];
  memberName?: string;
  isMobile?: boolean;
  className?: string;
}

export function MonthlySummary({
  shifts,
  memberName,
  isMobile = false,
  className = "",
}: MonthlySummaryProps) {
  const summary = useMemo(
    () => ({
      morning: shifts.filter((s) => s.shift_type.includes("Morning")).length,
      evening: shifts.filter((s) => s.shift_type.includes("Evening")).length,
      night: shifts.filter((s) => s.shift_type.includes("Night")).length,
      off: shifts.filter((s) => s.shift_type === "Offday").length,
      leave: shifts.filter((s) => s.shift_type === "Leave").length,
      absent: shifts.filter((s) => s.shift_type === "Absent").length,
    }),
    [shifts]
  );

  const summaryItems = [
    {
      key: "morning",
      label: "Morning",
      count: summary.morning,
      color: "#fad664",
      textColor: "text-black",
    },
    {
      key: "evening",
      label: "Evening",
      count: summary.evening,
      color: "#a8f15a",
      textColor: "text-black",
    },
    {
      key: "night",
      label: "Night",
      count: summary.night,
      color: "#108858",
      textColor: "text-white",
    },
    {
      key: "off",
      label: "Off Days",
      count: summary.off,
      color: "#9febfb",
      textColor: "text-black",
    },
    {
      key: "leave",
      label: "Leave",
      count: summary.leave,
      color: "#dd9bfc",
      textColor: "text-black",
    },
    {
      key: "absent",
      label: "Absent",
      count: summary.absent,
      color: "#d21904",
      textColor: "text-white",
    },
  ];

  const totalShifts = summaryItems.reduce(
    (total, item) => total + item.count,
    0
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">
            {memberName
              ? isMobile
                ? "Monthly Summary"
                : `Monthly Summary for ${memberName}`
              : "Monthly Summary"}
          </span>
        </CardTitle>
        {totalShifts > 0 && (
          <p className="text-xs sm:text-sm text-gray-600">
            Total shifts assigned: {totalShifts}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {totalShifts === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No shifts assigned for this month
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-4 ${
              isMobile
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
            }`}
          >
            {summaryItems.map((item) => (
              <div
                key={item.key}
                className="text-center p-3 rounded-lg transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: item.color }}
              >
                <div
                  className={`text-xl sm:text-2xl font-bold ${item.textColor}`}
                >
                  {item.count}
                </div>
                <div
                  className={`text-xs sm:text-sm ${item.textColor} opacity-90`}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalShifts > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Work Days
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.morning + summary.evening + summary.night}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Off Days
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.off + summary.leave}
                </div>
              </div>
              <div className="sm:col-span-1 col-span-2">
                <div className="text-sm font-medium text-gray-700">Absent</div>
                <div className="text-lg font-bold text-gray-900">
                  {summary.absent}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
