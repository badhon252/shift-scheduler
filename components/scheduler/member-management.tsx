/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState } from "react";
import { supabase, type Member } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Trash2, Users } from "lucide-react";

export function MemberManagement({
  members,
  onMembersChange,
}: {
  members: Member[];
  onMembersChange: () => void;
}) {
  const { user, session } = useAuth();
  const [newMember, setNewMember] = useState({ employeeId: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !session) {
      setError("You must be logged in to add members");
      return;
    }

    if (!newMember.employeeId.trim() || !newMember.name.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if employee ID already exists
      const { data: exists, error: checkError } = await supabase
        .from("members")
        .select("id")
        .eq("employee_id", newMember.employeeId.trim())
        .maybeSingle();

      if (checkError) {
        console.error("Check existing member error:", checkError);
        throw new Error(
          checkError.message || "Failed to check existing member"
        );
      }

      if (exists) {
        setError("Employee ID already exists");
        setLoading(false);
        return;
      }

      // Insert new member
      const { data, error: insertError } = await supabase
        .from("members")
        .insert({
          employee_id: newMember.employeeId.trim(),
          name: newMember.name.trim(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert member error:", insertError);
        console.error("User session:", session);
        console.error("Auth state:", { user: !!user, session: !!session });
        throw new Error(insertError.message || "Failed to add member");
      }

      console.log("Member added successfully:", data);
      setNewMember({ employeeId: "", name: "" });
      onMembersChange();
    } catch (err: any) {
      console.error("handleAdd error:", err);
      const errorMessage = err?.message || "Failed to add member";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!user || !session) {
      setError("You must be logged in to remove members");
      return;
    }

    if (!confirm(`Remove ${name}? This will delete all their shifts.`)) return;

    setError(null);

    try {
      // Delete shifts first (cascade should handle this, but let's be explicit)
      const { error: shiftsError } = await supabase
        .from("shifts")
        .delete()
        .eq("member_id", id);
      if (shiftsError) {
        console.error("Delete shifts error:", shiftsError);
        // Don't throw here, continue with member deletion
      }

      // Delete member
      const { error: memberError } = await supabase
        .from("members")
        .delete()
        .eq("id", id);
      if (memberError) {
        console.error("Delete member error:", memberError);
        throw new Error(memberError.message || "Failed to delete member");
      }

      onMembersChange();
    } catch (err: any) {
      console.error("handleRemove error:", err);
      const errorMessage = err?.message || "Failed to remove member";
      setError(errorMessage);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500 text-sm">
            Please log in to manage members.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Member Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee-id" className="text-sm">
                Employee ID
              </Label>
              <Input
                id="employee-id"
                placeholder="17006"
                value={newMember.employeeId}
                onChange={(e) =>
                  setNewMember((p) => ({ ...p, employeeId: e.target.value }))
                }
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-sm">
                Full Name
              </Label>
              <Input
                id="full-name"
                placeholder="Md. Istiaqe Ahmed"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember((p) => ({ ...p, name: e.target.value }))
                }
                required
                disabled={loading}
                className="text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 text-sm">
            Current Members ({members.length})
          </h4>
          <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    ID: {m.employee_id}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.id, m.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
