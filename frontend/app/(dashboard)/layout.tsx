'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { BreadcrumbProvider, useBreadcrumb } from '@/lib/breadcrumb-context';
import LoadingOverlay from '@/components/common/LoadingOverlay';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const { breadcrumb } = useBreadcrumb();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
            router.replace('/login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingOverlay isLoading={true} text="Đang kiểm tra đăng nhập..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'pl-56' : 'pl-16'}`}
            >
                <Topbar breadcrumb={breadcrumb} />
                <main>{children}</main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BreadcrumbProvider>
            <DashboardShell>{children}</DashboardShell>
        </BreadcrumbProvider>
    );
}
