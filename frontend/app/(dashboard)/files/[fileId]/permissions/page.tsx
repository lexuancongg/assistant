'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

function FilePermissionsRedirect() {
    const router = useRouter();
    const params = useParams();
    const fileId = (params?.fileId as string) || '';

    useEffect(() => {
        if (fileId) {
            router.replace(`/files?fileId=${fileId}&share=true`);
        } else {
            router.replace('/files');
        }
    }, [fileId, router]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAFD] dark:bg-[#121212]">
            <div className="w-8 h-8 border-3 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function FilePermissionsPage() {
    return (
        <Suspense fallback={null}>
            <FilePermissionsRedirect />
        </Suspense>
    );
}
