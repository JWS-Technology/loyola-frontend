"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Student {
    _id: string;
    name: string;
    rollNo: string;
}

type Status = "present" | "absent";

interface AttendanceRecord {
    studentId: string;
    status: Status;
    rollNo: string;
    name: string;
}

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [staff, setStaff] = useState<any>(null);
    const [date, setDate] = useState("");
    const [periodInfo, setPeriodInfo] = useState<{ period: string; className: string } | null>(null);
    const [courseId, setCourseId] = useState<string>("");
    const [subjectId, setSubjectId] = useState<string>("");

    useEffect(() => {
        setDate(new Date().toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                console.log("is this working")
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

                const res = await axios.get(`${API}/auth/me`, {
                    withCredentials: true,
                });
                console.log(res)
                setStaff(res.data.user);
            } catch (err) {
                console.error("Not authenticated", err);
            }
        };
        console.log("this is staff data", staff)
        fetchStaff();
    }, []);

    useEffect(() => {
        if (!staff) return;

        const fetchClass = async () => {
            setLoading(true);
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

                const periodNum = 4;

                const res = await axios.get(`${API}/attendance/session`, {
                    params: {
                        period: periodNum,
                        date,
                        staffId: staff?.userId || staff?._id,
                    },
                    withCredentials: true,
                });

                console.log(JSON.stringify(res));
                const { students: st, courseId, courseName, semester } = res.data;

                setPeriodInfo({
                    className: `${courseName ?? "Course"} - Semester ${semester ?? "?"}`,
                    period: `Hour ${periodNum}`,
                });

                setStudents(st);
                setAttendance(st.map(s => ({
                    studentId: s._id,
                    status: "present",
                    rollNo: s.rollNo,
                    name: s.name
                })));
                setCourseId(res.data.courseId);
                setSubjectId(res.data.subjectId);
            } catch (err) {
                console.log("Error loading attendance:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClass();
    }, [staff, date]);

    const toggleStatus = (studentId: string) => {
        setAttendance((prev) =>
            prev.map((r) => (r.studentId === studentId ? { ...r, status: r.status === "present" ? "absent" : "present" } : r))
        );
    };

    const setAll = (status: Status) => {
        setAttendance(prev => prev.map(p => ({ ...p, status })));
    };

    const getCounts = () =>
        attendance.reduce(
            (acc, cur) => {
                acc[cur.status] = (acc[cur.status] || 0) + 1;
                return acc;
            },
            { present: 0, absent: 0 } as Record<string, number>
        );

    const router = useRouter();
    const counts = getCounts();

    const submitToReview = () => {
        console.group("🚀 Submitting to Review");
        console.log("Current State:");
        console.log(" - Date:", date);
        console.log(" - Staff:", staff);
        console.log(" - Course ID:", courseId);
        console.log(" - Subject ID:", subjectId);

        if (!courseId || !subjectId) {
            console.error("❌ STOP: CourseID or SubjectID is missing. Cannot proceed.");
            console.groupEnd();
            alert(`Error: Missing Class Data.\nCourseID: ${courseId}\nSubjectID: ${subjectId}\n\nPlease refresh the page and try again.`);
            return;
        }

        const payload = {
            date,
            periodInfo,
            staff,
            students,
            attendance,
            courseId: courseId,
            subjectId: subjectId
        };

        console.log("✅ Payload constructed:", payload);

        try {
            sessionStorage.setItem("attendance_review", JSON.stringify(payload));
            console.log("💾 Saved to SessionStorage. Navigating...");
            console.groupEnd();
            router.push("/staff/attendance/review");
        } catch (e) {
            console.error("❌ Failed to save review payload:", e);
            console.groupEnd();
            alert("System Error: Unable to save attendance data. Please try again.");
        }
    };

    const pillStyle = (status: Status) =>
        status === "present"
            ? "bg-white border border-gray-200 text-[#2e798c] shadow-sm hover:shadow-md transition-all"
            : "bg-red-500/20 border border-red-200 text-red-800 shadow-inner hover:bg-red-500/30 transition-all";

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading class & students…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Desktop Container */}
            <div className="max-w-7xl mx-auto hidden lg:block">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
                    {/* Desktop Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                                <Image src="/logo.png" width={40} height={40} alt="crest" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                                <p className="text-gray-600">{new Date(date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}</p>
                            </div>
                        </div>

                        {/* Desktop Class Info */}
                        <div className="text-right">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 min-w-64">
                                <div className="text-sm text-blue-600 font-medium">Class Information</div>
                                <div className="text-lg font-bold text-gray-900 mt-1">{periodInfo?.className}</div>
                                <div className="text-sm text-blue-700 mt-1">{periodInfo?.period}</div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Students Grid */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Students ({students.length})</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAll("present")}
                                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors shadow-sm"
                                >
                                    Mark All Present
                                </button>
                                <button
                                    onClick={() => setAll("absent")}
                                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors shadow-sm"
                                >
                                    Mark All Absent
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {students.map((s) => {
                                const rec = attendance.find((a) => a.studentId === s._id);
                                const status = rec?.status ?? "present";
                                return (
                                    <button
                                        key={s._id}
                                        onClick={() => toggleStatus(s._id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl ${pillStyle(status)} text-left transition-all duration-200 hover:scale-105`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${status === "present" ? "bg-green-500" : "bg-red-500"
                                            }`}>
                                            {/* {s.rollNo} */} {s.name.split("")[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{s.name}</div>
                                            <div className="text-sm text-gray-500">Roll No: {s.rollNo}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status === "present"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                            }`}>
                                            {status === "present" ? "Present" : "Absent"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop Footer */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{counts.present}</div>
                                    <div className="text-sm text-gray-600">Present</div>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{counts.absent}</div>
                                    <div className="text-sm text-gray-600">Absent</div>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{students.length}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                            </div>

                            <button
                                onClick={submitToReview}
                                disabled={submitting}
                                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg hover:shadow-xl"
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </div>
                                ) : (
                                    "Submit Attendance"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Unchanged */}
            <div className="max-w-md mx-auto pb-10 lg:hidden">
                <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-md">
                    {/* header row: crest + title + date */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-gray-100 shadow-sm">
                                <Image src="/logo.png" width={36} height={36} alt="crest" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-700">Attendance</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</div>
                    </div>

                    {/* Class & Hour box */}
                    <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50">
                        <div className="text-xs text-gray-500">Class</div>
                        <div className="text-base font-semibold text-gray-900">{periodInfo?.className}</div>
                        <div className="text-xs text-gray-500 mt-1">Hour: {periodInfo?.period}</div>
                    </div>

                    {/* pills grid */}
                    <div className="mb-4">
                        <div className="flex flex-wrap justify-center gap-3">
                            {students.map((s) => {
                                const rec = attendance.find((a) => a.studentId === s._id);
                                const status = rec?.status ?? "present";
                                return (
                                    <button
                                        key={s._id}
                                        onClick={() => toggleStatus(s._id)}
                                        className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg ${pillStyle(
                                            status
                                        )} text-sm font-medium transition-transform active:scale-95`}
                                        title={`${s.name} — ${status}`}
                                    >
                                        <div className="text-sm font-semibold leading-tight">{s.rollNo}</div>
                                        <div className="text-[11px] text-gray-500 leading-tight">{s.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* bottom spacing so content not hidden behind fixed bar */}
                <div className="h-28" />
            </div>

            {/* Mobile Fixed Bottom Bar - Unchanged */}
            <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none lg:hidden">
                <div className="w-[92%] max-w-md pointer-events-auto">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Counts */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="text-center sm:text-left">
                                <div className="text-xs text-gray-500">Present</div>
                                <div className="font-semibold text-gray-800">{counts.present}</div>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-gray-100 mx-2" />
                            <div className="text-center sm:text-left">
                                <div className="text-xs text-gray-500">Absent</div>
                                <div className="font-semibold text-gray-800">{counts.absent}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAll("present")}
                                    className="px-3 py-2 rounded-md bg-green-50 text-green-800 text-sm border border-green-100 shadow-sm hover:bg-green-100 transition"
                                >
                                    All Present
                                </button>

                                <button
                                    onClick={() => setAll("absent")}
                                    className="px-3 py-2 rounded-md bg-red-50 text-red-800 text-sm border border-red-100 shadow-sm hover:bg-red-100 transition"
                                >
                                    All Absent
                                </button>
                            </div>

                            <div className="ml-auto sm:ml-4">
                                <button
                                    onClick={submitToReview}
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 shadow-sm hover:bg-blue-700 transition"
                                >
                                    {submitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}