'use client';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
            <p className="text-gray-500 mb-6">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
            <Link
                href="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
                Về trang chủ
            </Link>
        </div>
    );
}
