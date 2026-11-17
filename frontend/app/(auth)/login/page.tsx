"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
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
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        // Tải Google Identity Services SDK chính thức
        const scriptId = "google-identity-services-script";
        if (document.getElementById(scriptId)) {
            return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onerror = () => console.warn("Google SDK cannot be loaded (blocked by network/adblocker).");
        document.body.appendChild(script);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
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
            let errorMsg = "Tài khoản hoặc mật khẩu không chính xác.";
            try {
                if (res?.message) {
                    errorMsg = res.message;
                } else if (res instanceof Response) {
                    const json = await res.json().catch(() => null);
                    if (json?.message) errorMsg = json.message;
                } else if (typeof res === "string") {
                    errorMsg = res;
                }
            } catch {
                // fallback
            }

            // Chuẩn hóa câu thông báo lỗi thân thiện cho người dùng
            if (
                !errorMsg ||
                errorMsg === "Bad credentials" ||
                errorMsg.toLowerCase().includes("bad credential") ||
                errorMsg.toLowerCase().includes("invalid username") ||
                errorMsg.toLowerCase().includes("invalid password") ||
                errorMsg.toLowerCase().includes("unauthorized")
            ) {
                errorMsg = "Tài khoản hoặc mật khẩu không chính xác.";
            }

            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignInClick = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "328719666150-q2jcea6fk54u1q71soo2puql4lgvbs8i.apps.googleusercontent.com";
        if (!clientId) {
            toast.error("Google Client ID chưa được cấu hình trong biến môi trường (NEXT_PUBLIC_GOOGLE_CLIENT_ID).");
            return;
        }

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
                                let errorMsg = "Không thể xác thực tài khoản Google với hệ thống.";
                                try {
                                    if (error instanceof Response) {
                                        const json = await error.json().catch(() => null);
                                        if (json?.message) errorMsg = json.message;
                                    } else if (error?.response?.data?.message) {
                                        errorMsg = error.response.data.message;
                                    } else if (error?.message) {
                                        errorMsg = error.message;
                                    } else if (typeof error === "string") {
                                        errorMsg = error;
                                    }
                                } catch {
                                    // fallback
                                }
                                toast.error(errorMsg, { duration: 6000 });
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

        toast.error("Dịch vụ Google OAuth chưa sẵn sàng hoặc bị chặn bởi trình duyệt. Vui lòng thử lại hoặc đăng nhập bằng tài khoản.");
    };

    const handleLoginSuccess = (_res?: LoginResponse) => {
        if (_res?.accessToken) {
            // Token processed
        }
        router.push("/");
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-4 py-12 font-sans select-none">
            <div className="w-full max-w-[460px]">
                {/* Main Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.06)]">
                    {/* Brand Header */}
                    <div className="flex flex-col items-center text-center mb-7">
                        {/* Enterprise AI Assistant Logo */}
                        <div className="mb-4">
                            <svg className="w-14 h-14" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="entLoginLogoBg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#1D4ED8" />
                                        <stop offset="50%" stopColor="#2563EB" />
                                        <stop offset="100%" stopColor="#4F46E5" />
                                    </linearGradient>
                                    <linearGradient id="entLoginDocGrad" x1="9" y1="8" x2="25" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#FFFFFF" />
                                        <stop offset="100%" stopColor="#EEF2FF" />
                                    </linearGradient>
                                    <linearGradient id="entLoginFoldGrad" x1="18" y1="7" x2="25" y2="14" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#93C5FD" />
                                        <stop offset="100%" stopColor="#3B82F6" />
                                    </linearGradient>
                                </defs>
                                <rect x="1" y="1" width="34" height="34" rx="10" fill="url(#entLoginLogoBg)" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" />
                                <path d="M10 8.5C10 7.67 10.67 7 11.5 7H19.5L26 13.5V26.5C26 27.33 25.33 28 24.5 28H11.5C10.67 28 10 27.33 10 26.5V8.5Z" fill="url(#entLoginDocGrad)" />
                                <path d="M19.5 7V12C19.5 12.83 20.17 13.5 21 13.5H26" fill="url(#entLoginFoldGrad)" opacity="0.9" />
                                <rect x="13" y="16" width="6" height="2" rx="1" fill="#2563EB" />
                                <rect x="13" y="19.5" width="10" height="2" rx="1" fill="#94A3B8" />
                                <rect x="13" y="23" width="7" height="2" rx="1" fill="#CBD5E1" />
                            </svg>
                        </div>

                        <h1 className="text-[25px] font-bold text-slate-900 tracking-tight">
                            Enterprise AI Assistant
                        </h1>
                        <p className="text-[14px] text-slate-500 mt-1.5">
                            Hệ thống Quản lý tài liệu & Trợ lý AI Doanh nghiệp
                        </p>
                    </div>

                    {/* Standard Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                                Email hoặc Tên đăng nhập
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="cong.le@gmail.com"
                                    className="w-full pl-11 pr-4 h-12 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 transition-all font-normal"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-[13px] font-medium text-slate-800 mb-1.5">
                                Mật khẩu
                            </label>
                            <div className="relative flex items-center">
                                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 h-12 rounded-xl border border-slate-200 bg-white text-[14px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 transition-all font-normal"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2.5 text-[13px] text-slate-800 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => toast("Vui lòng liên hệ Quản trị viên để khôi phục mật khẩu.", { icon: "ℹ️" })}
                                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-[15px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 mt-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>Đăng nhập</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <span className="relative px-3 bg-white text-xs text-slate-400 font-normal">
                            hoặc
                        </span>
                    </div>

                    {/* Google SSO Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignInClick}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[14px] font-medium text-slate-700 cursor-pointer shadow-2xs group disabled:opacity-60"
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
                                <span>Đang xác thực với Google...</span>
                            </>
                        ) : (
                            <>
                                {/* Standard Google 4-Color Logo SVG */}
                                <svg width="20" height="20" className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

                    {/* Security Footer Notice */}
                    <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Hệ thống bảo mật và phân quyền tài liệu doanh nghiệp (RBAC)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
