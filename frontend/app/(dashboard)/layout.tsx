'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { BreadcrumbProvider, useBreadcrumb } from '@/lib/breadcrumb-context';

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const { breadcrumb } = useBreadcrumb();

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
