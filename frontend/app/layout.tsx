import type { Metadata } from "next";
import React from "react";
import ClientProviders from "@/components/providers/ClientProviders";

import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/global.css";

export const metadata: Metadata = {
    title: "Enterprise AI Assistant",
    description: "Hệ thống Quản trị Tri thức và Trợ lý AI Doanh nghiệp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="vi">
            <body suppressHydrationWarning={true}>
                <ClientProviders>
                    {children}
                </ClientProviders>
            </body>
        </html>
    );
}