"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Clock, Calendar } from "lucide-react";
import GreetingHeader from "@/components/student/greeting-header";
import ClassAttendanceOverview from "@/components/teacher/class-attendance-overview";
import TeacherNotifications from "@/components/teacher/teacher-notifications";
import { format } from "date-fns";
import { listAttendanceSessions, type AttendanceSession } from "@/lib/api/attendance-session";
import Link from "next/link";

const dummyAttendanceData = [
    { className: "Data Structures", classCode: "CS301", totalClasses: 45, averageAttendance: 84, trend: "up" as const },
    { className: "Database Management", classCode: "CS302", totalClasses: 40, averageAttendance: 88, trend: "up" as const },
    { className: "Operating Systems", classCode: "CS303", totalClasses: 42, averageAttendance: 67, trend: "down" as const },
    { className: "Computer Networks", classCode: "CS304", totalClasses: 38, averageAttendance: 76, trend: "stable" as const },
];

const dummyNotifications = [
    {
        id: "1",
        title: "Mid-Semester Exam Schedule",
        message: "Exams will be conducted from Jan 25-30. Please prepare accordingly.",
        type: "announcement" as const,
        postedBy: "Dr. John Doe",
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        targetClass: "CS301",
    },
    {
        id: "2",
        title: "Lab Session Rescheduled",
        message: "Tomorrow's lab is moved to 2:00 PM.",
        type: "warning" as const,
        postedBy: "Dr. John Doe",
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
];

export default function TeacherHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState<AttendanceSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTodaySessions();
    }, []);

    const loadTodaySessions = async () => {
        setLoading(true);
        try {
            const today = format(new Date(), "yyyy-MM-dd");
            const data = await listAttendanceSessions({
                limit: 10,
            });
            setSessions(data.sessions);
        } catch (error) {
            console.error("Failed to load sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSessionTypeBadge = (type: string) => {
        const variants = {
            regular: "default",
            extra: "secondary",
            practical: "outline",
        } as const;
        return variants[type as keyof typeof variants] || "default";
    };

    return (
        <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
            {/* Greeting Header */}
            <GreetingHeader userName={user?.firstName || user?.name || "Teacher"} />

            {/* Today's Classes Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Today's Classes</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(), "EEEE, MMMM dd, yyyy")}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/attendance">View All</Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-48 min-w-70 md:min-w-0 shrink-0" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No classes today</h3>
                            <p className="text-muted-foreground mb-4">
                                Create a new class to start taking attendance
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/attendance">Create Class</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none scrollbar-hide">
                        {sessions.map((session) => (
                            <Card
                                key={session._id}
                                className="hover:shadow-md transition-all cursor-pointer hover:border-primary min-w-70 md:min-w-0 snap-start shrink-0"
                                onClick={() => router.push(`/dashboard/attendance/session/${session._id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            <Badge variant={getSessionTypeBadge(session.session_type)}>
                                                {session.session_type}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base leading-tight">
                                            {session.subject.name}
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {session.subject.code}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{session.batch.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                            {format(new Date(session.start_time), "hh:mm a")} -{" "}
                                            {format(new Date(session.end_time), "hh:mm a")}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Analytics */}
                <div className="space-y-6">
                    <ClassAttendanceOverview attendance={dummyAttendanceData} />
                </div>

                {/* Right Column - Notifications */}
                <div className="space-y-6">
                    <TeacherNotifications
                        notifications={dummyNotifications}
                        teacherName={user?.name || "Teacher"}
                    />
                </div>
            </div>
        </div>
    );
}
