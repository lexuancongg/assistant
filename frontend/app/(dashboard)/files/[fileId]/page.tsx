'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FileDetailPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/files');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-slate-400">Đang chuyển hướng về danh sách tệp...</p>
            </div>
        </div>
    );
}