"use client";

import React from "react";
import { Toast, resolveValue, toast } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Loader2, Info, X } from "lucide-react";

interface ModernToastProps {
    toast: Toast;
}

export default function ModernToast({ toast: t }: ModernToastProps) {
    const resolvedContent = resolveValue(t.message, t);

    const isError = t.type === "error";
    const isSuccess = t.type === "success";
    const isLoading = t.type === "loading";

    // Style configuration matching Google Drive snackbar style with error variant
    const getStyleConfig = () => {
        if (isError) {
            return {
                bg: "bg-[#2d1214] dark:bg-[#341215]",
                border: "border-rose-500/35",
                text: "text-[#fce8e6]",
                icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={2} />,
                closeHover: "text-rose-300 hover:text-white hover:bg-rose-500/20",
                barBg: "bg-rose-500/60",
            };
        }
        if (isSuccess) {
            return {
                bg: "bg-[#202124] dark:bg-[#282a2d]",
                border: "border-emerald-500/30",
                text: "text-[#e8eaed]",
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />,
                closeHover: "text-gray-400 hover:text-white hover:bg-white/10",
                barBg: "bg-emerald-500/60",
            };
        }
        if (isLoading) {
            return {
                bg: "bg-[#202124] dark:bg-[#282a2d]",
                border: "border-blue-500/30",
                text: "text-[#e8eaed]",
                icon: <Loader2 className="w-4 h-4 text-[#8ab4f8] animate-spin shrink-0" />,
                closeHover: "text-gray-400 hover:text-white hover:bg-white/10",
                barBg: "bg-blue-500/60",
            };
        }
        // Blank / Info / Default
        return {
            bg: "bg-[#202124] dark:bg-[#282a2d]",
            border: "border-white/10",
            text: "text-[#e8eaed]",
            icon: <Info className="w-4 h-4 text-[#8ab4f8] shrink-0" strokeWidth={2} />,
            closeHover: "text-gray-400 hover:text-white hover:bg-white/10",
            barBg: "bg-[#8ab4f8]/60",
        };
    };

    const config = getStyleConfig();

    let messageText: React.ReactNode = "";
    if (typeof resolvedContent === "string") {
        messageText = resolvedContent;
    } else if (resolvedContent && typeof resolvedContent === "object") {
        messageText = (resolvedContent as any).message || (resolvedContent as any).title || String(resolvedContent);
    } else {
        messageText = resolvedContent;
    }

    const hasProgressBar = t.duration && t.duration !== Infinity && t.duration > 0 && t.type !== "loading";

    return (
        <div
            className={`pointer-events-auto relative flex items-center gap-3.5 px-4 py-2.5 rounded-[6px] shadow-2xl ${
                config.bg
            } ${config.border} border text-white transition-all duration-200 select-none min-w-[280px] max-w-[480px] overflow-hidden ${
                t.visible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-2 opacity-0 scale-95 pointer-events-none"
            }`}
            style={{ ...t.style }}
        >
            {/* Icon */}
            {t.icon ? <span className="text-sm shrink-0">{t.icon}</span> : config.icon}

            {/* Message Text */}
            <div className={`flex-1 text-[13.5px] font-normal leading-snug tracking-tight break-words ${config.text}`}>
                {messageText}
            </div>

            {/* Close Button */}
            {!isLoading && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                    }}
                    className={`p-1 rounded-full transition cursor-pointer shrink-0 -mr-1 ${config.closeHover}`}
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Micro bottom progress line */}
            {hasProgressBar && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
                    <div
                        className={`h-full ${config.barBg} origin-left transition-all`}
                        style={{
                            animation: `toastProgressBar ${t.duration}ms linear forwards`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
