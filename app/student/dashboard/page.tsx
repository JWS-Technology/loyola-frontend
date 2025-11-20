"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    LogOut,
    CalendarFold,
    GraduationCap,
    BookOpen,
    Clock,
    FileText,
    FileUser,
    User,
    Mail,
    Phone,
    Users,
    BookOpenText,
    Calendar,
    TrendingUp,
    BarChart3,
    Settings,
    CreditCard,
    Library
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface Student {
    _id: string;
    first_name?: string;
    name?: string;
    roll_no: string;
    email?: string;
    course: string;
    semester: number;
    avatar?: string;
    gender?: string;
    dob?: string;
    parentName?: string;
    contact?: string;
    courseId?: { name: string };
    batch?: number;
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
    badge?: string;
};

// --- Chart Component ---
const MiniProgressChart = ({ percentage, size = 60 }: { percentage: number; size?: number }) => {
    const radius = size / 2 - 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 75 ? "#10b981" : percentage >= 60 ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f3f4f6"
                    strokeWidth="6"
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-bold ${percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {percentage}%
                </span>
            </div>
        </div>
    );
};

export default function StudentDashboard() {
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<"overview" | "profile">("profile");
    const router = useRouter();

    // --- Fetch Student Data ---
    useEffect(() => {
        let mounted = true;

        const fetchMe = async () => {
            try {
                setLoading(true);
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

                const res = await axios.get(`${API}/auth/me`, { withCredentials: true });

                if (!mounted) return;

                if (res.status === 200 && res.data?.user) {
                    setStudent(res.data.user);
                    const uid = res.data.user._id || res.data.user.userId;
                    if (uid) fetchAttendance(uid);
                } else {
                    router.push("/login");
                }
            } catch (err: any) {
                if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                    router.push("/login");
                } else {
                    console.error("Failed to fetch user:", err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

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

        fetchMe();
        return () => { mounted = false; };
    }, [router]);

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
        } finally {
            router.push("/login");
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // Quick Actions
    const quickActions: QuickAction[] = [
        // {
        //     title: "My Timetable",
        //     icon: <CalendarFold className="w-5 h-5" />,
        //     description: "View class schedule",
        //     href: "/student/timetable",
        //     color: "from-blue-500 to-blue-600",
        //     badge: "Updated"
        // },
        {
            title: "Attendance",
            icon: <BarChart3 className="w-5 h-5" />,
            description: "Check attendance records",
            href: "/student/attendance",
            color: "from-green-500 to-green-600"
        },
        // {
        //     title: "Academic Profile",
        //     icon: <GraduationCap className="w-5 h-5" />,
        //     description: "View grades & performance",
        //     href: "/student/grades",
        //     color: "from-purple-500 to-purple-600"
        // },
        // {
        //     title: "Fee Payment",
        //     icon: <CreditCard className="w-5 h-5" />,
        //     description: "Pay semester fees",
        //     href: "/student/fees",
        //     color: "from-orange-500 to-orange-600"
        // },
        // {
        //     title: "Library",
        //     icon: <Library className="w-5 h-5" />,
        //     description: "Search books & resources",
        //     href: "/student/library",
        //     color: "from-indigo-500 to-indigo-600"
        // },
        // {
        //     title: "Settings",
        //     icon: <Settings className="w-5 h-5" />,
        //     description: "Account preferences",
        //     href: "/student/settings",
        //     color: "from-gray-500 to-gray-600"
        // },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">Loading Student Portal...</p>
                </div>
            </div>
        );
    }

    if (!student) return null;

    const displayName = student.first_name || student.name || "Student";
    const overallAttendance = attendance.length > 0
        ? attendance.reduce((sum, subj) => sum + subj.percentage, 0) / attendance.length
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-15 h-15 bg-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                                    <Image
                                        src="/logo.png"
                                        width={56}
                                        height={56}
                                        alt="Loyola Logo"
                                        className="rounded-lg object-contain w-13 h-13 sm:w-15 sm:h-15"
                                        priority
                                    /></div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Loyola College</h1>
                                    <p className="text-sm text-gray-600 hidden sm:block">Student Portal</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Navigation Tabs */}
                            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setActiveSection("overview")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "overview"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setActiveSection("profile")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "profile"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Profile
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                    <p className="text-xs text-gray-500">{student.roll_no}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm">
                                    {getInitials(displayName)}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveSection("overview")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "overview"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveSection("profile")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === "profile"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Profile
                    </button>
                </div>

                {/* Welcome Banner */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Welcome back, {displayName}! 👋</h2>
                            <p className="text-blue-100 opacity-90">Good {getTimeOfDay()} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            {/* <div className="text-right">
                                <p className="text-sm text-blue-200">Overall Attendance</p>
                                <p className="text-2xl font-bold">{overallAttendance.toFixed(1)}%</p>
                            </div>
                            <MiniProgressChart percentage={Math.round(overallAttendance)} size={70} /> */}
                        </div>
                    </div>
                </div>

                {activeSection === "overview" ? (
                    /* DASHBOARD VIEW */
                    <div className="space-y-8">
                        {/* Quick Actions Grid */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Quick Access
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                {quickActions.map((action, index) => (
                                    <a
                                        key={index}
                                        href={action.href}
                                        className={`group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
                                    >
                                        <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform mb-3`}>
                                            {action.icon}
                                        </div>
                                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{action.title}</h4>
                                        <p className="text-xs text-gray-600">{action.description}</p>
                                        {action.badge && (
                                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                {action.badge}
                                            </span>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>


                    </div>
                ) : (
                    /* PROFILE VIEW */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{displayName}</h2>
                                    <p className="text-blue-100">{student.roll_no} • {student.courseId?.name || student.course}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-white/20 px-2 py-1 rounded-full text-xs">Sem {student.semester}</span>
                                        {student.batch && <span className="bg-white/20 px-2 py-1 rounded-full text-xs">Batch {student.batch}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <User className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Full Name</p>
                                                <p className="font-semibold text-gray-900">{displayName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <Mail className="w-5 h-5 text-red-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Email Address</p>
                                                <p className="font-semibold text-gray-900">{student.email || "—"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <Phone className="w-5 h-5 text-green-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Contact Number</p>
                                                <p className="font-semibold text-gray-900">{student.contact || "—"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <Users className="w-5 h-5 text-purple-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Parent/Guardian</p>
                                                <p className="font-semibold text-gray-900">{student.parentName || "—"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Information */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Academic Information</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <BookOpenText className="w-5 h-5 text-teal-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Course</p>
                                                <p className="font-semibold text-gray-900">{student.courseId?.name || student.course || "—"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <GraduationCap className="w-5 h-5 text-orange-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Roll Number</p>
                                                <p className="font-semibold text-gray-900">{student.roll_no}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <Calendar className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <p className="text-xs text-gray-500">Current Semester</p>
                                                <p className="font-semibold text-gray-900">Semester {student.semester}</p>
                                            </div>
                                        </div>

                                        {student.batch && (
                                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                <CalendarFold className="w-5 h-5 text-yellow-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Batch</p>
                                                    <p className="font-semibold text-gray-900">{student.batch}</p>
                                                </div>
                                            </div>
                                        )}

                                        {student.dob && (
                                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                <Calendar className="w-5 h-5 text-pink-600" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Date of Birth</p>
                                                    <p className="font-semibold text-gray-900">{formatDate(student.dob)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 mt-8">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Loyola College Student Portal • Powered by JWS Technologies</p>
                </div>
            </footer>
        </div>
    );
}