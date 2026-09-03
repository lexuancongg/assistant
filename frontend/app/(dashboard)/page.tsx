'use client';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import StatCard from '@/components/dashboard/StatCard';
import UploadTrendChart from '@/components/dashboard/UploadTrendChart';
import FileTypeDonut from '@/components/dashboard/FileTypeDonut';
import { DASHBOARD_STATS } from '@/lib/fake-data';

export default function DashboardPage() {
    usePageBreadcrumb(['Tổng quan']);

    return (
        <div className="px-6 pt-5 pb-6">
            <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>

            <div className="grid grid-cols-4 gap-4 mt-4">
                {DASHBOARD_STATS.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <UploadTrendChart />
                <FileTypeDonut />
            </div>
        </div>
    );
}
