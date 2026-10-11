"use client";

import { LoginResponse } from "@/models/auth/loginResponse"
import { AuthRequest } from "@/models/auth/authRequest"
import { useState } from "react"
import authenticationService from "@/services/auth/authenticationService"
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingOverlay from '@/components/common/LoadingOverlay'

export default function LoginPage() {

    const [username, setUsername] = useState("admin@rikai.technology")
    const [password, setPassword] = useState("admin123")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e:React.FormEvent) => {
        e.preventDefault()
        if (loading) return;
        setError(null)
        setLoading(true)
        const authRequest:AuthRequest = {
            password: password.trim(),
            username: username.trim(),
            email: username.trim()
        }
        
        try {
            const response = await authenticationService.login(authRequest)
            toast.success('Đăng nhập thành công!')
            handleLoginSuccess(response)
        } catch(response) {
            try {
                if(response instanceof Response){
                    const json = await response.json().catch(()=>null)
                    setError(json?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.')
                } else {
                    setError('Đăng nhập thất bại. Kiểm tra lại thông tin.')
                }
            } catch(e){
                setError('Đăng nhập thất bại. Kiểm tra lại thông tin.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLoginSuccess = (res:LoginResponse)=>{
        const role :string = res.role ?? '';
        router.push('/')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
            <LoadingOverlay isLoading={loading} text="Đang đăng nhập vào hệ thống..." />

            <div className="bg-white p-8 rounded-lg shadow w-[380px]">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
                    Đăng nhập
                </h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-gray-600">
                            Email hoặc Tên đăng nhập
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">
                            Mật khẩu
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

                    <div className="flex justify-between text-sm">
                        <label className="flex items-center gap-2 text-gray-600">
                            <input type="checkbox"/>
                            Ghi nhớ
                        </label>

                        <a className="text-blue-500 hover:underline cursor-pointer">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Đăng nhập
                    </button>

                </form>

                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-700">Tài khoản dùng thử:</span>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('admin@rikai.technology');
                                setPassword('admin123');
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                        >
                            Điền tài khoản Admin
                        </button>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/80 space-y-1 text-[11px]">
                        <p><strong className="text-gray-700">Email:</strong> admin@rikai.technology</p>
                        <p><strong className="text-gray-700">Mật khẩu:</strong> admin123</p>
                    </div>
                </div>

            </div>

        </div>
    )
}