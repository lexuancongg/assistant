"use client"

import Sidebar from "@/components/common/sidebar"
import Topbar from "@/components/common/topbar"

export default function Layout({ children }: React.PropsWithChildren) {
    return (
        <div className="flex min-h-screen bg-gray-100">

            <Sidebar />

            <div className="flex-1 flex flex-col">
                <Topbar />

                <main className="p-6 flex-1">
                    {children}
                </main>
            </div>

        </div>
    )
}