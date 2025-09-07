"use client";

import { useEffect, useState } from "react";
import { supabase, type Member, type Shift } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, Calendar, Info, LogIn } from "lucide-react";
import { ShiftCalendar } from "./shift-calendar";
import { MonthlySummary } from "./monthly-summary";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PublicScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId, currentDate]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("employee_id");
      if (error) throw error;
      setMembers(data ?? []);
      if (data && data.length) setSelectedMemberId(data[0].id);
    } catch (err) {
      console.error(err);
      setError("Failed to load members");
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
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("member_id", selectedMemberId)
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;
      setShifts(data ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load shifts");
    }
  };

  const navigateMonth = (dir: "prev" | "next") => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (dir === "prev" ? -1 : 1));
      return d;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Public Schedule</CardTitle>
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Admin sign in
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="">
              <Select
                value={selectedMemberId || undefined}
                onValueChange={(value: string) => setSelectedMemberId(value)}
              >
                <SelectTrigger className="md:w-[300px] w-[200px] py-6 cursor-pointer">
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {members.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center md:gap-4 gap-2 md:px-6">
                          <span className="font-medium">{m.name}</span>
                          <span className="text-xs text-gray-500">
                            ID: {m.employee_id}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {selectedMemberId && (
        <>
          <MonthlySummary
            shifts={shifts}
            memberName={members.find((m) => m.id === selectedMemberId)?.name}
            isMobile={isMobile}
          />
          <ShiftCalendar
            currentDate={currentDate}
            shifts={shifts}
            canEdit={false}
            memberName={
              members.find((m) => m.id === selectedMemberId)?.name ?? ""
            }
          />
        </>
      )}
    </div>
  );
}
