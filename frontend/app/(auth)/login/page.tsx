"use client"

import { LoginResponse } from "@/models/auth/loginResponse"
import { AuthRequest } from "@/models/auth/authRequest"
import { useState } from "react"
import authenticationService from "@/services/auth/authenticationService"

export default function LoginPage() {

    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")

    const handleLogin = (e:React.FormEvent) => {
        e.preventDefault()
        const authRequest:AuthRequest = {
            password: password.trim(),
            username:email.trim()
        }
        
        authenticationService.login(authRequest)
        .then(response =>{
            handleLoginSuccess(response)
        })
        .catch(error=>{
            console.log(error)
        })
        

    }
    const handleLoginSuccess = (res:LoginResponse)=>{
        const role :string = res.role;

        
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-8 rounded-lg shadow w-[380px]">
                <h1 className="text-2xl font-bold text-center mb-6">
                    HR Management Login
                </h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-gray-600">
                            username
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                            placeholder="nhập username"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-200"
                            placeholder=""
                            required
                        />
                    </div>

                    <div className="flex justify-between text-sm">
                        <label className="flex items-center gap-2">
                            <input type="checkbox"/>
                            Remember me
                        </label>

                        <a className="text-blue-500 hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                        Login
                    </button>

                </form>

            </div>

        </div>
    )
}