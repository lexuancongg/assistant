import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Check, Loader2, Sparkles } from 'lucide-react';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';

export const getTagColorClass = (tag: string): string => {
    const t = tag.toLowerCase();
    if (t.includes('hợp đồng') || t.includes('pháp lý') || t.includes('nda')) {
        return 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100/80';
    }
    if (t.includes('bảo mật') || t.includes('nội quy') || t.includes('iso')) {
        return 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/80';
    }
    if (t.includes('nhân sự') || t.includes('cv') || t.includes('tuyển dụng') || t.includes('onboarding')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80';
    }
    if (t.includes('tài chính') || t.includes('thuế') || t.includes('lương') || t.includes('ngân sách') || t.includes('chi phí') || t.includes('hóa đơn')) {
        return 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/80';
    }
    if (t.includes('ai') || t.includes('rag') || t.includes('gemini') || t.includes('kiến trúc') || t.includes('công nghệ') || t.includes('api')) {
        return 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/80';
    }
    const colors = [
        'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/80',
        'bg-teal-50 text-teal-700 border-teal-200/80 hover:bg-teal-100/80',
        'bg-cyan-50 text-cyan-700 border-cyan-200/80 hover:bg-cyan-100/80',
        'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80 hover:bg-fuchsia-100/80',
        'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/80',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const SUGGESTED_TAGS = [
    'Hợp đồng',
    'Pháp lý',
    'Bảo mật',
    'Nhân sự',
    'CV',
    'Tài chính',
    'Thuế',
    'Công nghệ',
    'Kiến trúc AI',
    'RAG',
    'Nội quy',
    'Kỹ thuật'
];

interface TagManagementModalProps {
    isOpen: boolean;
    file: FileItemDto | null;
    onClose: () => void;
    onSuccess: (updatedFile: FileItemDto) => void;
}

export default function TagManagementModal({
    isOpen,
    file,
    onClose,
    onSuccess
}: TagManagementModalProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [inputVal, setInputVal] = useState('');
    const [saving, setSaving] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>(SUGGESTED_TAGS);

    useEffect(() => {
        if (file) {
            setTags(file.tags ? [...file.tags] : []);
        } else {
            setTags([]);
        }
        setInputVal('');

        if (isOpen) {
            fileManagementService.getAllTags().then((dbTags) => {
                if (dbTags && dbTags.length > 0) {
                    const combined = Array.from(new Set([...dbTags, ...SUGGESTED_TAGS]));
                    setAvailableTags(combined);
                }
            });
        }
    }, [file, isOpen]);

    if (!isOpen || !file) return null;

    const handleAddTag = (tagToAdd: string) => {
        const trimmed = tagToAdd.trim().replace(/^#+/, '');
        if (!trimmed) return;
        if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            toast('Nhãn này đã tồn tại trên tài liệu', { icon: 'ℹ️' });
            return;
        }
        setTags([...tags, trimmed]);
        setInputVal('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await fileManagementService.updateFileTags(file.id, tags);
            toast.success('Cập nhật nhãn tài liệu thành công!');
            onSuccess(updated);
            onClose();
        } catch (error) {
            console.error('Lỗi cập nhật tags:', error);
            toast.error('Không thể cập nhật nhãn. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <Tag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                Quản lý nhãn phân loại (Tags)
                            </h3>
                            <p className="text-xs text-gray-500 truncate max-w-[280px]" title={file.name}>
                                {file.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Input thêm tag */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Thêm nhãn mới
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">#</span>
                                <input
                                    type="text"
                                    value={inputVal}
                                    onChange={(e) => setInputVal(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag(inputVal);
                                        }
                                    }}
                                    placeholder="Gõ tên nhãn rồi nhấn Enter (vd: HopDong, CV)..."
                                    className="w-full pl-7 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleAddTag(inputVal)}
                                disabled={!inputVal.trim()}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" /> Thêm
                            </button>
                        </div>
                    </div>

                    {/* Danh sách tag hiện tại */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-gray-700">
                                Nhãn đang gắn ({tags.length})
                            </label>
                            {tags.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setTags([])}
                                    className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    Xóa tất cả
                                </button>
                            )}
                        </div>

                        {tags.length === 0 ? (
                            <div className="py-4 px-3 text-center border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 bg-gray-50/50">
                                Tài liệu chưa có nhãn nào. Hãy thêm nhãn bên trên hoặc chọn nhãn gợi ý bên dưới.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${getTagColorClass(tag)}`}
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="p-0.5 hover:bg-black/10 rounded-full transition-colors"
                                            title="Xóa nhãn"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nhãn gợi ý */}
                    <div>
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Gợi ý nhãn phổ biến</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {availableTags.map((sTag) => {
                                const isAdded = tags.some(t => t.toLowerCase() === sTag.toLowerCase());
                                return (
                                    <button
                                        key={sTag}
                                        type="button"
                                        onClick={() => handleAddTag(sTag)}
                                        disabled={isAdded}
                                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                            isAdded
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600'
                                        }`}
                                    >
                                        + #{sTag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...
                            </>
                        ) : (
                            <>
                                <Check className="w-3.5 h-3.5" /> Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}