"use client";

import React from "react";
import { AppProvider } from "@/context/appContext";
import { Toaster } from "react-hot-toast";
import { useWebSocketNotification } from "@/hooks/useWebSocketNotification";

function WebSocketListener() {
    useWebSocketNotification();
    return null;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AppProvider>
            <WebSocketListener />
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        borderRadius: "10px",
                        padding: "12px 14px",
                        fontSize: "14px",
                    },
                    success: {
                        style: {
                            background: "#10b981",
                            color: "#fff",
                        },
                    },
                    error: {
                        style: {
                            background: "#ef4444",
                            color: "#fff",
                        },
                    },
                }}
            />
        </AppProvider>
    );
}
