'use client';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import StatCard from '@/components/dashboard/StatCard';
import UploadTrendChart from '@/components/dashboard/UploadTrendChart';
import FileTypeDonut from '@/components/dashboard/FileTypeDonut';
import RecentActivityTable from '@/components/dashboard/RecentActivityTable';
import dashboardService, { DashboardStatsDto } from '@/services/dashboard/dashboardService';
import activityService, { ActivityLogDto } from '@/services/activity/activityService';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    usePageBreadcrumb(['Tổng quan']);
    const [stats, setStats] = useState<DashboardStatsDto | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            const [statsData, logsData] = await Promise.allSettled([
                dashboardService.getStats(),
                activityService.getActivityLogs()
            ]);

            if (statsData.status === 'fulfilled') {
                setStats(statsData.value);
            }
            if (logsData.status === 'fulfilled') {
                const mapped = logsData.value.map(l => ({
                    id: l.id,
                    fileName: l.targetName || l.action,
                    uploader: l.actorName,
                    status: l.type === 'upload' ? 'done' : 'processing',
                    time: l.timestamp
                }));
                setActivities(mapped);
            }
            if (isManual) toast.success('Đã làm mới dữ liệu tổng quan!');
        } catch (err) {
            console.warn('Cannot fetch dashboard data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const statCards = [
        { label: 'Tổng số file', value: stats ? stats.totalFiles.toString() : '0', delta: '+12% so với tháng trước' },
        { label: 'Dung lượng đã dùng', value: stats ? stats.totalStorage : '0 B', delta: '+8% so với tháng trước' },
        { label: 'File đã index AI', value: stats ? stats.aiIndexedFiles.toString() : '0', delta: 'Hoạt động tốt' },
        { label: 'Người dùng', value: stats ? stats.totalUsers.toString() : '0', delta: '+2 thành viên mới' },
    ];

    return (
        <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">Tổng quan</h1>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                    Làm mới
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-4 gap-4 mt-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4 mt-4">
                    {statCards.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
                <UploadTrendChart />
                <FileTypeDonut />
            </div>

            <div className="mt-4">
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                        <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-10 bg-gray-100 rounded"></div>
                            <div className="h-10 bg-gray-100 rounded"></div>
                            <div className="h-10 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                ) : (
                    <RecentActivityTable data={activities} />
                )}
            </div>
        </div>
    );
}
