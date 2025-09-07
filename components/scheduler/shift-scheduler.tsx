/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { supabase, type Member, type Shift } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react";
import { MemberManagement } from "./member-management";
import { ShiftCalendar } from "./shift-calendar";
import { MonthlySummary } from "./monthly-summary";

export function ShiftScheduler() {
  const { user, session } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) void fetchShifts();
  }, [selectedMemberId, currentDate]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("employee_id");
      if (error) {
        console.error("Fetch members error:", error);
        throw error;
      }
      setMembers(data ?? []);

      // Auto-select first member if none selected
      if (data && data.length > 0 && !selectedMemberId) {
        setSelectedMemberId(data[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError("Failed to load members: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    if (!selectedMemberId) return;
    try {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const start = new Date(y, m, 1).toISOString().slice(0, 10);
      const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);

      console.log("Fetching shifts for date range:", {
        start,
        end,
        selectedMemberId,
      });

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("member_id", selectedMemberId)
        .gte("date", start)
        .lte("date", end)
        .order("date");

      if (error) {
        console.error("Fetch shifts error:", error);
        throw error;
      }

      console.log("Fetched shifts:", data);
      setShifts(data ?? []);
    } catch (err: any) {
      console.error("Error fetching shifts:", err);
      setError("Failed to load shifts: " + (err?.message || "Unknown error"));
    }
  };

  const updateShift = async (date: string, shiftType: string) => {
    console.log("=== UPDATE SHIFT CALLED ===");
    console.log(
      "Date:",
      date,
      "Shift type:",
      shiftType,
      "Member:",
      selectedMemberId
    );

    // Basic validation
    if (!date || !selectedMemberId || !user || !session) {
      const errorMsg = !date
        ? "Invalid date"
        : !selectedMemberId
        ? "No member selected"
        : "Not authenticated";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate date format and existence
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error("Invalid date format:", date);
      setError("Invalid date format");
      return;
    }

    // Parse and validate the date components
    const [yearStr, monthStr, dayStr] = date.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const day = Number.parseInt(dayStr, 10);

    // Check if this date actually exists
    const testDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const testDateStr = `${testDate.getFullYear()}-${String(
      testDate.getMonth() + 1
    ).padStart(2, "0")}-${String(testDate.getDate()).padStart(2, "0")}`;

    if (testDateStr !== date) {
      console.error(
        "Invalid date:",
        date,
        "- date mismatch after reconstruction:",
        testDateStr
      );
      setError(`Invalid date: ${date}. This date does not exist.`);
      return;
    }

    console.log("Date validation passed");
    setError(null);
    setUpdating(true);

    try {
      // Check for existing shift
      const { data: existingShift, error: fetchError } = await supabase
        .from("shifts")
        .select("*")
        .eq("member_id", selectedMemberId)
        .eq("date", date)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing shift:", fetchError);
        throw new Error("Failed to check existing shift");
      }

      console.log("Existing shift:", existingShift);

      if (shiftType === "" || shiftType === null) {
        // Remove shift
        if (existingShift) {
          const { error: deleteError } = await supabase
            .from("shifts")
            .delete()
            .eq("id", existingShift.id);

          if (deleteError) {
            console.error("Delete error:", deleteError);
            throw new Error("Failed to delete shift");
          }

          console.log("Shift deleted successfully");
        }
      } else if (existingShift) {
        if (existingShift.shift_type === shiftType) {
          // Same shift type - toggle off (delete)
          const { error: deleteError } = await supabase
            .from("shifts")
            .delete()
            .eq("id", existingShift.id);

          if (deleteError) {
            console.error("Toggle delete error:", deleteError);
            throw new Error("Failed to remove shift");
          }

          console.log("Shift toggled off successfully");
        } else {
          // Update to new shift type
          const { error: updateError } = await supabase
            .from("shifts")
            .update({ shift_type: shiftType })
            .eq("id", existingShift.id);

          if (updateError) {
            console.error("Update error:", updateError);
            throw new Error("Failed to update shift");
          }

          console.log("Shift updated successfully");
        }
      } else {
        // Create new shift
        const { error: insertError } = await supabase.from("shifts").insert({
          member_id: selectedMemberId,
          date: date,
          shift_type: shiftType,
        });

        if (insertError) {
          console.error("Insert error:", insertError);

          // Handle duplicate key error specifically
          if (
            insertError.code === "23505" ||
            insertError.message?.includes("duplicate")
          ) {
            // Try to update instead
            const { error: updateError } = await supabase
              .from("shifts")
              .update({ shift_type: shiftType })
              .eq("member_id", selectedMemberId)
              .eq("date", date);

            if (updateError) {
              console.error("Update after duplicate error:", updateError);
              throw new Error("Failed to update existing shift");
            }

            console.log("Updated existing shift after duplicate key error");
          } else {
            throw new Error("Failed to create shift");
          }
        } else {
          console.log("New shift created successfully");
        }
      }

      // Refresh the shifts data
      console.log("Refreshing shifts data...");
      await fetchShifts();
    } catch (err: any) {
      console.error("Update shift error:", err);
      const errorMessage = err?.message || "Failed to update shift";
      setError(errorMessage);
    } finally {
      setUpdating(false);
      console.log("=== UPDATE SHIFT COMPLETED ===");
    }
  };

  const navigateMonth = (dir: "prev" | "next") => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (dir === "prev" ? -1 : 1));
      return d;
    });
  };

  const refreshData = async () => {
    await fetchMembers();
    if (selectedMemberId) {
      await fetchShifts();
    }
  };

  if (false) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-500">
              Please log in to access the admin panel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {isMobile ? (
                <div>
                  <div className="font-medium">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div>Manage team shifts</div>
                </div>
              ) : (
                `Manage team members and assign shifts for ${currentDate.toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" }
                )}`
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={updating}
              >
                <RefreshCw
                  className={`h-4 w-4 ${updating ? "animate-spin" : ""}`}
                />
                {!isMobile && <span className="ml-1">Refresh</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
                {!isMobile && <span className="ml-1">Prev</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                {!isMobile && <span className="ml-1">Next</span>}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MemberManagement members={members} onMembersChange={fetchMembers} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-2 sm:gap-3 ${
              isMobile
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {members.map((m) => (
              <Button
                key={m.id}
                variant={selectedMemberId === m.id ? "default" : "outline"}
                className="justify-start h-auto p-3 text-left"
                onClick={() =>
                  setSelectedMemberId(selectedMemberId === m.id ? null : m.id)
                }
              >
                <div className="w-full">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs opacity-70">ID: {m.employee_id}</div>
                </div>
              </Button>
            ))}
          </div>
          {members.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">
              No members found. Add some members to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedMemberId ? (
        <>
          <MonthlySummary
            shifts={shifts}
            memberName={members.find((m) => m.id === selectedMemberId)?.name}
            isMobile={isMobile}
          />
          <ShiftCalendar
            currentDate={currentDate}
            shifts={shifts}
            onShiftUpdate={updateShift}
            canEdit={true}
            memberName={
              members.find((m) => m.id === selectedMemberId)?.name ?? ""
            }
          />
        </>
      ) : (
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="text-center">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Select a Team Member
              </h3>
              <p className="text-sm text-gray-500">
                Choose a team member above to view and edit their schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
