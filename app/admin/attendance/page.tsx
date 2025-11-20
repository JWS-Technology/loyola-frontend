"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Search, Filter, Calendar, Download, Users, BookOpen, UserCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";

export default function AdminAttendanceView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [staffCache, setStaffCache] = useState<Record<string, any>>({});
    const [date, setDate] = useState(new Date());
    const [courseId, setCourseId] = useState("");

    const [courses] = useState([
        { _id: "673", name: "B.Sc Computer Science" },
        { _id: "674", name: "B.Com Commerce" },
        { _id: "675", name: "B.A English Literature" },
        { _id: "676", name: "BBA Business Administration" }
    ]);

    const router = useRouter();

    useEffect(() => {
        setLastUpdated(new Date().toLocaleString());
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isPresent = (status: string) => {
        if (!status) return false;
        return status.toLowerCase() === 'present' || status === 'p';
    };

    useEffect(() => {
        if (logs.length > 0) {
            const fetchMissingStaffDetails = async () => {
                const idsToFetch = new Set<string>();
                const newCache = { ...staffCache };

                logs.forEach((log) => {
                    const sId = log.staffId;
                    if (sId && typeof sId === 'string' && !staffCache[sId]) {
                        idsToFetch.add(sId);
                    }
                });

                if (idsToFetch.size > 0) {
                    await Promise.all(Array.from(idsToFetch).map(async (id) => {
                        try {
                            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/staff/${id}`);
                            newCache[id] = res.data;
                        } catch (err) {
                            console.error(`Failed to fetch staff ${id}:`, err);
                        }
                    }));
                    setStaffCache(newCache);
                }

                // Calculate stats
                let totalStudents = 0;
                let presentStudents = 0;

                logs.forEach(log => {
                    totalStudents += log.records.length;
                    presentStudents += log.records.filter((r: any) => isPresent(r.status)).length;
                });

                const percentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
                setStats({ total: totalStudents, present: presentStudents, percentage });
            };

            fetchMissingStaffDetails();
        } else {
            setStats({ total: 0, present: 0, percentage: 0 });
        }
    }, [logs]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (date) params.date = date.toISOString().split('T')[0];
            if (courseId) params.courseId = courseId;

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, {
                params,
                withCredentials: true
            });

            setLogs(res.data);
            setLastUpdated(new Date().toLocaleString());
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };


    const getStaffDisplayData = (staffIdField: any) => {
        if (!staffIdField) return null;
        if (typeof staffIdField === 'object') return staffIdField;
        if (typeof staffIdField === 'string') {
            return staffCache[staffIdField] || { name: 'Loading...', email: 'Fetching...' };
        }
        return null;
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Period', 'Staff', 'Subject', 'Course', 'Present Count', 'Total Students'];
        const csvData = logs.map(log => {
            const staff = getStaffDisplayData(log.staffId);
            const presentCount = log.records.filter((r: any) => isPresent(r.status)).length;
            return [
                new Date(log.date).toLocaleDateString(),
                log.period,
                staff?.name || 'Unassigned',
                log.subjectId?.name || 'Unknown Subject',
                log.courseId?.name || 'Unknown Course',
                presentCount,
                log.records.length
            ];
        });

        const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${date}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                            <p className="text-gray-500 text-sm mt-1">Comprehensive overview of all attendance data</p>
                        </div>
                    </div>

                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Students Present</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.present} / {stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Overall Attendance</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.percentage}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Select Date
                                </label>
                                <DatePicker
                                    selected={date}
                                    onChange={(d: Date) => setDate(d)}
                                    dateFormat="yyyy-MM-dd"
                                    className="w-full border text-black border-gray-300 rounded-xl px-10 py-3 text-sm bg-no-repeat bg-right bg-contain"
                                    style={{ backgroundImage: 'url("/logo.png")' }} // <-- remove 'public', just "/logo.png"
                                    calendarClassName="rounded-xl shadow-lg border border-gray-200"
                                    dayClassName={() => "hover:bg-blue-100 rounded-lg"}
                                    popperClassName="z-50"
                                />

                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Course
                                </label>
                                <select
                                    value={courseId}
                                    onChange={(e) => setCourseId(e.target.value)}
                                    className="w-full border text-black border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="lg:col-span-2 flex items-end gap-3">
                                <button
                                    onClick={fetchAttendance}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
                                >
                                    <Filter size={18} />
                                    {loading ? "Applying..." : "Apply Filters"}
                                </button>
                                <button
                                    onClick={() => {
                                        setDate(new Date());
                                        setCourseId("");
                                    }}
                                    className="px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 text-sm">Loading attendance records...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-gray-700 font-medium mb-2">No records found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or select a different date</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-gray-700">Date / Period</th>
                                        <th className="p-4 text-left font-semibold text-gray-700">Staff</th>
                                        <th className="p-4 text-left font-semibold text-gray-700">Subject</th>
                                        <th className="p-4 text-left font-semibold text-gray-700">Course</th>
                                        <th className="p-4 text-center font-semibold text-gray-700">Attendance</th>
                                        <th className="p-4 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log: any) => {
                                        const presentCount = log.records.filter((r: any) => isPresent(r.status)).length;
                                        const totalCount = log.records.length;
                                        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
                                        const staff = getStaffDisplayData(log.staffId);

                                        return (
                                            <tr
                                                key={log._id}
                                                className="hover:bg-gray-50/80 transition-colors duration-150 cursor-pointer group"
                                                onClick={() => router.push(`/admin/attendance/${log._id}`)}
                                            >
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900">
                                                        {new Date(log.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                                                        Period {log.period}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {staff ? (
                                                            <>
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                                                    {staff.name ? staff.name.charAt(0) : '?'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-gray-900 truncate">{staff.name || 'Loading...'}</div>
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {staff.email || ''}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold shadow-sm">
                                                                    ?
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-500 italic">Unassigned</div>
                                                                    <div className="text-xs text-gray-400">No staff record</div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-900">{log.subjectId?.name || "Unknown Subject"}</div>
                                                    <div className="text-xs text-gray-500">{log.subjectId?.code || "No code"}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {log.courseId?.name || "Unknown Course"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${percentage >= 80 ? 'bg-green-100 text-green-800' :
                                                            percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {presentCount} / {totalCount} ({percentage}%)
                                                        </span>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 max-w-[80px]">
                                                            <div
                                                                className={`h-1.5 rounded-full ${percentage >= 80 ? 'bg-green-500' :
                                                                    percentage >= 60 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-xs text-gray-500">
                        Last updated: {lastUpdated} • {logs.length} records displayed
                    </p>
                </div>
            </div>
        </div>
    );
}