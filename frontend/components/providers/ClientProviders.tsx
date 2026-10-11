"use client";

import React from "react";
import { AppProvider } from "@/context/appContext";
import { ThemeProvider } from "@/context/themeContext";
import { Toaster } from "react-hot-toast";
import { useWebSocketNotification } from "@/hooks/useWebSocketNotification";
import GlobalApiLoading from "@/components/common/GlobalApiLoading";
import ModernToast from "@/components/common/ModernToast";

function WebSocketListener() {
    useWebSocketNotification();
    return null;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AppProvider>
                <WebSocketListener />
                <GlobalApiLoading />
                {children}
                <Toaster
                    position="bottom-left"
                    gutter={10}
                    containerStyle={{
                        bottom: 24,
                        left: 24,
                        zIndex: 99999,
                    }}
                    toastOptions={{
                        duration: 4000,
                    }}
                >
                    {(t) => <ModernToast toast={t} />}
                </Toaster>
            </AppProvider>
        </ThemeProvider>
    );
}
