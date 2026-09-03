'use client';
import { RotateCcw, Trash2 } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import { TRASH_ITEMS } from '@/lib/fake-data';

export default function TrashPage() {
    usePageBreadcrumb(['Thùng rác']);

    return (
        <div className="px-6 pt-5 pb-6">
            <h1 className="text-xl font-semibold text-gray-900">Thùng rác</h1>
            <p className="text-sm text-gray-500 mt-1 mb-4">Các file trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày</p>

            <div className="bg-white rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                            <th className="font-medium px-5 py-2.5">Tên file</th>
                            <th className="font-medium px-5 py-2.5">Xóa bởi</th>
                            <th className="font-medium px-5 py-2.5">Ngày xóa</th>
                            <th className="font-medium px-5 py-2.5">Kích thước</th>
                            <th className="font-medium px-5 py-2.5 w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TRASH_ITEMS.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-2.5 text-gray-800">{item.name}</td>
                                <td className="px-5 py-2.5 text-gray-500">{item.deletedBy}</td>
                                <td className="px-5 py-2.5 text-gray-500">{item.deletedAt}</td>
                                <td className="px-5 py-2.5 text-gray-500">{item.size}</td>
                                <td className="px-5 py-2.5">
                                    <button
                                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                        aria-label="Khôi phục"
                                        title="Khôi phục"
                                    >
                                        <RotateCcw className="w-4 h-4" strokeWidth={2} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center gap-2 mt-4">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                    Xóa vĩnh viễn
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                    <RotateCcw className="w-4 h-4" strokeWidth={2} />
                    Khôi phục tất cả
                </button>
            </div>
        </div>
    );
}
