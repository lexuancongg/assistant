'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { BreadcrumbProvider, useBreadcrumb } from '@/lib/breadcrumb-context';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';
import LoadingOverlay from '@/components/common/LoadingOverlay';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const { isOpen, setIsOpen } = useSidebar();
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
        return <div className="min-h-screen bg-gray-50 dark:bg-slate-950" />;
    }

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <div
                className={`flex-1 flex flex-col min-w-0 h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'pl-64' : 'pl-16'}`}
            >
                <Topbar breadcrumb={breadcrumb} />
                <main className="flex-1 flex flex-col min-w-0 min-h-0 h-[calc(100vh-52px)] overflow-hidden">{children}</main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <BreadcrumbProvider>
            <SidebarProvider>
                <DashboardShell>{children}</DashboardShell>
            </SidebarProvider>
        </BreadcrumbProvider>
    );
}
