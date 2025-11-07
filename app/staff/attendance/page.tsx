"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Student {
    _id: string;
    first_name: string;
    roll_no: string;
}

type Status = "present" | "absent";

interface AttendanceRecord {
    studentId: string;
    status: Status;
}

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [staff, setStaff] = useState<any>(null);
    const [date, setDate] = useState("");
    const [periodInfo, setPeriodInfo] = useState<{ period: string; className: string } | null>(null);

    useEffect(() => {
        setDate(new Date().toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem("user");
        if (raw) setStaff(JSON.parse(raw));
    }, []);

    useEffect(() => {
        if (!staff) return;

        const fetchClass = async () => {
            setLoading(true);
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const params: any = { period: 1, date };
                const res = await axios.get(`${API}/attendance/session`, {
                    params,
                    withCredentials: true, // IMPORTANT to send cookie
                });

                // where you handle sessionRes
                const { students: st, courseId, courseName, semester } = res.data;
                const courseLabel = courseName;
                setPeriodInfo({ className: `${courseLabel} - Semester ${semester}`, period: `Hour ${params.period}` });

                setStudents(st);
                setAttendance(st.map((s: Student) => ({ studentId: s._id, status: "present" as Status })));
            } catch (err) {
                console.warn("fetch failed, falling back to mock", err);
                // fallback: create some mock if needed
                const mock: Student[] = Array.from({ length: 12 }).map((_, i) => ({
                    _id: `m${i + 1}`,
                    first_name: `Student ${i + 1}`,
                    roll_no: `R${100 + i + 1}`,
                }));
                setPeriodInfo({ className: "B.Sc Computer Science - A", period: "Hour 1" });
                setStudents(mock);
                setAttendance(mock.map((s) => ({ studentId: s._id, status: "present" })));
            } finally {
                setLoading(false);
            }
        };

        fetchClass();
    }, [staff]);

    const toggleStatus = (studentId: string) => {
        setAttendance((prev) =>
            prev.map((r) => (r.studentId === studentId ? { ...r, status: r.status === "present" ? "absent" : "present" } : r))
        );
    };

    // helper to set all present/absent
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
        // save minimal payload to sessionStorage for the review page
        const payload = {
            date,
            periodInfo,
            staff,
            students,
            attendance,
        };
        try {
            sessionStorage.setItem("attendance_review", JSON.stringify(payload));
            router.push("/staff/attendance/review");
        } catch (e) {
            console.error("Failed to save review payload", e);
            alert("Unable to open review. Try again.");
        }
    };

    const pillStyle = (status: Status) =>
        status === "present"
            ? "bg-white border border-gray-200 text-[#2e798c] shadow-sm"
            : "bg-red-500/20 border border-red-200 text-red-800 shadow-inner";

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading class & students…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto pb-10"> {/* pb-32 to leave space for fixed bar */}
                {/* phone-like container */}
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
                                        title={`${s.first_name} — ${status}`}
                                    >
                                        <div className="text-sm font-semibold leading-tight">{s.roll_no}</div>
                                        <div className="text-[11px] text-gray-500 leading-tight">{s.first_name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* bottom spacing so content not hidden behind fixed bar */}
                <div className="h-28" />
            </div>

            <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none">
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
                                    onClick={() => setAttendance((prev) => prev.map((p) => ({ ...p, status: "present" })))}
                                    className="px-3 py-2 rounded-md bg-green-50 text-green-800 text-sm border border-green-100 shadow-sm hover:bg-green-100 transition"
                                >
                                    All Present
                                </button>

                                <button
                                    onClick={() => setAttendance((prev) => prev.map((p) => ({ ...p, status: "absent" })))}
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
