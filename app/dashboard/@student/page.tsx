"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import GreetingHeader from "@/components/student/greeting-header";
import AttendanceOverview from "@/components/student/attendance-overview";
import NotificationsList from "@/components/student/notifications-list";
import { getStudentStats, type SubjectAttendanceStats } from "@/lib/api/attendance-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { listNotifications, INotification } from "@/lib/api/notification";




export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<SubjectAttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [notifications, setNotifications] = useState<INotification[]>([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        if (!user?._id) {
          throw new Error("User information not available");
        }

        const stats = await getStudentStats();
        setAttendance(stats);
        
        const notifs = await listNotifications();
        setNotifications(notifs);
        setError(null);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError(err instanceof Error ? err.message : "Failed to load attendance data");
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchAttendanceData();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      {/* Greeting Header */}
      <GreetingHeader userName={user?.first_name || user?.name || "Student"} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ) : attendance.length > 0 ? (
            <AttendanceOverview attendance={attendance} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No attendance data available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
        <NotificationsList notifications={notifications} />
        </div>
      </div>
    </div>
  );
}