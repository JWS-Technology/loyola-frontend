"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Status = "present" | "absent";

interface Student {
    _id: string;
    first_name?: string;
    roll_no?: string;
}

interface AttendanceRecord {
    studentId: string;
    status: Status;
}

interface ReviewPayload {
    date?: string;
    periodInfo?: { period: string; className: string } | null;
    staff?: { _id?: string; name?: string } | null;
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

    // tap a card to mark present
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
        if (!payload || !payload.staff?._id) {
            alert("Missing session/staff info.");
            return;
        }
        setSending(true);
        setError(null);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const postBody = {
                date: payload.date,
                period: payload.periodInfo?.period ?? "Hour 1",
                staffId: payload.staff._id,
                records: payload.attendance,
            };
            const res = await axios.post(`${API}/attendance`, postBody, { withCredentials: true });
            sessionStorage.removeItem("attendance_review");
            alert(res.data?.message ?? "Attendance submitted");
            router.push("/");
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
                <div className="text-gray-600">Preparing review…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="bg-white p-6 rounded shadow text-center max-w-md">
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <button onClick={() => router.push("/staff/attendance")} className="px-4 py-2 bg-blue-600 text-white rounded">
                            Open Marking
                        </button>
                        <button
                            onClick={() => {
                                sessionStorage.removeItem("attendance_review");
                                router.push("/");
                            }}
                            className="px-4 py-2 border rounded"
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
            ? "bg-white border border-gray-200 text-[#2e798c] shadow-sm"
            : "bg-red-50 border border-red-200 text-red-800 shadow-inner";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto pb-10">
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
                                    const name = student?.first_name ?? "Student";
                                    const roll = student?.roll_no ?? studentId;
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

            {/* Fixed bottom bar */}
            <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none">
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
