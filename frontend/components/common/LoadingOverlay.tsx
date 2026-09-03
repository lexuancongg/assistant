'use client';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isLoading: boolean;
    text?: string;
}

export default function LoadingOverlay({ isLoading, text = 'Đang xử lý...' }: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-200">
            <div className="flex flex-col items-center gap-3.5 bg-white px-7 py-6 rounded-2xl shadow-2xl border border-gray-100 min-w-[200px]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" strokeWidth={2.5} />
                <p className="text-sm font-medium text-gray-800 tracking-wide select-none">{text}</p>
            </div>
        </div>
    );
}
