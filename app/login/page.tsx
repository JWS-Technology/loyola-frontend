"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
                { withCredentials: true }
            );

            const { role } = res.data;

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
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300 px-4 py-10">

            <div className="flex flex-col md:flex-row items-center gap-10">

                {/* LOGIN CARD */}
                <div className="w-full max-w-sm bg-gradient-to-br from-purple-500 to-purple-700 text-white p-10 rounded-3xl shadow-2xl">

                    {/* College Name */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-wide">
                            LUCEAT LUX VESTRA
                        </h1>
                        <p className="text-sm text-purple-200 mt-1">
                            ENTERPRISE RESOURCE PLANNING
                        </p>
                    </div>

                    {/* Heading */}
                    <h2 className="text-center text-xl font-semibold mb-8">
                        Login your account
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* Username */}
                        <input
                            type="text"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-purple-200 text-white focus:ring-2 focus:ring-white outline-none"
                        />

                        {/* Password */}
                        <input
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-purple-200 text-white focus:ring-2 focus:ring-white outline-none"
                        />

                        {/* Forgot Password */}
                        <div className="text-right">
                            <a className="text-sm text-purple-200 hover:underline cursor-pointer">
                                forget password?
                            </a>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-red-200 bg-red-500/20 rounded-lg p-2 text-center">
                                {error}
                            </p>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-purple-700 font-semibold py-3 rounded-xl shadow-md hover:bg-purple-100 transition disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>
                </div>

                {/* RIGHT-SIDE LARGE COLLEGE LOGO */}
                <div className="flex justify-center">
                    <Image
                        src="/logo.png"
                        alt="College Logo"
                        width={350}
                        height={350}
                        className="drop-shadow-2xl"
                        priority
                    />
                </div>

            </div>
        </div>
    );
}
