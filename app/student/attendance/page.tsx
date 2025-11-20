"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    Clock,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    BookOpen,
    Calendar,
    TrendingUp,
    User
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

// --- Interfaces ---
interface Student {
    _id: string;
    first_name?: string;
    name?: string;
    roll_no: string;
    course: string;
    semester: number;
    userId?: string;
}

interface AttendanceSubject {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalClasses: number;
    attendedClasses: number;
    percentage?: number;
}

interface DailyAttendance {
    date: string;
    dayOrder: string;
    periods: {
        H1: string;
        H2: string;
        H3: string;
        H4: string;
        H5: string;
        H6: string;
        [key: string]: string;
    };
}

// --- Chart Components ---
const AttendanceDonutChart = ({ percentage, size = 100 }: { percentage: number; size?: number }) => {
    const radius = size / 2 - 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 75 ? "#10b981" : "#ef4444";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
};

const MiniBarChart = ({ data }: { data: { label: string; value: number; total: number }[] }) => {
    return (
        <div className="space-y-2">
            {data.map((item, index) => {
                const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
                return (
                    <div key={index} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-12 truncate">{item.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">
                            {item.value}/{item.total}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const StatusDistributionChart = ({ present, absent, late, onDuty }: { present: number; absent: number; late: number; onDuty: number }) => {
    const total = present + absent + late + onDuty;
    const data = [
        { label: "Present", value: present, color: "bg-green-500" },
        { label: "Absent", value: absent, color: "bg-red-500" },
        { label: "Late", value: late, color: "bg-yellow-500" },
        { label: "On Duty", value: onDuty, color: "bg-blue-500" },
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-2">
            {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${item.color}`} />
                        <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.value}</span>
                        <span className="text-xs text-gray-500">
                            ({((item.value / total) * 100).toFixed(0)}%)
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ---------- Helpers ----------
const mapStatusToShort = (status: string | undefined) => {
    if (!status) return "-";
    const s = String(status).toLowerCase();
    if (s === "present" || s === "p") return "P";
    if (s === "absent" || s === "a") return "A";
    if (s === "late" || s === "l") return "L";
    if (s === "on-duty" || s === "onduty" || s === "od") return "O";
    return "-";
};

const weekdayToDayOrder = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        const day = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const map: Record<string, string> = {
            monday: "Day 1", tuesday: "Day 2", wednesday: "Day 3",
            thursday: "Day 4", friday: "Day 5", saturday: "Day 6", sunday: "Day 7"
        };
        return map[day] ?? d.toLocaleDateString("en-US", { weekday: "long" });
    } catch (e) {
        return "";
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const getInitials = (name?: string) => {
    if (!name) return "S";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "S";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ---------- Component ----------
export default function StudentAttendancePage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSubject[]>([]);
    const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "details">("details");

    const [overallPercentage, setOverallPercentage] = useState(0);
    const [totalClasses, setTotalClasses] = useState(0);
    const [totalAttended, setTotalAttended] = useState(0);

    const router = useRouter();
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    // Calculate status distribution
    const statusCounts = dailyAttendance.reduce((acc, day) => {
        Object.values(day.periods).forEach(status => {
            if (status === 'P') acc.present++;
            else if (status === 'A') acc.absent++;
            else if (status === 'L') acc.late++;
            else if (status === 'O') acc.onDuty++;
        });
        return acc;
    }, { present: 0, absent: 0, late: 0, onDuty: 0 });

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                // 1. Fetch User Details (Just for the Header/Profile display)
                const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });

                if (!mounted) return;

                if (userRes.status === 200 && (userRes.data?.user || userRes.data)) {
                    setStudent(userRes.data.user || userRes.data);
                } else {
                    router.push("/login");
                    return;
                }

                // 2. Fetch Attendance Summary (No studentId param needed, backend handles it)
                const attRes = await axios.get(`${API}/attendance/student/summary`, {
                    withCredentials: true
                });

                if (mounted && attRes.status === 200) {
                    const attData: AttendanceSubject[] = attRes.data.attendance || [];
                    const withPercent = attData.map(s => ({
                        ...s,
                        percentage: s.totalClasses > 0 ? (s.attendedClasses / s.totalClasses) * 100 : 0,
                    }));
                    setAttendance(withPercent);
                    calculateStats(withPercent);
                }

                // 3. Fetch Raw Logs (No studentId param needed)
                const dailyRes = await axios.get(`${API}/attendance`, {
                    withCredentials: true,
                });

                if (mounted && dailyRes.status === 200) {
                    const rawDocs = Array.isArray(dailyRes.data) ? dailyRes.data : [];
                    // We need the ID for the helper function, take it from the userRes we just got
                    const uid = (userRes.data.user || userRes.data)._id || (userRes.data.user || userRes.data).userId;

                    const grouped = buildDailyAttendance(rawDocs, uid);
                    setDailyAttendance(grouped);
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

        fetchData();

        return () => { mounted = false; };
    }, [router, API]);
    const calculateStats = (data: AttendanceSubject[]) => {
        if (!data || data.length === 0) {
            setTotalClasses(0); setTotalAttended(0); setOverallPercentage(0); return;
        }
        const total = data.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
        const attended = data.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
        setTotalClasses(total);
        setTotalAttended(attended);
        setOverallPercentage(total > 0 ? (attended / total) * 100 : 0);
    };

    const buildDailyAttendance = (attendanceDocs: any[], studentId: string): DailyAttendance[] => {
        const map: Record<string, DailyAttendance> = {};

        attendanceDocs.forEach(doc => {
            const date = doc.date || doc.createdAt;
            if (!date) return;

            const dateISO = (new Date(date)).toISOString().split("T")[0];

            if (!map[dateISO]) {
                map[dateISO] = {
                    date: dateISO,
                    dayOrder: weekdayToDayOrder(dateISO),
                    periods: { H1: "-", H2: "-", H3: "-", H4: "-", H5: "-", H6: "-" }
                };
            }

            const periodNum = Number(doc.period);
            if (!periodNum) return;
            const periodKey = `H${periodNum}`;

            let recStatus = "-";
            if (Array.isArray(doc.records)) {
                const rec = doc.records.find((r: any) => {
                    return String(r.studentId) === String(studentId) ||
                        (r.studentId?._id && String(r.studentId._id) === String(studentId));
                });
                if (rec) recStatus = mapStatusToShort(rec.status);
            }

            if (recStatus !== "-") {
                map[dateISO].periods[periodKey] = recStatus;
            }
        });

        return Object.values(map).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'P': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">P</span>;
            case 'A': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">A</span>;
            case 'L': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">L</span>;
            case 'O': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">O</span>;
            default: return <span className="bg-gray-100 text-gray-400 px-2 py-1 rounded text-xs">-</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your attendance...</p>
            </div>
        </div>
    );

    if (!student) return null;

    const displayName = student.first_name || student.name || "Student";
    const topSubjects = attendance.slice(0, 4);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-10">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
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
                                    <h1 className="text-xl font-bold text-gray-900 leading-none">Attendance Dashboard</h1>
                                    <p className="text-sm text-gray-500 mt-1">{student.course} • Sem {student.semester}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">Roll No: {student.roll_no}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {getInitials(displayName)}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 bg-white/80 rounded-2xl p-2 w-fit border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "overview"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        📊 Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === "details"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        📅 Daily Record
                    </button>
                </div>

                {activeTab === "overview" ? (
                    /* Overview Tab */
                    <div className="space-y-8">
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Overall Attendance Card */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Attendance</h3>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`text-3xl font-bold ${overallPercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                                {overallPercentage.toFixed(1)}%
                                            </div>
                                            {overallPercentage >= 75 ? (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {totalAttended} of {totalClasses} classes attended
                                        </p>
                                    </div>
                                    <AttendanceDonutChart percentage={overallPercentage} size={100} />
                                </div>
                            </div>

                            {/* Supporting Stats */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
                                        <h2 className="text-2xl font-bold text-gray-900">{totalClasses}</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Classes Attended</p>
                                        <h2 className="text-2xl font-bold text-gray-900">{totalAttended}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Status Distribution */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Status Distribution
                                </h3>
                                <StatusDistributionChart {...statusCounts} />
                            </div>

                            {/* Top Subjects */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Subject Performance</h3>
                                {topSubjects.length > 0 ? (
                                    <MiniBarChart
                                        data={topSubjects.map(subject => ({
                                            label: subject.subjectCode,
                                            value: subject.attendedClasses,
                                            total: subject.totalClasses
                                        }))}
                                    />
                                ) : (
                                    <p className="text-gray-500 text-sm">No subject data available</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                                <div className="text-2xl font-bold">{statusCounts.present}</div>
                                <div className="text-sm opacity-90">Present</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 text-white">
                                <div className="text-2xl font-bold">{statusCounts.absent}</div>
                                <div className="text-sm opacity-90">Absent</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 text-white">
                                <div className="text-2xl font-bold">{statusCounts.late}</div>
                                <div className="text-sm opacity-90">Late</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
                                <div className="text-2xl font-bold">{statusCounts.onDuty}</div>
                                <div className="text-sm opacity-90">On Duty</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Details Tab */
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <h2 className="font-semibold text-gray-800">Daily Attendance Record</h2>
                                </div>
                                <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                                    {dailyAttendance.length} Days
                                </span>
                            </div>

                            {dailyAttendance.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">Date</th>
                                                <th className="text-left p-4 text-sm font-semibold text-gray-700">Day</th>
                                                {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map(h => (
                                                    <th key={h} className="text-center p-4 text-sm font-semibold text-gray-700">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {dailyAttendance.map((day, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-sm text-gray-900 font-medium">{formatDate(day.date)}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {day.dayOrder}
                                                        </span>
                                                    </td>
                                                    {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map(h => (
                                                        <td key={h} className="p-4 text-center">
                                                            {getStatusBadge(day.periods[h])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-gray-900 font-medium">No Attendance Records</h3>
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-4">Attendance Legend</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">P</span>
                                    <span className="text-gray-700">Present</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-medium">A</span>
                                    <span className="text-gray-700">Absent</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium">L</span>
                                    <span className="text-gray-700">Late</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">O</span>
                                    <span className="text-gray-700">On Duty</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}