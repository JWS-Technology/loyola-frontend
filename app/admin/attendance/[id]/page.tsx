"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, UserCheck, Users, Calendar, Clock, BookOpen, User } from "lucide-react";

export default function AdminAttendanceDetail() {
    const router = useRouter();
    const params = useParams();
    const attendanceId = params.id;

    const [attendance, setAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isPresent = (status: string) => {
        if (!status) return false;
        return status.toLowerCase() === 'present' || status === 'p';
    };

    useEffect(() => {
        const fetchAttendanceDetail = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/attendance/${attendanceId}`, {
                    withCredentials: true,
                });
                setAttendance(res.data);
            } catch (err) {
                console.error("Failed to fetch attendance detail", err);
            } finally {
                setLoading(false);
            }
        };

        if (attendanceId) fetchAttendanceDetail();
    }, [attendanceId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm">Loading attendance details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!attendance) {
        return (
            <div className="min-h-screen bg-white p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-gray-700 font-medium mb-2">Attendance record not found</h3>
                        <p className="text-gray-500 text-sm mb-4">The requested attendance record could not be loaded.</p>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const presentCount = attendance.records.filter((r: any) => isPresent(r.status)).length;
    const totalCount = attendance.records.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-4xl mx-auto space-y-6">
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
                            <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {attendance.subjectId?.name || "Unknown Subject"} • Period {attendance.period}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Present Students</p>
                                <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Users className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Absent Students</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCount - presentCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session Information */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Date</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(attendance.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Clock className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Period</p>
                                    <p className="font-medium text-gray-900">Period {attendance.period}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Course & Subject</p>
                                    <p className="font-medium text-gray-900">{attendance.courseId?.name || "Unknown Course"}</p>
                                    <p className="text-sm text-gray-500">{attendance.subjectId?.name || "Unknown Subject"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Staff Member</p>
                                    <p className="font-medium text-gray-900">{attendance.staffId?.name || "Unassigned"}</p>
                                    <p className="text-sm text-gray-500">{attendance.staffId?.email || "No email"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Student Attendance</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalCount} students • {presentCount} present • {totalCount - presentCount} absent
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                    <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.records.map((record: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="p-4 text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                                                    {record.studentName?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {record.studentName || "Unknown Student"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{record.rollNo || "—"}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isPresent(record.status)
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {isPresent(record.status) ? (
                                                        <>
                                                            <UserCheck className="w-3 h-3 mr-1" />
                                                            Present
                                                        </>
                                                    ) : (
                                                        "Absent"
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">Overall Attendance</span>
                        <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full ${percentage >= 80 ? 'bg-green-500' :
                                    percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0%</span>
                        <span>{presentCount} / {totalCount} students</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}