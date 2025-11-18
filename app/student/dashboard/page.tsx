"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LogOut, CalendarFold, GraduationCap, BookOpen, Clock, TrendingUp, FileText, FileUser } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- Interfaces ---

interface Student {
    _id: string;
    first_name?: string; // Marked as optional to prevent TS errors if missing
    roll_no: string;
    email?: string;
    course: string;
    semester: number;
    avatar?: string;
}

interface AttendanceSubject {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalClasses: number;
    attendedClasses: number;
    percentage: number;
}

type QuickAction = {
    title: string;
    icon: React.ReactNode;
    description: string;
    href: string;
    color: string;
};

export default function StudentDashboard() {
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    // --- 1. Fetch Current Student User ---
    useEffect(() => {
        let mounted = true;
        const fetchMe = async () => {
            try {
                setLoading(true);
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

                const res = await axios.get(`${API}/auth/me`, {
                    withCredentials: true,
                });

                if (!mounted) return;

                if (res.status === 200 && res.data?.user) {
                    setStudent(res.data.user);
                    // Handle _id vs userId difference in backend responses
                    const uid = res.data.user._id || res.data.user.userId;
                    if (uid) fetchAttendance(uid);
                    console.log(res.data.user)
                } else {
                    router.push("/login");
                }
            } catch (err: any) {
                if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                    router.push("/login");
                } else {
                    console.error("Failed to fetch user:", err);
                    setError("Failed to load profile");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchMe();
        return () => { mounted = false; };
    }, [router]);

    // --- 2. Fetch Attendance Data ---
    const fetchAttendance = async (studentId: string) => {
        try {
            setAttendanceLoading(true);
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

            const res = await axios.get(`${API}/attendance/student/summary`, {
                withCredentials: true,
            });

            if (res.status === 200) {
                setAttendance(res.data.attendance || []);
            }
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setAttendanceLoading(false);
        }
    };

    // --- Utilities ---
    const getInitials = (name?: string) => {
        if (!name) return "S";
        const parts = name.split(" ").filter(Boolean);
        if (parts.length === 0) return "S";
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const getTimeOfDay = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Morning";
        if (hr < 17) return "Afternoon";
        return "Evening";
    };

    const handleLogout = async () => {
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
        } catch (err) {
            console.warn("Logout failed", err);
        } finally {
            setStudent(null);
            router.push("/login");
        }
    };

    const quickActions: QuickAction[] = [
        {
            title: "My Timetable",
            icon: <CalendarFold className="w-6 h-6" />,
            description: "View daily schedule",
            href: "/student/timetable",
            color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
        },
        {
            title: "Attendance",
            icon: <FileUser className="w-6 h-6" />,
            description: "Check semester grades",
            href: "/student/attendance",
            color: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
        },
        {
            title: "Fee Payment",
            icon: <FileText className="w-6 h-6" />,
            description: "Pay semester fees",
            href: "/student/fees",
            color: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
        },
        {
            title: "Library",
            icon: <BookOpen className="w-6 h-6" />,
            description: "Search books",
            href: "/student/library",
            color: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading Student Portal...</p>
                </div>
            </div>
        );
    }

    if (!student) return null;

    // --- Safe Name Accessor ---
    // This prevents the crash if name is missing
    const displayName = student.first_name || "Student";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">

                {/* --- Header --- */}
                <header className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Logo Area */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg sm:rounded-xl p-2 shadow-inner min-w-12 sm:min-w-14">
                                <Image src="/logo.png" width={56} height={56} alt="Loyola Logo" className="rounded-lg object-contain w-12 h-12 sm:w-14 sm:h-14" priority />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight truncate">Loyola College</h1>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Student Portal</p>
                                <div className="flex items-center space-x-4 mt-1">
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Desktop User Info */}
                        <div className="hidden sm:flex items-center justify-end gap-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{student.roll_no} • Sem {student.semester}</p>
                            </div>
                            <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
                                    {getInitials(displayName)}
                                </div>
                            </div>
                            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* --- Mobile Welcome Card --- */}
                <div className="sm:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {/* --- FIX APPLIED HERE: Added fallback for split --- */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Hi, {displayName}! 👋
                            </h2>
                            <p className="text-gray-600 text-sm mb-3">Good {getTimeOfDay()}</p>
                            <div className="flex gap-2">
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">{student.roll_no}</span>
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">Sem {student.semester}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Quick Actions Grid --- */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Quick Actions</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => (
                            <a key={index} href={action.href} className={`block p-4 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-md ${action.color} bg-opacity-50 border-opacity-60 bg-white`}>
                                <div className="mb-3 p-2 bg-white bg-opacity-60 rounded-lg w-fit shadow-sm">{action.icon}</div>
                                <h4 className="font-semibold text-gray-900">{action.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                            </a>
                        ))}
                    </div>
                </div>

                {/* --- Main Dashboard Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Attendance Overview */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                Attendance Overview
                            </h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Current Semester</span>
                        </div>

                        {attendanceLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                                ))}
                            </div>
                        ) : attendance.length > 0 ? (
                            <div className="space-y-5">
                                {attendance.map((subject, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex justify-between items-end mb-1">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">{subject.subjectName}</h4>
                                                <p className="text-xs text-gray-500">{subject.subjectCode}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${subject.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {subject.percentage.toFixed(1)}%
                                                </span>
                                                <p className="text-[10px] text-gray-400">{subject.attendedClasses}/{subject.totalClasses} Sessions</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-1000 ${subject.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${subject.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CalendarFold className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm">No attendance records found for this semester.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Schedule */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-800">Today's Classes</h4>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {new Date().toLocaleDateString("en-US", { weekday: 'long' })}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex flex-col items-center justify-center min-w-[3.5rem] bg-white rounded-lg border border-gray-200 py-2">
                                        <span className="text-xs font-bold text-gray-800">09:00</span>
                                        <span className="text-[10px] text-gray-500">AM</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Java Programming</p>
                                        <p className="text-xs text-gray-500">Room 304 • Mr. John Doe</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
                            <h4 className="font-bold text-lg mb-2">📢 Notice Board</h4>
                            <div className="space-y-3">
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                    <p className="text-sm font-medium text-white">Semester Exams</p>
                                    <p className="text-xs text-blue-100 mt-1">Registration closes on Friday, 24th Nov.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-500">Powered by JWS Technologies</p>
                </div>

            </div>
        </div>
    );
}