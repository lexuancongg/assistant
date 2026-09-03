'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App runtime error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <i className="bi bi-exclamation-triangle text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-sm text-gray-500 max-w-md mb-6">
                {error?.message || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng kiểm tra lại kết nối đến máy chủ backend.'}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                >
                    Thử lại
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                    Tải lại trang
                </button>
            </div>
        </div>
    );
}
