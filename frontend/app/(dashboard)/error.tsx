'use client';

import { useEffect } from 'react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard error captured:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Đã xảy ra lỗi tải giao diện</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
                {error?.message || 'Có lỗi xảy ra trong quá trình kết xuất dữ liệu. Vui lòng bấm thử lại.'}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
                >
                    Thử lại
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-xl transition"
                >
                    Tải lại trang
                </button>
            </div>
        </div>
    );
}
