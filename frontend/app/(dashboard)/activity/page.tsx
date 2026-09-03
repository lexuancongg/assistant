'use client';
import { useEffect, useState } from 'react';
import { Upload, Share2, Download, Trash2, Pencil, Calendar, RefreshCw } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import activityService, { ActivityLogDto } from '@/services/activity/activityService';

const ICON_MAP: Record<string, { icon: typeof Upload; className: string }> = {
    upload: { icon: Upload, className: 'text-blue-600 bg-blue-50' },
    share: { icon: Share2, className: 'text-purple-600 bg-purple-50' },
    download: { icon: Download, className: 'text-green-600 bg-green-50' },
    delete: { icon: Trash2, className: 'text-red-500 bg-red-50' },
    update: { icon: Pencil, className: 'text-amber-600 bg-amber-50' },
};

export default function ActivityPage() {
    usePageBreadcrumb(['Nhật ký hoạt động']);
    const [logs, setLogs] = useState<ActivityLogDto[]>([]);
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(true);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await activityService.getActivityLogs();
            setLogs(data);
        } catch (err) {
            console.warn('Cannot fetch activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const filteredLogs = logs.filter(item => {
        if (filterType === 'all') return true;
        return item.type.toLowerCase() === filterType.toLowerCase();
    });

    return (
        <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">Nhật ký hoạt động</h1>
                <button
                    onClick={loadLogs}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
                    title="Tải lại nhật ký"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none"
                >
                    <option value="all">Tất cả hoạt động</option>
                    <option value="upload">Upload</option>
                    <option value="share">Chia sẻ</option>
                    <option value="download">Tải xuống</option>
                    <option value="delete">Xóa</option>
                </select>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar className="w-4 h-4" strokeWidth={2} />
                    Gần đây
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-200 rounded w-60"></div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                    ))
                ) : (
                    filteredLogs.map((item) => {
                        const iconConfig = ICON_MAP[item.type.toLowerCase()] || ICON_MAP.upload;
                        const Icon = iconConfig.icon;
                        const className = iconConfig.className;
                        return (
                            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
                                    <Icon className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <p className="flex-1 text-sm text-gray-700 min-w-0 truncate">
                                    <span className="font-medium text-gray-900">{item.actorName}</span> {item.action}{' '}
                                    <span className="text-gray-900 font-medium">{item.targetName}</span>
                                </p>
                                <span className="text-xs text-gray-400 shrink-0">{item.timestamp}</span>
                            </div>
                        );
                    })
                )}
                {!loading && filteredLogs.length === 0 && (
                    <div className="p-8 text-center text-sm text-gray-400">
                        Chưa có nhật ký hoạt động nào
                    </div>
                )}
            </div>
        </div>
    );
}
