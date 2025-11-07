// app/(or pages)/login/page.tsx or src/components/LoginPage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
                { username, password },
                {
                    withCredentials: true, // important: accept httpOnly cookie
                }
            );

            const { role } = res.data;

            // don't store user in localStorage - server issued cookie
            if (role === "student") router.push("/student/dashboard");
            else if (role === "staff") router.push("/staff/dashboard");
            else router.push("/");

        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(String(err.response.data.message));
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-96 space-y-4">
                <h1 className="text-2xl font-bold text-center">Loyola ERP Login</h1>
                <p className="text-sm text-center text-gray-500">Enter your Roll No (Student) or Email (Staff) and password</p>

                <input
                    type="text"
                    placeholder="Roll No or Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full border text-black border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border text-black border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition">
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
