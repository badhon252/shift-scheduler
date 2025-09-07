"use client";

import { useEffect, useRef, useState } from "react";
import type { Shift } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Grid, List } from "lucide-react";
import { SHIFT_TYPES, type ShiftTypeDef } from "@/constants/shift-types";

interface ShiftCalendarProps {
  currentDate: Date;
  shifts: Shift[];
  onShiftUpdate?: (date: string, shiftType: string) => void;
  canEdit: boolean;
  memberName: string;
}

export function ShiftCalendar({
  currentDate,
  shifts,
  onShiftUpdate,
  canEdit,
  memberName,
}: ShiftCalendarProps) {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"grid" | "list">("grid");
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-switch to list view on very small screens
      if (window.innerWidth < 640) {
        setMobileView("list");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  // Use UTC dates to avoid timezone issues
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();

  console.log("Calendar Info:", {
    year,
    month: month + 1,
    daysInMonth,
    firstDay,
  });

  // Fixed date formatting function
  const dateStrFor = (day: number) => {
    if (day < 1 || day > daysInMonth) {
      console.error(
        `Invalid day: ${day}. Month ${
          month + 1
        }/${year} has days 1-${daysInMonth}.`
      );
      return null;
    }

    // Create a Date object and extract components to handle month/year boundaries correctly
    // Use UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = date.toISOString().split("T")[0];
    console.log(`Generated date string for day ${day}:`, {
      input: { year, month, day },
      date: date.toISOString(),
      dateStr,
      utcComponents: {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      },
    });
    return dateStr;
  };

  const getShiftFor = (day: number) => {
    const dateStr = dateStrFor(day);
    if (!dateStr) return undefined;

    const shift = shifts.find((s) => s.date === dateStr);
    return shift;
  };

  const getShiftTypeInfo = (name: string): ShiftTypeDef | undefined =>
    SHIFT_TYPES.find((t) => t.name === name);

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    if (!canEdit) return;

    if (day < 1 || day > daysInMonth) {
      console.error(
        `Cannot click on day ${day}, month only has ${daysInMonth} days`
      );
      return;
    }

    const dateStr = dateStrFor(day);
    if (!dateStr) {
      console.error(`Cannot generate valid date for day ${day}`);
      return;
    }

    // Handle selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      setSelectedDates((prev) => {
        if (prev.includes(day)) {
          return prev.filter((d) => d !== day);
        } else {
          return [...prev, day];
        }
      });
    } else {
      // Regular click behavior - toggle dropdown and clear selections
      setSelectedDates([]);
      setActiveDropdown(activeDropdown === day ? null : day);
    }

    console.log(
      `Clicked on day ${day}, date: ${dateStr}, multiSelect: ${
        e.ctrlKey || e.metaKey
      }`
    );
  };

  const handleShiftSelect = async (day: number, shiftType: string) => {
    // If there are selected dates, update all of them
    const daysToUpdate = selectedDates.length > 0 ? selectedDates : [day];

    for (const selectedDay of daysToUpdate) {
      const dateStr = dateStrFor(selectedDay);
      if (!dateStr) {
        console.error(`Cannot generate valid date for day ${selectedDay}`);
        continue;
      }

      console.log(
        `Selecting shift for day ${selectedDay}, date: ${dateStr}, type: ${shiftType}`
      );
      await onShiftUpdate?.(dateStr, shiftType);
    }

    setActiveDropdown(null);
    setSelectedDates([]); // Clear selections after updating
  };

  // Create array of all valid days
  const allDays: {
    day: number;
    dateStr: string;
    shift:
      | {
          id: string;
          member_id: string;
          date: string;
          shift_type: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
    shiftInfo: ShiftTypeDef | undefined;
    isToday: boolean;
    dayOfWeek: number;
    dayName: string;
  }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = dateStrFor(d);
    if (!dateStr) continue;

    const shift = getShiftFor(d);
    const shiftInfo = shift ? getShiftTypeInfo(shift.shift_type) : undefined;
    const isToday =
      new Date().toDateString() === new Date(year, month, d).toDateString();
    const dayOfWeek = new Date(year, month, d).getDay();

    allDays.push({
      day: d,
      dateStr,
      shift,
      shiftInfo,
      isToday,
      dayOfWeek,
      dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
    });
  }

  console.log(
    "All valid days:",
    allDays.map((d) => ({ day: d.day, dateStr: d.dateStr }))
  );

  // Mobile List View
  if (isMobile && mobileView === "list") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              <span className="truncate">{memberName}</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileView("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            {canEdit ? "Tap any day to assign shifts." : "View-only schedule."}
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2 max-h-[584px] overflow-y-auto">
            {allDays.map(
              ({ day, dateStr, shift, shiftInfo, isToday, dayName }) => (
                <div key={day} className="relative">
                  <div
                    className={[
                      "flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
                      shiftInfo
                        ? `${shiftInfo.bgColor} ${shiftInfo.textColor} border-transparent`
                        : "bg-white border-gray-200",
                      isToday ? "ring-2 ring-blue-500 ring-offset-1" : "",
                      canEdit
                        ? "cursor-pointer hover:shadow-md active:scale-[0.98]"
                        : "cursor-default",
                      activeDropdown === day ? "ring-2 ring-blue-400" : "",
                    ].join(" ")}
                    onClick={(e) => handleDayClick(day, e)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div
                          className={`text-lg font-bold ${
                            isToday && !shiftInfo ? "text-blue-600" : ""
                          }`}
                        >
                          {day}
                        </div>
                        <div className="text-xs opacity-75">{dayName}</div>
                        <div className="text-[10px] opacity-60">{dateStr}</div>
                      </div>
                      {shift && (
                        <div>
                          <div className="font-medium">
                            {shift.shift_type.split(" ")[0]}
                          </div>
                          {shift.shift_type.includes("Shift") && (
                            <div className="text-xs opacity-90">
                              {shift.shift_type.includes("Morning") &&
                                "7:00 AM - 3:00 PM"}
                              {shift.shift_type.includes("Evening") &&
                                "2:50 PM - 11:00 PM"}
                              {shift.shift_type.includes("Night") &&
                                "10:30 PM - 7:00 AM"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!shift && canEdit && (
                      <div className="text-sm opacity-75">Tap to assign</div>
                    )}
                  </div>

                  {activeDropdown === day && canEdit && (
                    <div
                      ref={dropdownRef}
                      className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                      style={{ maxHeight: "60vh", overflowY: "auto" }}
                    >
                      <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                        {dayName},{" "}
                        {currentDate.toLocaleDateString("en-US", {
                          month: "short",
                        })}{" "}
                        {day}
                        <div className="text-xs text-gray-500">
                          Date: {dateStr}
                        </div>
                      </div>
                      {SHIFT_TYPES.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => handleShiftSelect(day, t.name)}
                          className={[
                            "w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3",
                            shift?.shift_type === t.name
                              ? "bg-blue-50 text-blue-700"
                              : "",
                          ].join(" ")}
                        >
                          <div
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <div className="flex-1">
                            <div>
                              {t.name.split(" ")[0]}{" "}
                              {t.name.includes("Shift") ? "Shift" : ""}
                            </div>
                            {t.name.includes("Shift") && (
                              <div className="text-xs text-gray-500">
                                {t.name.includes("Morning") &&
                                  "7:00 AM - 3:00 PM"}
                                {t.name.includes("Evening") &&
                                  "2:50 PM - 11:00 PM"}
                                {t.name.includes("Night") &&
                                  "10:30 PM - 7:00 AM"}
                              </div>
                            )}
                          </div>
                          {shift?.shift_type === t.name && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </button>
                      ))}
                      {shift && (
                        <button
                          onClick={() => handleShiftSelect(day, "")}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 border-t"
                        >
                          Remove Shift
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Shift Types
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {SHIFT_TYPES.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-sm text-gray-600">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calendar Grid Rendering
  const renderCalendarGrid = () => {
    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);

      // If we've filled a week (7 days) or reached the last day, start a new week
      if (currentWeek.length === 7 || day === daysInMonth) {
        // Fill remaining cells in the last week with nulls
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    console.log("Calendar weeks:", weeks);

    // For mobile, show 3 columns per row instead of traditional calendar
    if (isMobile) {
      const allValidDays = [];
      for (let day = 1; day <= daysInMonth; day++) {
        allValidDays.push(day);
      }

      const mobileRows = [];
      for (let i = 0; i < allValidDays.length; i += 3) {
        mobileRows.push(allValidDays.slice(i, i + 3));
      }

      return (
        <div className="space-y-2">
          {mobileRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((day) => renderDayCell(day))}
              {/* Fill empty cells if needed */}
              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square min-h-[100px]"
                  />
                ))}
            </div>
          ))}
        </div>
      );
    }

    // Desktop view - traditional calendar
    return (
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-4 space-y-2">
            {week.map((day, dayIndex) => (
              <div key={`${weekIndex}-${dayIndex}`}>
                {day ? (
                  renderDayCell(day)
                ) : (
                  <div className="aspect-square min-h-[80px]" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Add a floating action button for multi-select mode
  const renderActionButton = () => {
    if (selectedDates.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setActiveDropdown(selectedDates[0])}
          className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
        >
          <span>Update {selectedDates.length} Selected Dates</span>
        </button>
      </div>
    );
  };

  const renderDayCell = (day: number) => {
    const dayData = allDays.find((d) => d.day === day);
    if (!dayData) {
      console.error(`No day data found for day ${day}`);
      return (
        <div
          key={day}
          className="aspect-square min-h-[80px] bg-red-100 flex items-center justify-center text-red-500 text-xs"
        >
          Error: Day {day}
        </div>
      );
    }

    const { dateStr, shift, shiftInfo, isToday, dayName } = dayData;

    return (
      <div key={day} className="relative">
        <div
          className={[
            "w-full transition-all duration-200 flex flex-col justify-center gap-2 rounded-lg border-2",
            isMobile
              ? "aspect-square min-h-[100px] p-2"
              : "aspect-square min-h-[80px] p-2",
            shiftInfo
              ? `${shiftInfo.bgColor} ${shiftInfo.textColor} border-transparent shadow-sm`
              : "bg-white border-gray-200 hover:border-gray-300",
            isToday ? "ring-2 ring-blue-500 ring-offset-1" : "",
            canEdit
              ? "cursor-pointer hover:shadow-md active:scale-95"
              : "cursor-default",
            activeDropdown === day ? "ring-2 ring-blue-400" : "",
            selectedDates.includes(day) ? "ring-2 ring-purple-400" : "",
          ].join(" ")}
          onClick={(e) => handleDayClick(day, e)}
        >
          <div className="flex flex-col items-center">
            <div
              className={`md:text-2xl text-lg font-bold ${
                isToday && !shiftInfo ? "text-blue-600" : ""
              }`}
            >
              {day}
            </div>
            {isMobile && (
              <div className="text-xs opacity-75 text-center">{dayName}</div>
            )}
            {process.env.NODE_ENV === "development" && (
              <div className="md:text-xs text-xsm opacity-50">{dateStr}</div>
            )}
          </div>

          {shift && (
            <div className="text-center">
              <div className="text-xs font-medium leading-tight">
                {shift.shift_type.split(" ")[0]}
              </div>
              {!isMobile && shift.shift_type.includes("Shift") && (
                <div className="text-[10px] opacity-90 mt-1">
                  {shift.shift_type.includes("Morning") && "7:00 AM - 3:00 PM"}
                  {shift.shift_type.includes("Evening") && "2:50 PM - 11:00 PM"}
                  {shift.shift_type.includes("Night") && "10:30 PM - 7:00 AM"}
                </div>
              )}
            </div>
          )}
        </div>

        {activeDropdown === day && canEdit && (
          <div
            ref={dropdownRef}
            className={[
              "absolute z-20 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2",
              isMobile
                ? "w-80 max-w-[90vw] left-1/2 transform -translate-x-1/2"
                : "w-64 left-1/2 transform -translate-x-1/2",
              // Smart positioning for mobile
              isMobile && day > daysInMonth - 7
                ? "bottom-full mb-1 mt-0"
                : "top-full",
            ].join(" ")}
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <div className="px-3 py-2 border-b">
              {selectedDates.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-purple-600">
                      Update Multiple Dates
                    </div>
                    <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {selectedDates.length} selected
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Days: {selectedDates.sort((a, b) => a - b).join(", ")}
                  </div>
                  <div className="text-xs text-purple-500 mt-1">
                    Selected shifts will be applied to all dates
                  </div>
                </>
              ) : isMobile ? (
                <>
                  <div className="text-sm font-medium text-gray-700">
                    {`${dayName}, ${currentDate.toLocaleDateString("en-US", {
                      month: "short",
                    })} ${day}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {dateStr}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    Tip: Hold Ctrl/Cmd and click to select multiple dates
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-700">
                    {`Select Shift for ${memberName}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {dateStr}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    Tip: Hold Ctrl/Cmd and click to select multiple dates
                  </div>
                </>
              )}
            </div>
            {SHIFT_TYPES.map((t) => (
              <button
                key={t.name}
                onClick={() => handleShiftSelect(day, t.name)}
                className={[
                  "w-full px-3 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3",
                  shift?.shift_type === t.name
                    ? "bg-blue-50 text-blue-700"
                    : "",
                ].join(" ")}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {isMobile
                      ? t.name.split(" ")[0] +
                        (t.name.includes("Shift") ? " Shift" : "")
                      : t.name}
                  </div>
                  {isMobile && t.name.includes("Shift") && (
                    <div className="text-xs text-gray-500">
                      {t.name.includes("Morning")}
                      {t.name.includes("Evening")}
                      {t.name.includes("Night")}
                    </div>
                  )}
                </div>
                {shift?.shift_type === t.name && (
                  <span className="text-xs text-blue-600">✓</span>
                )}
              </button>
            ))}
            {shift && (
              <button
                onClick={() => handleShiftSelect(day, "")}
                className="w-full px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50 border-t"
              >
                Remove Shift
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const weekDays = isMobile
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate"> {memberName}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedDates.length > 0 && (
              <div className="text-sm text-purple-600 font-medium mr-2">
                {selectedDates.length} selected
              </div>
            )}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMobileView(mobileView === "grid" ? "list" : "grid")
                }
              >
                {mobileView === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-gray-600">
            {canEdit
              ? isMobile
                ? `Tap any day to assign shifts. ${
                    mobileView === "grid"
                      ? "Switch to list view for easier browsing."
                      : "Switch to grid view for calendar layout."
                  }`
                : "Click on any day to assign or change shifts."
              : "View-only schedule. Colors represent different shift types."}
          </p>
          {canEdit && (
            <p className="text-xs text-purple-600">
              Hold Ctrl/Cmd and click to select multiple dates for bulk updates
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Desktop week headers */}
        {!isMobile && (
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((wd) => (
              <div
                key={wd}
                className="p-2 text-center text-sm font-medium text-gray-600"
              >
                {wd}
              </div>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        {renderCalendarGrid()}

        {/* Floating action button for multi-select */}
        {renderActionButton()}

        {/* Debug info in development */}
        {/* {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div>
              <strong>Debug Info:</strong>
            </div>
            <div>
              Current Month: {month + 1}/{year}
            </div>
            <div>Days in Month: {daysInMonth}</div>
            <div>Valid Days: {allDays.length}</div>
            <div>Shifts Count: {shifts.length}</div>
            <div>
              Last Day Data: {JSON.stringify(allDays[allDays.length - 1])}
            </div>
          </div>
        )} */}

        {/* Legend */}
        <div className="mt-4 sm:mt-6 pt-4 border-t">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
            Shift Types
          </h4>
          <div
            className={`grid gap-2 ${
              isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {SHIFT_TYPES.map((t) => (
              <div key={t.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-xs sm:text-sm text-gray-600 truncate">
                  {isMobile
                    ? t.name.split(" ")[0] +
                      (t.name.includes("Shift") ? " Shift" : "")
                    : t.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile help */}
        {isMobile && canEdit && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              💡{" "}
              {mobileView === "grid"
                ? "Grid view shows 3 days per row for easier tapping. Switch to list view for a different layout."
                : "List view shows all days vertically. Switch to grid view for traditional calendar layout."}
            </p>
          </div>
        )}

        {/* Multi-select action bar */}
        {selectedDates.length > 0 && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4">
            <div className="bg-white rounded-full shadow-lg border border-purple-200 p-2 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3">
                <span className="text-sm font-medium text-purple-600">
                  {selectedDates.length} dates selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDates([])}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setActiveDropdown(selectedDates[0])}
                  className="px-4 py-1 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 cursor-pointer"
                >
                  Update All
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
