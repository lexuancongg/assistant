'use client';
import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import fileManagementService, { TrashItemDto } from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/common/LoadingOverlay';

export default function TrashPage() {
    usePageBreadcrumb(['Thùng rác']);
    const [trashItems, setTrashItems] = useState<TrashItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');

    const loadTrash = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await fileManagementService.getTrash();
            setTrashItems(data);
        } catch (err) {
            console.warn('Cannot fetch trash:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrash();
    }, []);

    const handleRestore = async (id: string) => {
        setActionId(id);
        setIsProcessing(true);
        setProcessingText('Đang khôi phục file...');
        const tId = toast.loading('Đang khôi phục file...');
        try {
            await fileManagementService.restore(id);
            toast.success('Đã khôi phục file thành công!', { id: tId });
            await loadTrash(true);
        } catch (err: any) {
            toast.error('Khôi phục thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setActionId(null);
            setIsProcessing(false);
        }
    };

    const handleDeletePermanent = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn file này? Thao tác không thể hoàn tác!')) return;
        setActionId(id);
        setIsProcessing(true);
        setProcessingText('Đang xóa vĩnh viễn file khỏi hệ thống...');
        const tId = toast.loading('Đang xóa vĩnh viễn...');
        try {
            await fileManagementService.deletePermanently(id);
            toast.success('Đã xóa vĩnh viễn file!', { id: tId });
            await loadTrash(true);
        } catch (err: any) {
            toast.error('Xóa vĩnh viễn thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="px-6 pt-5 pb-6 relative">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-semibold text-gray-900">Thùng rác</h1>
                <button
                    onClick={() => loadTrash()}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
                    title="Tải lại thùng rác"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-4">Các file trong thùng rác sẽ bị xóa vĩnh viễn sau 30 ngày</p>

            <div className="bg-white rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                            <th className="font-medium px-5 py-2.5">Tên file</th>
                            <th className="font-medium px-5 py-2.5">Xóa bởi</th>
                            <th className="font-medium px-5 py-2.5">Ngày xóa</th>
                            <th className="font-medium px-5 py-2.5">Kích thước</th>
                            <th className="font-medium px-5 py-2.5 w-28 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse border-b border-gray-50">
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                    <td className="px-5 py-3 text-right"><div className="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
                                </tr>
                            ))
                        ) : (
                            trashItems.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-2.5 text-gray-800 font-medium">{item.name}</td>
                                    <td className="px-5 py-2.5 text-gray-500">{item.deletedBy}</td>
                                    <td className="px-5 py-2.5 text-gray-500">{item.deletedAt}</td>
                                    <td className="px-5 py-2.5 text-gray-500">{item.size}</td>
                                    <td className="px-5 py-2.5 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleRestore(item.id)}
                                            disabled={actionId === item.id}
                                            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                            aria-label="Khôi phục"
                                            title="Khôi phục file"
                                        >
                                            {actionId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <RotateCcw className="w-4 h-4" strokeWidth={2} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeletePermanent(item.id)}
                                            disabled={actionId === item.id}
                                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                            aria-label="Xóa vĩnh viễn"
                                            title="Xóa vĩnh viễn"
                                        >
                                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!loading && trashItems.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                                    Thùng rác trống
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
