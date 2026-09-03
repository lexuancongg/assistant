'use client';
import { Upload, Share2, Download, Trash2, Pencil, Calendar } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import { ACTIVITY_LOG } from '@/lib/fake-data';
import type { ActivityLogItem } from '@/lib/types';

const ICON_MAP: Record<ActivityLogItem['type'], { icon: typeof Upload; className: string }> = {
    upload: { icon: Upload, className: 'text-blue-600 bg-blue-50' },
    share: { icon: Share2, className: 'text-purple-600 bg-purple-50' },
    download: { icon: Download, className: 'text-green-600 bg-green-50' },
    delete: { icon: Trash2, className: 'text-red-500 bg-red-50' },
    update: { icon: Pencil, className: 'text-amber-600 bg-amber-50' },
};

export default function ActivityPage() {
    usePageBreadcrumb(['Nhật ký hoạt động']);

    return (
        <div className="px-6 pt-5 pb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Nhật ký hoạt động</h1>

            <div className="flex items-center gap-2 mb-4">
                <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none">
                    <option>Tất cả hoạt động</option>
                    <option>Upload</option>
                    <option>Chia sẻ</option>
                    <option>Tải xuống</option>
                    <option>Xóa</option>
                </select>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar className="w-4 h-4" strokeWidth={2} />
                    18/05/2024 - 24/05/2024
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {ACTIVITY_LOG.map((item) => {
                    const { icon: Icon, className } = ICON_MAP[item.type];
                    return (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
                                <Icon className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <p className="flex-1 text-sm text-gray-700 min-w-0 truncate">
                                <span className="font-medium text-gray-900">{item.actorName}</span> {item.action}{' '}
                                <span className="text-gray-900">{item.targetName}</span>
                            </p>
                            <span className="text-xs text-gray-400 shrink-0">{item.timestamp}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
