"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LogOut, CalendarFold, Clock } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Staff {
    _id?: string;
    staffId?: string;
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    designation?: string;
    subjectsHandled?: string[];
    courseIds?: string[];
    joinedYear?: number;
    status?: string;
    __v?: number;
}

type QuickAction = {
    title: string;
    icon: string;
    description: string;
    href: string;
    color: string;
};

export default function StaffDashboard() {
    const [staff, setStaff] = useState<Staff | null>(null);
    const [currentTime, setCurrentTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    // Fetch current user from server using cookie
    useEffect(() => {
        let mounted = true;
        const fetchMe = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    withCredentials: true,
                });

                if (!mounted) return;
                if (res.status === 200 && res.data?.user) {
                    setStaff(res.data.user);
                } else {
                    // If no user returned, redirect to login
                    router.push("/login");
                }
            } catch (err: unknown) {
                // If unauthorized, redirect to login
                if (axios.isAxiosError(err)) {
                    const status = err.response?.status;
                    if (status === 401 || status === 403) {
                        router.push("/login");
                        return;
                    }
                    console.error("Failed to fetch current user:", err);
                    setError("Failed to load user");
                } else {
                    // Non-Axios unexpected error
                    console.error("Failed to fetch current user:", err);
                    setError("Failed to load user");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchMe();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update current time
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(
                new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
            );
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Small util: initials for avatar
    const getInitials = (name?: string) => {
        if (!name) return "U";
        const parts = name.split(" ").filter(Boolean);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Greeting by local time
    const getTimeOfDay = () => {
        const hr = new Date().getHours();
        if (hr < 12) return "Morning";
        if (hr < 17) return "Afternoon";
        return "Evening";
    };

    const quickActions: QuickAction[] = [
        {
            title: "Mark Attendance",
            icon: "📝",
            description: "Take today's class attendance",
            href: "/staff/attendance",
            color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        },
        {
            title: "View Timetable",
            icon: "📅",
            description: "Check your schedule",
            href: "/staff/timetable",
            color: "bg-green-50 border-green-200 hover:bg-green-100",
        },
    ];

    const handleLogout = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
                {},
                { withCredentials: true }
            );
        } catch (err) {
            console.warn("Logout request failed, clearing client and redirecting:", err);
        } finally {
            // ensure client clears anything and redirects to login
            setStaff(null);
            router.push("/login");
        }
    };

    // Show loader while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mb-4" />
                    <p className="text-sm text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If error and no staff, show message and link to login
    if (!staff) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow">
                    <p className="mb-4 text-gray-700">{error || "You are not signed in."}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Mobile First Header */}
                <header className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Logo and College Info */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg sm:rounded-xl p-2 shadow-inner min-w-12 sm:min-w-14">
                                <Image
                                    src="/logo.png"
                                    width={56}
                                    height={56}
                                    alt="Loyola Logo"
                                    className="rounded-lg object-contain w-15 h-15 sm:w-20 sm:h-20"
                                    priority
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight truncate">
                                    Loyola College
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                                    Academic Dashboard
                                </p>

                                {/* Date & Time */}
                                <div className="flex items-center space-x-4 mt-1">
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <CalendarFold className="w-4 h-4" />
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center sm:hidden gap-1 px-3 py-3 sm:px-3 sm:py-1 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 whitespace-nowrap"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>

                        {/* RIGHT SIDE: Desktop user info + logout */}
                        <div className="hidden sm:flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="hidden sm:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                                        {staff?.name || "Guest User"}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        Good {getTimeOfDay().toLowerCase()} ·{" "}
                                        {staff?.designation || staff?.department || "Staff"}
                                    </p>
                                </div>

                                <div className="relative flex-shrink-0">
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm sm:text-lg shadow-md border-2 border-white">
                                        {getInitials(staff?.name)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white" />
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 whitespace-nowrap"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Welcome Card */}
                <div className="sm:hidden bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                                Hi{" "}
                                {(() => {
                                    if (!staff?.name) return "there";
                                    const parts = staff.name.trim().split(" ").filter(Boolean);
                                    return [parts[1], parts[2]].filter(Boolean).join(" ") || parts[0];
                                })()}
                                !
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-600 mb-2">
                                Good {getTimeOfDay()}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                <span className="bg-blue-50 px-2 py-1 rounded-lg text-blue-700">
                                    {staff?.designation}
                                </span>
                                <span className="bg-green-50 px-2 py-1 rounded-lg text-green-700">
                                    {staff?.department}
                                </span>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg">
                                👩‍🏫
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {quickActions.map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className={`block p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 active:scale-95 hover:scale-105 hover:shadow-md ${action.color} min-h-24 sm:min-h-32`}
                            >
                                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{action.icon}</div>
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                                    {action.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {action.description}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Today's Schedule</h4>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                {new Date().toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Web Development</p>
                                    <p className="text-xs text-gray-600">10:00 - 11:00 AM</p>
                                </div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap ml-2">Room 301</span>
                            </div>
                            <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">Database Systems</p>
                                    <p className="text-xs text-gray-600">2:00 - 3:00 PM</p>
                                </div>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full whitespace-nowrap ml-2">Lab 205</span>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h4>
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">3 new</span>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Meeting at 4:00 PM</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">Department meeting in Conference Room</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Assignment Due</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">Web Dev assignment due tomorrow</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2 sm:space-x-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">System Update</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">ERP system maintenance this weekend</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Welcome Message */}
                <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-sm sm:text-base text-gray-600">Powered by JWS Technologies</p>
                </div>
            </div>
        </div>
    );
}
