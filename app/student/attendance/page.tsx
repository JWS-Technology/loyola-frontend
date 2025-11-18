"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    LogOut,
    Clock,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertCircle,
    BookOpen
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface Student {
    _id: string;
    first_name?: string;
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

// --- Pie Chart Component ---
const PieChart = ({ percentage, size = 80, strokeWidth = 8, lowAttendance = false }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    lowAttendance?: boolean;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage < 75) return lowAttendance ? "#ef4444" : "#dc2626"; // red
        return "#16a34a"; // green
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
};

// --- Donut Chart for Overall Stats ---
const DonutChart = ({ attended, total, size = 120, strokeWidth = 12 }: {
    attended: number;
    total: number;
    size?: number;
    strokeWidth?: number;
}) => {
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => percentage < 75 ? "#ef4444" : "#16a34a";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-bold ${percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                    {percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 mt-1">
                    {attended}/{total}
                </span>
            </div>
        </div>
    );
};

export default function StudentAttendancePage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived stats
    const [overallPercentage, setOverallPercentage] = useState(0);
    const [totalClasses, setTotalClasses] = useState(0);
    const [totalAttended, setTotalAttended] = useState(0);

    const router = useRouter();

    // --- 1. Authentication & Data Fetching ---
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

                // 1. Fetch User
                const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });

                if (!mounted) return;

                if (userRes.status === 200 && userRes.data?.user) {
                    setStudent(userRes.data.user);

                    // 2. Fetch Attendance
                    const uid = userRes.data.user._id || userRes.data.user.userId;
                    if (uid) {
                        const attRes = await axios.get(`${API}/attendance/student/summary`, { withCredentials: true });
                        if (attRes.status === 200) {
                            const attData: AttendanceSubject[] = attRes.data.attendance || [];
                            setAttendance(attData);
                            calculateStats(attData);
                        }
                    }
                } else {
                    router.push("/login");
                }
            } catch (err: any) {
                if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                    router.push("/login");
                } else {
                    console.error("Error loading data", err);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();
        return () => { mounted = false; };
    }, [router]);

    // --- 2. Calculate Overall Stats ---
    const calculateStats = (data: AttendanceSubject[]) => {
        if (data.length === 0) return;

        const total = data.reduce((acc, curr) => acc + curr.totalClasses, 0);
        const attended = data.reduce((acc, curr) => acc + curr.attendedClasses, 0);

        setTotalClasses(total);
        setTotalAttended(attended);
        setOverallPercentage(total > 0 ? (attended / total) * 100 : 0);
    };

    // --- Utilities ---
    const getInitials = (name?: string) => {
        if (!name) return "S";
        const parts = name.split(" ").filter(Boolean);
        if (parts.length === 0) return "S";
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const handleLogout = async () => {
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
        } finally {
            router.push("/login");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!student) return null;
    const displayName = student.first_name || "Student";

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* --- Header (Simplified) --- */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-3">
                                <Image src="/logo.png" width={40} height={40} alt="Logo" className="rounded-lg" />
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 leading-none">My Attendance</h1>
                                    <p className="text-xs text-gray-500 mt-1">{student.course} • Sem {student.semester}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{student.roll_no}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                {getInitials(displayName)}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* --- Overall Stats Cards with Donut Chart --- */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* Main Overall Attendance Card with Donut Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <DonutChart
                                attended={totalAttended}
                                total={totalClasses}
                                size={120}
                                strokeWidth={12}
                            />
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Attendance</h3>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                                    <div className={`text-2xl font-bold ${overallPercentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                        {overallPercentage.toFixed(1)}%
                                    </div>
                                    {overallPercentage < 75 && (
                                        <AlertCircle className="w-5 h-5 text-red-500" title="Low Attendance" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Attended <span className="font-semibold text-gray-900">{totalAttended}</span> out of <span className="font-semibold text-gray-900">{totalClasses}</span> total sessions
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-600">Attended</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                                        <span className="text-gray-600">Missed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supporting Stats Cards */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
                            <h2 className="text-2xl font-bold text-gray-900">{totalClasses}</h2>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Classes Attended</p>
                            <h2 className="text-2xl font-bold text-gray-900">{totalAttended}</h2>
                        </div>
                    </div>
                </div>

                {/* --- Subject List with Pie Charts --- */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800">Subject Wise Breakdown</h2>
                        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                            {attendance.length} Subjects
                        </span>
                    </div>

                    {attendance.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {attendance.map((subject) => (
                                <div key={subject.subjectId} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Subject Info and Progress Bar */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <h3 className="font-semibold text-gray-900 text-base">{subject.subjectName}</h3>
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                                                    {subject.subjectCode}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">Progress</span>
                                                    <span className={`font-medium ${subject.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {subject.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${subject.percentage < 75 ? 'bg-red-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${subject.percentage}%` }}
                                                    />
                                                    {/* 75% Marker Line */}
                                                    <div className="absolute top-0 bottom-0 w-0.5 bg-black/10 z-10" style={{ left: '75%' }} title="75% Requirement" />
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600">
                                                Attended <span className="font-medium text-gray-900">{subject.attendedClasses}</span> out of <span className="font-medium text-gray-900">{subject.totalClasses}</span> classes
                                            </p>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="flex flex-col items-center gap-2">
                                            <PieChart
                                                percentage={subject.percentage}
                                                size={70}
                                                strokeWidth={6}
                                                lowAttendance={subject.percentage < 75}
                                            />
                                            {subject.percentage < 75 && (
                                                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Below 75%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium">No Attendance Records</h3>
                            <p className="text-gray-500 text-sm mt-1">Attendance data hasn't been uploaded for this semester yet.</p>
                        </div>
                    )}
                </div>

                {/* --- Attendance Status Legend --- */}
                <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Attendance Status</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">Good (75% and above)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-gray-600">Needs Improvement (Below 75%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                            <span className="text-gray-600">75% Requirement Mark</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}