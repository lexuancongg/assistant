"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, X } from "lucide-react";
import authenticationService from "@/services/auth/authenticationService";
import { AuthRequest } from "@/models/auth/authRequest";
import { LoginResponse } from "@/models/auth/loginResponse";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google SSO State
    const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
    const [googleEmail, setGoogleEmail] = useState("");
    const [googleName, setGoogleName] = useState("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [googleSdkReady, setGoogleSdkReady] = useState(false);

    useEffect(() => {
        // Tải Google Identity Services SDK chính thức
        const scriptId = "google-identity-services-script";
        if (document.getElementById(scriptId)) {
            setGoogleSdkReady(true);
            return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleSdkReady(true);
        script.onerror = () => console.warn("Google SDK cannot be loaded (blocked by network/adblocker).");
        document.body.appendChild(script);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError(null);
        setLoading(true);

        const authRequest: AuthRequest = {
            password: password.trim(),
            username: email.trim(),
            email: email.trim()
        };

        try {
            const response = await authenticationService.login(authRequest);
            toast.success("Đăng nhập thành công!");
            handleLoginSuccess(response);
        } catch (res: any) {
            try {
                if (res instanceof Response) {
                    const json = await res.json().catch(() => null);
                    setError(json?.message || "Email hoặc mật khẩu không chính xác.");
                } else {
                    setError("Email hoặc mật khẩu không chính xác.");
                }
            } catch {
                setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googleEmail.trim()) {
            toast.error("Vui lòng nhập địa chỉ email Google");
            return;
        }

        setIsGoogleLoading(true);
        try {
            const response = await authenticationService.loginWithGoogle(
                googleEmail.trim().toLowerCase(),
                googleName.trim() || undefined
            );
            toast.success(`Đăng nhập thành công với tài khoản ${googleEmail}!`);
            setIsGoogleModalOpen(false);
            handleLoginSuccess(response);
        } catch (error: any) {
            console.error("Google login error:", error);
            toast.error("Không thể xác thực tài khoản Google. Vui lòng thử lại!");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGoogleSignInClick = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "328719666150-q2jcea6fk54u1q71soo2puql4lgvbs8i.apps.googleusercontent.com";

        if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
            try {
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: "openid email profile",
                    callback: async (tokenResponse: any) => {
                        if (tokenResponse?.access_token) {
                            setIsGoogleLoading(true);
                            try {
                                const response = await authenticationService.loginWithGoogle({
                                    accessToken: tokenResponse.access_token
                                });
                                toast.success("Đăng nhập với Google thành công!");
                                handleLoginSuccess(response);
                            } catch (error: any) {
                                console.error("Google login error:", error);
                                toast.error("Không thể xác thực tài khoản Google với hệ thống.");
                            } finally {
                                setIsGoogleLoading(false);
                            }
                        } else if (tokenResponse?.error && tokenResponse.error !== "access_denied") {
                            toast.error("Đăng nhập Google thất bại: " + tokenResponse.error);
                        }
                    },
                });
                client.requestAccessToken({ prompt: "select_account" });
                return;
            } catch (err) {
                console.error("Failed to initialize Google token client", err);
            }
        }

        // Nếu Google SDK chưa tải xong hoặc bị chặn, mở popup dự phòng
        setIsGoogleModalOpen(true);
    };

    const handleLoginSuccess = (res: LoginResponse) => {
        router.push("/");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFD] dark:bg-slate-950 px-4 py-8 font-sans select-none relative overflow-hidden">
            {/* Ambient Background Gradient Glows */}
            <div className="absolute top-[-120px] left-[-120px] w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-120px] right-[-120px] w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-[420px] relative z-10">
                {/* Main Card */}
                <div className="bg-white dark:bg-[#1E1F20] rounded-3xl border border-[#E0E2EC] dark:border-slate-800 p-8 sm:p-9 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {/* Brand Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <h1 className="text-2xl font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                            Enterprise AI Assistant
                        </h1>
                        <p className="text-xs text-[#747775] dark:text-slate-400 mt-1">
                            Hệ thống Quản lý tài liệu & Trợ lý AI Doanh nghiệp
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="flex-1">{error}</span>
                        </div>
                    )}

                    {/* Standard Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                Email hoặc Tên đăng nhập
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747775] dark:text-slate-400 pointer-events-none">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 placeholder:text-[#747775] outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747775] dark:text-slate-400 pointer-events-none">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 h-11 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 placeholder:text-[#747775] outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-slate-200 cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                            <label className="flex items-center gap-2 text-[#444746] dark:text-slate-400 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded border-[#C4C7C5] text-[#1A73E8] focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => toast("Vui lòng liên hệ Quản trị viên để khôi phục mật khẩu.", { icon: "ℹ️" })}
                                className="text-[#1A73E8] hover:underline font-medium cursor-pointer"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-[#1A73E8] hover:bg-[#1557b0] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span>Đăng nhập</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-5 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E0E2EC] dark:border-slate-800" />
                        </div>
                        <span className="relative px-3 bg-white dark:bg-[#1E1F20] text-xs text-[#747775] dark:text-slate-400 font-medium">
                            hoặc
                        </span>
                    </div>

                    {/* Google SSO Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignInClick}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F0F4F9] dark:hover:bg-slate-800/80 transition-all text-sm font-medium text-[#1F1F1F] dark:text-slate-100 cursor-pointer shadow-2xs group disabled:opacity-60"
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
                                <span>Đang xác thực với Google...</span>
                            </>
                        ) : (
                            <>
                                {/* Standard Google 4-Color Logo SVG */}
                                <svg width="18" height="18" className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                <span>Đăng nhập với Google</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Security Footer Notice */}
                <div className="mt-6 text-center text-xs text-[#747775] dark:text-slate-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Hệ thống bảo mật và phân quyền tài liệu doanh nghiệp (RBAC)</span>
                </div>
            </div>

            {/* ── GOOGLE EMAIL SSO MODAL ── */}
            {isGoogleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div
                        className="w-full max-w-md bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-6 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setIsGoogleModalOpen(false)}
                            className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" className="w-5 h-5 min-w-5 min-h-5 shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100">
                                    Đăng nhập với Google
                                </h3>
                                <p className="text-xs text-[#747775] dark:text-slate-400">
                                    Sử dụng Email Google Workspace hoặc Gmail của bạn
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleGoogleEmailSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                    Địa chỉ Email Google / Doanh nghiệp
                                </label>
                                <input
                                    type="email"
                                    value={googleEmail}
                                    onChange={(e) => setGoogleEmail(e.target.value)}
                                    placeholder="user@enterprise.ai hoặc name@gmail.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all font-normal"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                    Họ và tên (Tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={googleName}
                                    onChange={(e) => setGoogleName(e.target.value)}
                                    placeholder="Ví dụ: Lê Xuân Công"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all font-normal"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsGoogleModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#444746] hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGoogleLoading}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium bg-[#1A73E8] hover:bg-[#1557b0] text-white transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isGoogleLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    )}
                                    <span>Tiếp tục đăng nhập</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}