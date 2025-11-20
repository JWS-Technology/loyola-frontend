"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

            // --- ADDED ADMIN ROUTING HERE ---
            if (role === "student") {
                router.push("/student/dashboard");
            } else if (role === "staff") {
                router.push("/staff/dashboard");
            } else if (role === "admin") {
                router.push("/admin/dashboard");
            } else {
                router.push("/");
            }

        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(String(err.response.data.message));
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed. Please check your credentials and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>

            {/* Animated background circles */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-75"></div>
            <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-150"></div>

            <div className="relative z-10 w-full">
                <div
                    className="
                        flex flex-col lg:flex-row items-center justify-center
                        bg-white/80 backdrop-blur-lg rounded-2xl lg:rounded-3xl
                        p-4 sm:p-6 lg:p-8 gap-4 lg:gap-10
                        max-w-xs sm:max-w-md lg:max-w-5xl w-full
                        border border-white/20 mx-auto
                        shadow-2xl shadow-blue-500/10
                        transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20
                    "
                >
                    {/* COLLEGE LOGO - Enhanced with better styling */}
                    <div className="flex justify-center items-center w-32 sm:w-48 lg:w-[350px]">
                        <div className="relative group">
                            <div className="
                                p-3 sm:p-4 rounded-xl lg:rounded-2xl 
                                bg-white/90 backdrop-blur-sm border border-white/30
                                shadow-lg shadow-blue-500/10
                                transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/20
                                group-hover:scale-105
                            ">
                                <Image
                                    src="/logo.png"
                                    alt="Loyola College Mettala Logo"
                                    width={300}
                                    height={300}
                                    className="w-28 h-28 sm:w-40 sm:h-40 lg:w-60 lg:h-60 xl:w-72 xl:h-72 transition-transform duration-300 group-hover:scale-105"
                                    priority
                                />
                            </div>
                            {/* Shine effect */}
                            <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                    </div>

                    {/* LOGIN CARD - Enhanced with better details */}
                    <div className="w-full bg-gradient-to-br from-[#002147] to-[#1a365d] text-white p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-white/10 relative shadow-2xl shadow-blue-900/20">

                        {/* Enhanced decorative top border */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"></div>

                        {/* HEADER - Enhanced */}
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                Loyola College Mettala
                            </h1>
                        </div>

                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-center mb-4 sm:mb-6 flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Login to Your Account
                        </h2>

                        {/* ENHANCED LOGIN FORM */}
                        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                            {/* Username Field - Enhanced */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-blue-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="
                                        w-full pl-10 pr-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl
                                        bg-white/10 backdrop-blur-sm 
                                        text-white placeholder-blue-200/70
                                        focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#002147] outline-none
                                        border border-white/20
                                        text-sm
                                        transition-all duration-200
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        group-hover:border-white/30
                                    "
                                />
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Password Field - Enhanced */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-blue-300/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>

                                {/* Password Input */}
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="
                                        w-full pl-10 pr-10 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl
                                        bg-white/10 backdrop-blur-sm 
                                        text-white placeholder-blue-200/70
                                        focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#002147] outline-none
                                        border border-white/20
                                        text-sm
                                        transition-all duration-200
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        group-hover:border-white/30
                                    "
                                />

                                {/* 👁️ Eye Icon */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-200/80 hover:text-white"
                                >
                                    {showPassword ? (
                                        // Eye open
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        // Eye closed
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.244-3.733M6.75 6.75A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.657 3.023M3 3l18 18" />
                                        </svg>
                                    )}
                                </button>

                                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                            </div>

                            {/* Enhanced Forgot Password */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    className="text-blue-200/80 text-xs hover:text-white transition-all duration-200 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    Forgot your password?
                                </button>
                            </div>

                            {/* Enhanced Error Message */}
                            {error && (
                                <div className="relative animate-pulse">
                                    <div className="flex items-center gap-2 text-xs text-red-200 bg-red-500/20 rounded-lg p-3 text-center border border-red-400/30 backdrop-blur-sm">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Enhanced Login Button */}
                            <div className="relative group">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        w-full bg-gradient-to-r from-white to-blue-50 text-[#002147] 
                                        py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold
                                        hover:from-blue-50 hover:to-white hover:scale-[1.02]
                                        active:scale-[0.98]
                                        transition-all duration-300 
                                        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                                        text-sm
                                        border border-white/30
                                        relative overflow-hidden
                                        shadow-lg shadow-blue-500/20
                                        flex items-center justify-center gap-2
                                    "
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-[#002147]" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="relative z-10">Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="relative z-10">Login to ERP</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                </button>
                            </div>
                        </form>

                        {/* Enhanced decorative bottom element */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4">
                    <p className="text-xs text-gray-600/80 font-medium">
                        © 2025 Loyola College Mettala ERP System • JWS Technologies
                    </p>
                </div>
            </div>
        </div>
    );
}