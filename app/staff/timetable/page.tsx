"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, BookOpen, Users, ChevronDown, ChevronUp } from "lucide-react";

interface TimetableItem {
    _id: string;
    day: string;
    period: number;
    staffId: { name: string; email: string };
    courseId: { name: string; code: string };
    subjectId: { name: string; code: string };
    semester: number;
}

const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetableListPage() {
    const [loading, setLoading] = useState(true);
    const [timetable, setTimetable] = useState<TimetableItem[]>([]);
    const [staff, setStaff] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState<string>("All");
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

    // 1️⃣ Load logged-in staff
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const res = await axios.get(`${API}/auth/me`, {
                    withCredentials: true,
                });
                setStaff(res.data.user);
            } catch (error) {
                console.error("Failed to load staff:", error);
            }
        };

        fetchStaff();
    }, []);

    // 2️⃣ Load timetable when staff is ready
    useEffect(() => {
        if (!staff?._id) return;

        const fetchTimetable = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const res = await axios.get(`${API}/timetable/staff/${staff._id}`, {
                    withCredentials: true,
                });

                setTimetable(res.data.timetable);
            } catch (err) {
                console.error("Error loading timetable:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [staff]);

    // Group timetable by day
    const timetableByDay = timetable.reduce((acc, item) => {
        if (!acc[item.day]) {
            acc[item.day] = [];
        }
        acc[item.day].push(item);
        return acc;
    }, {} as Record<string, TimetableItem[]>);

    // Sort days and periods
    const sortedDays = Object.keys(timetableByDay).sort((a, b) =>
        daysOrder.indexOf(a) - daysOrder.indexOf(b)
    );

    sortedDays.forEach(day => {
        timetableByDay[day].sort((a, b) => a.period - b.period);
    });

    const filteredDays = selectedDay === "All" ? sortedDays : [selectedDay];

    const toggleDay = (day: string) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(day)) {
            newExpanded.delete(day);
        } else {
            newExpanded.add(day);
        }
        setExpandedDays(newExpanded);
    };

    const getPeriodColor = (period: number) => {
        const colors = [
            "bg-blue-50 border-blue-200 text-blue-700",
            "bg-green-50 border-green-200 text-green-700",
            "bg-purple-50 border-purple-200 text-purple-700",
            "bg-orange-50 border-orange-200 text-orange-700",
            "bg-pink-50 border-pink-200 text-pink-700",
            "bg-indigo-50 border-indigo-200 text-indigo-700",
        ];
        return colors[(period - 1) % colors.length];
    };

    const getDayColor = (day: string) => {
        const colors: Record<string, string> = {
            Monday: "bg-blue-500",
            Tuesday: "bg-green-500",
            Wednesday: "bg-purple-500",
            Thursday: "bg-orange-500",
            Friday: "bg-red-500",
            Saturday: "bg-indigo-500",
            Sunday: "bg-gray-500",
        };
        return colors[day] || "bg-gray-500";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading your timetable…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">My Timetable</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        {timetable.length} scheduled classes across {sortedDays.length} days
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{sortedDays.length}</div>
                        <div className="text-gray-600">Days</div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{timetable.length}</div>
                        <div className="text-gray-600">Total Classes</div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {new Set(timetable.map(item => item.subjectId?.code)).size}
                        </div>
                        <div className="text-gray-600">Subjects</div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mx-auto mb-3">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {new Set(timetable.map(item => item.courseId?.code)).size}
                        </div>
                        <div className="text-gray-600">Courses</div>
                    </div>
                </div>

                {/* Day Filter */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    <button
                        onClick={() => setSelectedDay("All")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDay === "All"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        All Days
                    </button>
                    {sortedDays.map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDay === day
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Timetable Cards */}
                <div className="space-y-4">
                    {filteredDays.map(day => (
                        <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Day Header */}
                            <button
                                onClick={() => toggleDay(day)}
                                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-8 rounded-full ${getDayColor(day)}`} />
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{day}</h3>
                                        <p className="text-gray-600 text-sm">
                                            {timetableByDay[day].length} class{timetableByDay[day].length !== 1 ? 'es' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                        {expandedDays.has(day) ? "Collapse" : "Expand"}
                                    </span>
                                    {expandedDays.has(day) ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Classes List */}
                            {(expandedDays.has(day) || selectedDay !== "All") && (
                                <div className="border-t border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                        {timetableByDay[day].map((item) => (
                                            <div
                                                key={item._id}
                                                className={`border-2 rounded-xl p-5 transition-all hover:scale-105 hover:shadow-md ${getPeriodColor(item.period)}`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                            <Clock className="w-4 h-4 text-current" />
                                                        </div>
                                                        <span className="font-bold text-lg">Hour {item.period}</span>
                                                    </div>
                                                    <div className="bg-white/80 px-2 py-1 rounded-full text-xs font-medium">
                                                        Sem {item.semester}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Subject</div>
                                                        <div className="font-semibold text-gray-900">
                                                            {item.subjectId?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {item.subjectId?.code}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Course</div>
                                                        <div className="font-semibold text-gray-900">
                                                            {item.courseId?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {item.courseId?.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {timetable.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Scheduled</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Your timetable is currently empty. Classes will appear here once they are scheduled.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}