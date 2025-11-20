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
        <div className="min-h-screen flex items-center justify-center bg-white p-3 sm:p-4 relative">
            <div className="relative z-10 w-full">
                <div
                    className="
                        flex flex-col lg:flex-row items-center justify-center
                        bg-white rounded-2xl lg:rounded-3xl
                        p-4 sm:p-6 lg:p-8 gap-4 lg:gap-10
                        max-w-xs sm:max-w-md lg:max-w-5xl w-full
                        border border-gray-200 mx-auto
                        shadow-2xl
                    "
                >
                    {/* COLLEGE LOGO - Proper sizing for all screens */}
                    <div className="flex justify-center items-center w-32 sm:w-48 lg:w-[350px]">
                        <div className="relative">
                            <div className="
                                p-3 sm:p-4 rounded-xl lg:rounded-2xl 
                                bg-white border border-gray-300
                                shadow-lg
                            ">
                                <Image
                                    src="/logo.png"
                                    alt="College Logo"
                                    width={300}
                                    height={300}
                                    className="w-28 h-28 sm:w-40 sm:h-40 lg:w-60 lg:h-60 xl:w-72 xl:h-72"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* LOGIN CARD */}
                    <div className="w-full bg-[#002147] text-white p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-gray-300 relative shadow-2xl">
                        
                        {/* Decorative top border accent */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
                        
                        {/* HEADER */}
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">
                                LOYOLA COLLEGE METTALA
                            </h1>
                            <p className="text-blue-200 text-xs mt-1 sm:mt-2 font-medium">
                                ENTERPRISE RESOURCE PLANNING
                            </p>
                        </div>

                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-center mb-4 sm:mb-6">
                            Login your account
                        </h2>

                        {/* LOGIN FORM */}
                        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                            {/* Username */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="
                                        w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl
                                        bg-white/15 backdrop-blur-sm 
                                        text-white placeholder-blue-200
                                        focus:ring-2 focus:ring-white/50 outline-none
                                        border border-white/20
                                        text-sm
                                        transition-all duration-200
                                    "
                                />
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="
                                        w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl
                                        bg-white/15 backdrop-blur-sm 
                                        text-white placeholder-blue-200
                                        focus:ring-2 focus:ring-white/50 outline-none
                                        border border-white/20
                                        text-sm
                                        transition-all duration-200
                                    "
                                />
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Forgot Password */}
                            <div className="text-right">
                                <span className="text-blue-200 text-xs hover:underline cursor-pointer hover:text-white transition-colors duration-200">
                                    forget password?
                                </span>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="relative">
                                    <p className="text-xs text-red-200 bg-red-500/20 rounded-lg p-2 text-center border border-red-400/30 backdrop-blur-sm">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Login Button */}
                            <div className="relative">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        w-full bg-white text-[#002147] 
                                        py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold
                                        hover:bg-blue-50 
                                        transition-all duration-300 
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                        text-sm
                                        border border-white/30
                                        relative overflow-hidden
                                        shadow-md
                                    "
                                >
                                    <span className="relative z-10">
                                        {loading ? "Signing in..." : "Login"}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                </button>
                            </div>
                        </form>

                        {/* Decorative bottom element */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}