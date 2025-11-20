"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Status = "present" | "absent";

interface Student {
    _id: string;
    name?: string;
    rollNo?: string;
}

interface AttendanceRecord {
    studentId: string;
    status: Status;
    rollNo?: string;
    name?: string;
}

interface ReviewPayload {
    date?: string;
    periodInfo?: { period: string; className: string } | null;
    staff?: { _id?: string; name?: string } | null;
    courseId?: string;
    subjectId?: string;
    students: Student[];
    attendance: AttendanceRecord[];
}

export default function AttendanceReviewPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<ReviewPayload | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("attendance_review");
            if (!raw) {
                setError("No attendance review data found. Return to marking page.");
                setLoading(false);
                return;
            }
            const parsed: ReviewPayload = JSON.parse(raw);
            if (!Array.isArray(parsed.students) || !Array.isArray(parsed.attendance)) {
                setError("Invalid review payload. Return to marking page.");
                setLoading(false);
                return;
            }
            setPayload(parsed);
        } catch (e) {
            console.error("Failed to read review payload", e);
            setError("Failed to read review data.");
        } finally {
            setLoading(false);
        }
    }, []);

    const studentMap = useMemo(() => {
        const m = new Map<string, Student>();
        if (!payload) return m;
        for (const s of payload.students) m.set(s._id, s);
        return m;
    }, [payload]);

    const absentList = useMemo(() => {
        if (!payload) return [];
        return payload.attendance
            .filter((a) => a.status === "absent")
            .map((a) => ({ studentId: a.studentId, student: studentMap.get(a.studentId) ?? null }));
    }, [payload, studentMap]);

    const counts = useMemo(() => {
        let present = 0;
        let absent = 0;
        if (!payload) return { present: 0, absent: 0 };
        for (const a of payload.attendance) {
            if (a.status === "present") present++;
            else absent++;
        }
        return { present, absent };
    }, [payload]);

    const toggleStatus = (studentId: string) => {
        if (!payload) return;
        const newAttendance = payload.attendance.map((a) =>
            a.studentId === studentId
                ? { ...a, status: a.status === "absent" ? "present" : "absent" }
                : a
        );
        const newPayload = { ...payload, attendance: newAttendance };
        setPayload(newPayload);
        sessionStorage.setItem("attendance_review", JSON.stringify(newPayload));
    };

    const goBack = () => router.push("/staff/attendance");

    const confirmAndSubmit = async () => {
        if (!payload || !payload.staff?._id || !payload.courseId || !payload.subjectId) {
            alert("Missing session, staff, course, or subject info.");
            return;
        }

        setSending(true);
        setError(null);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

            const periodString = payload.periodInfo?.period || "1";
            const periodNumber = parseInt(periodString.replace(/\D/g, '')) || 1;

            const postBody = {
                date: payload.date,
                period: periodNumber,
                staffId: payload.staff._id,
                records: payload.attendance,
                courseId: payload.courseId,
                subjectId: payload.subjectId
            };

            console.log(postBody)
            const res = await axios.post(`${API}/attendance`, postBody, { withCredentials: true });

            sessionStorage.removeItem("attendance_review");
            alert(res.data?.message ?? "Attendance submitted");
            router.push("/staff/dashboard");
        } catch (e) {
            console.error("Submit failed", e);
            setError((e as any)?.response?.data?.message ?? (e as Error).message ?? "Submit failed");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Preparing review…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-md border border-gray-200">
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => router.push("/staff/attendance")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Open Marking
                        </button>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem("attendance_review");
                                router.push("/");
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!payload) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-gray-600">No review data — return to marking page.</div>
            </div>
        );
    }

    const pillStyle = (status: Status) =>
        status === "present"
            ? "bg-white border border-gray-200 text-[#2e798c] shadow-sm hover:shadow-md transition-all"
            : "bg-red-50 border border-red-200 text-red-800 shadow-inner hover:bg-red-100 transition-all";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Desktop Layout */}
            <div className="max-w-7xl mx-auto hidden lg:block">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
                    {/* Desktop Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                                <Image src="/logo.png" width={40} height={40} alt="crest" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Review Attendance</h1>
                                <p className="text-gray-600">
                                    {new Date(payload.date ?? new Date().toISOString()).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Staff: {payload.staff?.name ?? "Unknown"}</p>
                            </div>
                        </div>

                        {/* Desktop Class Info */}
                        <div className="text-right">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 min-w-64">
                                <div className="text-sm text-blue-600 font-medium">Class Information</div>
                                <div className="text-lg font-bold text-gray-900 mt-1">{payload.periodInfo?.className}</div>
                                <div className="text-sm text-blue-700 mt-1">{payload.periodInfo?.period}</div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-green-600">{counts.present}</div>
                            <div className="text-green-700 font-medium mt-2">Students Present</div>
                            <div className="text-green-600 text-sm mt-1">Marked for attendance</div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-red-600">{counts.absent}</div>
                            <div className="text-red-700 font-medium mt-2">Students Absent</div>
                            <div className="text-red-600 text-sm mt-1">Requires review</div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600">{payload.students.length}</div>
                            <div className="text-blue-700 font-medium mt-2">Total Students</div>
                            <div className="text-blue-600 text-sm mt-1">In class</div>
                        </div>
                    </div>

                    {/* Absent Students Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Absent Students ({absentList.length})
                                {absentList.length === 0 && (
                                    <span className="text-green-600 text-lg ml-3">✓ All students present</span>
                                )}
                            </h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                                >
                                    Edit Attendance
                                </button>
                                <button
                                    onClick={confirmAndSubmit}
                                    disabled={sending}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
                                >
                                    {sending ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </div>
                                    ) : (
                                        "Confirm & Submit"
                                    )}
                                </button>
                            </div>
                        </div>

                        {absentList.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {payload.attendance
                                    .filter((a) => a.status === "absent")
                                    .map(({ studentId }) => {
                                        const student = studentMap.get(studentId);
                                        const name = student?.name ?? "Student";
                                        const roll = student?.rollNo ?? studentId;
                                        return (
                                            <button
                                                key={studentId}
                                                onClick={() => toggleStatus(studentId)}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-200 text-left transition-all duration-200 hover:scale-105 hover:bg-red-100 group"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {name.split("")[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-gray-900 truncate">{name}</div>
                                                    <div className="text-sm text-gray-600">Roll No: {roll}</div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium group-hover:bg-red-200 transition-colors">
                                                    Click to Mark Present
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-200">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Perfect Attendance!</h3>
                                <p className="text-green-600">All students are marked present. Ready to submit.</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Review the absent list above. Click any student to mark them as present.
                            </div>
                            <button
                                onClick={confirmAndSubmit}
                                disabled={sending}
                                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-lg hover:shadow-xl"
                            >
                                {sending ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting Attendance...
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
                    {/* header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-gray-100 shadow-sm">
                                <Image src="/logo.png" width={36} height={36} alt="crest" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-700">Review Absent</div>
                                <div className="text-xs text-gray-500">{payload.staff?.name ?? ""}</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(payload.date ?? new Date().toISOString()).toLocaleDateString()}</div>
                    </div>

                    {/* Class info */}
                    <div className="border border-gray-100 rounded-xl p-3 mb-4 bg-gray-50">
                        <div className="text-xs text-gray-500">Class</div>
                        <div className="text-base font-semibold text-gray-900">{payload.periodInfo?.className}</div>
                        <div className="text-xs text-gray-500 mt-1">Hour: {payload.periodInfo?.period}</div>
                    </div>

                    {/* Absent cards */}
                    <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Absent ({absentList.length})</div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {payload.attendance
                                .filter((a) => a.status === "absent")
                                .map(({ studentId }) => {
                                    const student = studentMap.get(studentId);
                                    const name = student?.name ?? "Student";
                                    const roll = student?.rollNo ?? studentId;
                                    const status = "absent";
                                    return (
                                        <button
                                            key={studentId}
                                            onClick={() => toggleStatus(studentId)}
                                            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg ${pillStyle(
                                                status
                                            )} text-sm font-medium transition-transform active:scale-95`}
                                        >
                                            <div className="text-sm font-semibold leading-tight">{roll}</div>
                                            <div className="text-[11px] text-gray-500 leading-tight">{name}</div>
                                        </button>
                                    );
                                })}
                            {absentList.length === 0 && (
                                <div className="text-sm text-gray-500">No students marked absent.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-28" />
            </div>

            {/* Mobile Fixed Bottom Bar - Unchanged */}
            <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none lg:hidden">
                <div className="w-[92%] max-w-md pointer-events-auto">
                    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
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

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                            <button
                                onClick={goBack}
                                className="px-3 py-2 rounded-md bg-white border text-sm shadow-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={confirmAndSubmit}
                                disabled={sending}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 shadow-sm hover:bg-blue-700 transition"
                            >
                                {sending ? "Sending..." : "Confirm & Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}