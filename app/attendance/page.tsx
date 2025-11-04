"use client";

import { useEffect, useState } from "react";
import api from "../api/axios";

interface Subject {
    _id: string;
    name: string;
    code?: string;
}

interface Student {
    _id: string;
    roll_no: string;
    first_name: string;
}

interface AttendanceRecord {
    studentId: string;
    status: "present" | "absent" | "late" | "on-duty";
}

export default function AttendancePage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [period, setPeriod] = useState(1);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState({
        subjects: false,
        students: false,
        submitting: false
    });
    const [error, setError] = useState("");

    // Initialize today's date
    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setDate(today);
    }, []);

    // Fetch subjects handled by staff
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(prev => ({ ...prev, subjects: true }));
            setError("");
            try {
                const res = await api.get("/subjects");
                setSubjects(res.data);
            } catch (err) {
                console.error("Failed to fetch subjects:", err);
                setError("Failed to load subjects. Please try again.");
            } finally {
                setLoading(prev => ({ ...prev, subjects: false }));
            }
        };

        fetchSubjects();
    }, []);

    // Fetch students once subject selected
    const fetchStudents = async (subjectId: string) => {
        if (!subjectId) return;

        setLoading(prev => ({ ...prev, students: true }));
        setError("");
        try {
            const res = await api.get(`/students?subjectId=${subjectId}`);
            const studentsData: Student[] = res.data;
            setStudents(studentsData);

            // Initialize all students as present by default
            const initialRecords: AttendanceRecord[] = studentsData.map((s: Student) => ({
                studentId: s._id,
                status: "present"
            }));
            setRecords(initialRecords);
        } catch (err) {
            console.error("Failed to fetch students:", err);
            setError("Failed to load students for this subject.");
            setStudents([]);
            setRecords([]);
        } finally {
            setLoading(prev => ({ ...prev, students: false }));
        }
    };

    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        if (subjectId) {
            fetchStudents(subjectId);
        } else {
            setStudents([]);
            setRecords([]);
        }
    };

    const handleStatusChange = (index: number, status: AttendanceRecord["status"]) => {
        const updated = [...records];
        updated[index] = { ...updated[index], status };
        setRecords(updated);
    };

    const handleMarkAttendance = async () => {
        if (!selectedSubject) {
            setError("Please select a subject");
            return;
        }

        if (records.length === 0) {
            setError("No students to mark attendance for");
            return;
        }

        setLoading(prev => ({ ...prev, submitting: true }));
        setError("");

        try {
            const body = {
                date,
                period,
                subjectId: selectedSubject,
                courseId: "yourCourseId", // will connect later
                staffId: "yourStaffId", // will connect later
                records,
            };

            await api.post("/attendance", body);

            // Show success message
            alert("✅ Attendance marked successfully!");

            // Reset form
            setSelectedSubject("");
            setStudents([]);
            setRecords([]);
            setPeriod(1);

        } catch (err: unknown) {
            console.error("Failed to mark attendance:", err);

            let errorMessage = "Failed to mark attendance. Please try again.";
            if (err instanceof Error) {
                errorMessage = err.message;
            }
            // if it's an axios error:
            if (typeof err === "object" && err && "response" in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                errorMessage = axiosErr.response?.data?.message || errorMessage;
            }

            setError(errorMessage);
        } finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            present: "bg-green-100 text-green-800 border-green-200",
            absent: "bg-red-100 text-red-800 border-red-200",
            late: "bg-yellow-100 text-yellow-800 border-yellow-200",
            "on-duty": "bg-blue-100 text-blue-800 border-blue-200"
        };
        return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStatusCounts = () => {
        return records.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        📘 Mark Attendance
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Select subject and mark student attendance for the day
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-red-400 text-xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto text-red-400 hover:text-red-600"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Controls Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📅 Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Subject Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📚 Subject
                            </label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                                value={selectedSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                disabled={loading.subjects}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((sub: Subject) => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.name} {sub.code && `(${sub.code})`}
                                    </option>
                                ))}
                            </select>
                            {loading.subjects && (
                                <p className="text-sm text-gray-500 mt-1">Loading subjects...</p>
                            )}
                        </div>

                        {/* Period Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ⏰ Period
                            </label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={period}
                                onChange={(e) => setPeriod(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6].map((p) => (
                                    <option key={p} value={p}>
                                        Period {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                {loading.students ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 text-lg">Loading students...</p>
                    </div>
                ) : students.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                        {/* Summary Bar */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Students ({students.length})
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {Object.entries(statusCounts).map(([status, count]) => (
                                        <span
                                            key={status}
                                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Roll No
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Attendance Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student: Student, index: number) => (
                                        <tr
                                            key={student._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {student.roll_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {student.first_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium ${getStatusColor(records[index]?.status)}`}
                                                    value={records[index]?.status || "present"}
                                                    onChange={(e) => handleStatusChange(index, e.target.value as AttendanceRecord["status"])}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="late">Late</option>
                                                    <option value="on-duty">On Duty</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : selectedSubject ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">👥</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                        <p className="text-gray-600">
                            No students are enrolled in this subject for the selected criteria.
                        </p>
                    </div>
                ) : null}

                {/* Submit Button */}
                {students.length > 0 && (
                    <div className="flex justify-center">
                        <button
                            onClick={handleMarkAttendance}
                            disabled={loading.submitting || !selectedSubject}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading.submitting ? (
                                <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Marking Attendance...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    📋 Submit Attendance
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}