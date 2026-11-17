'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PermissionsRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const folderId = searchParams.get('folderId') || '';
        const name = searchParams.get('name') || '';
        const fileId = searchParams.get('fileId') || '';
        const fileName = searchParams.get('fileName') || '';

        if (fileId) {
            router.replace(`/files?fileId=${fileId}&fileName=${encodeURIComponent(fileName)}&share=true`);
        } else if (folderId) {
            router.replace(`/files?folderId=${folderId}&name=${encodeURIComponent(name)}&share=true`);
        } else {
            router.replace('/files?share=true');
        }
    }, [router, searchParams]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAFD] dark:bg-[#121212]">
            <div className="w-8 h-8 border-3 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function PermissionsPage() {
    return (
        <Suspense fallback={null}>
            <PermissionsRedirect />
        </Suspense>
    );
}
