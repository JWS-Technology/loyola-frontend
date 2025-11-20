"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Users, BookOpen, CalendarCheck, LogOut, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
    const [admin, setAdmin] = useState<any>(null);
    const [stats, setStats] = useState({ students: 0, staff: 0, courses: 0 });
    const [loading, setLoading] = useState(true); // Added loading state
    const router = useRouter();

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    withCredentials: true // Important for cookies
                });

                // FIX: The controller returns { user, role }, so we check res.data.role
                if (res.data.role !== 'admin') {
                    router.push('/login');
                    return;
                }

                setAdmin(res.data.user);

                // Mock stats for demo
                setStats({ students: 120, staff: 15, courses: 8 });
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, [router]);

    const handleLogout = async () => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
                {},
                { withCredentials: true }
            );
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;
    if (!admin) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Nav */}
            <div className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" />
                    <h1 className="text-xl font-bold">Admin Console</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span>Welcome, {admin.name}</span>
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex gap-2 items-center transition-colors">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users /></div>
                        <div>
                            <p className="text-gray-500">Total Students</p>
                            <h2 className="text-2xl font-bold">{stats.students}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full"><Users /></div>
                        <div>
                            <p className="text-gray-500">Total Staff</p>
                            <h2 className="text-2xl font-bold">{stats.staff}</h2>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><BookOpen /></div>
                        <div>
                            <p className="text-gray-500">Active Courses</p>
                            <h2 className="text-2xl font-bold">{stats.courses}</h2>
                        </div>
                    </div>
                </div>

                {/* Menu Grid */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button
                        onClick={() => router.push('/admin/attendance')}
                        className="bg-white p-6 rounded-xl shadow hover:shadow-md transition flex flex-col items-center text-center group"
                    >
                        <CalendarCheck className="w-12 h-12 text-blue-500 mb-3 group-hover:scale-110 transition" />
                        <h4 className="font-bold text-lg">View Attendance</h4>
                        <p className="text-sm text-gray-500 mt-1">Check logs, filter by date, staff or student</p>
                    </button>

                    {/* Add placeholders for other admin pages */}
                    <div className="bg-white p-6 rounded-xl shadow opacity-60 flex flex-col items-center text-center">
                        <Users className="w-12 h-12 text-gray-400 mb-3" />
                        <h4 className="font-bold text-lg">Manage Users</h4>
                        <p className="text-sm text-gray-500 mt-1">Coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}