'use client';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import { X, UploadCloud, File as FileIcon, Loader2, Tag, Plus, Sparkles, Folder } from 'lucide-react';
import { getTagColorClass, SUGGESTED_TAGS } from '@/components/files/TagManagementModal';
import fileManagementService from '@/services/files/fileManagementService';

// ── Khung modal dùng chung ──
function ModalShell({
    title,
    onClose,
    children,
    maxWidth = 'max-w-md',
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: string;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <div className={`w-full ${maxWidth} bg-white rounded-xl shadow-lg`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Đóng">
                        <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

interface CreateFolderModalProps {
    parentFolderName: string;
    onClose: () => void;
    onCreate: (name: string) => Promise<void> | void;
}

export function CreateFolderModal({ parentFolderName, onClose, onCreate }: CreateFolderModalProps) {
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!name.trim() || submitting) return;
        setSubmitting(true);
        try {
            await onCreate(name.trim());
            onClose();
        } catch (err: any) {
            // Error is presented via Google Drive snackbar toast
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title="Tạo thư mục mới" onClose={onClose}>
            <div className="px-5 py-4">
                <label className="text-sm text-gray-600">Tên thư mục</label>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Nhập tên thư mục"
                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
                <p className="mt-2 text-xs text-gray-400">
                    Thư mục sẽ được tạo trong <span className="text-gray-600 font-medium">{parentFolderName}</span>
                </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || submitting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Đang tạo...' : 'Tạo thư mục'}
                </button>
            </div>
        </ModalShell>
    );
}

interface RenameFolderModalProps {
    currentName: string;
    onClose: () => void;
    onRename: (newName: string) => Promise<void> | void;
}

export function RenameFolderModal({ currentName, onClose, onRename }: RenameFolderModalProps) {
    const [name, setName] = useState(currentName);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(currentName);
        setError(null);
    }, [currentName]);

    const handleSubmit = async () => {
        if (!name.trim() || name.trim() === currentName || submitting) return;
        setSubmitting(true);
        try {
            await onRename(name.trim());
            onClose();
        } catch (err: any) {
            // Error is presented via Google Drive snackbar toast
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title="Đổi tên thư mục" onClose={onClose}>
            <div className="px-5 py-4">
                <label className="text-sm text-gray-600">Tên thư mục</label>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Nhập tên thư mục mới"
                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || name.trim() === currentName || submitting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </ModalShell>
    );
}

interface PendingUploadItem {
    id: string;
    file: File;
    tags: string[];
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadFileModalProps {
    parentFolderName: string;
    onClose: () => void;
    onUpload: (items: { file: File; tags: string[] }[]) => Promise<void> | void;
}

export function UploadFileModal({ parentFolderName, onClose, onUpload }: UploadFileModalProps) {
    const [pendingFiles, setPendingFiles] = useState<PendingUploadItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>(SUGGESTED_TAGS);

    useEffect(() => {
        fileManagementService.getAllTags().then((dbTags) => {
            if (dbTags && dbTags.length > 0) {
                const combined = Array.from(new Set([...dbTags, ...SUGGESTED_TAGS]));
                setAvailableTags(combined);
            }
        });
    }, []);

    const addFiles = (fileList: FileList | null) => {
        if (!fileList || uploading) return;
        const newOnes: PendingUploadItem[] = Array.from(fileList).map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
            tags: [],
        }));
        setPendingFiles((prev) => [...prev, ...newOnes]);
    };

    const removeFile = (id: string) => {
        if (uploading) return;
        setPendingFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleAddTagToFile = (id: string, tagToAdd: string) => {
        const trimmed = tagToAdd.trim().replace(/^#+/, '');
        if (!trimmed) return;
        setPendingFiles((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                if (item.tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
                    return item;
                }
                return { ...item, tags: [...item.tags, trimmed] };
            })
        );
    };

    const handleRemoveTagFromFile = (id: string, tagToRemove: string) => {
        setPendingFiles((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                return { ...item, tags: item.tags.filter((t) => t !== tagToRemove) };
            })
        );
    };

    // Áp dụng tag cho tất cả file trong danh sách
    const handleApplyTagToAll = (tagToAdd: string) => {
        const trimmed = tagToAdd.trim().replace(/^#+/, '');
        if (!trimmed) return;
        setPendingFiles((prev) =>
            prev.map((item) => {
                if (item.tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
                    return item;
                }
                return { ...item, tags: [...item.tags, trimmed] };
            })
        );
    };

    // Xóa tất cả tag
    const handleClearAllTags = () => {
        setPendingFiles((prev) => prev.map((item) => ({ ...item, tags: [] })));
    };

    const handleSubmit = async () => {
        if (pendingFiles.length === 0 || uploading) return;
        setUploading(true);
        try {
            await onUpload(pendingFiles.map((f) => ({ file: f.file, tags: f.tags })));
            onClose();
        } finally {
            setUploading(false);
        }
    };

    const totalTagsCount = pendingFiles.reduce((acc, f) => acc + f.tags.length, 0);

    return (
        <ModalShell title="Upload file" onClose={onClose} maxWidth="max-w-xl">
            <div className="px-5 py-4 max-h-[82vh] overflow-y-auto">
                {/* Khu vực kéo thả file */}
                <label
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!uploading) setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        addFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors ${
                        uploading
                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                            : isDragging
                            ? 'border-blue-400 bg-blue-50/60 cursor-pointer'
                            : 'border-gray-200 hover:bg-gray-50/80 cursor-pointer'
                    }`}
                >
                    <UploadCloud className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                    <p className="text-sm text-gray-600">
                        Kéo thả file vào đây, hoặc <span className="text-blue-600 font-semibold">chọn file</span>
                    </p>
                    <p className="text-xs text-gray-400">Hỗ trợ PDF, Word, Excel, PowerPoint, hình ảnh...</p>
                    <input type="file" multiple disabled={uploading} className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </label>

                {/* Danh sách file chờ tải lên kèm gắn tag riêng */}
                {pendingFiles.length > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">
                                Danh sách file tải lên ({pendingFiles.length})
                            </span>
                            <span className="text-[11px] text-gray-400">
                                Có thể gắn nhãn riêng cho từng file bên dưới
                            </span>
                        </div>

                        <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                            {pendingFiles.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3 rounded-xl bg-gray-50/90 border border-gray-200/80 hover:border-gray-300 transition-colors shadow-2xs"
                                >
                                    {/* Hàng thông tin file */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                <FileIcon className="w-4 h-4" strokeWidth={2} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-gray-800" title={item.file.name}>
                                                    {item.file.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                    <span>{formatFileSize(item.file.size)}</span>
                                                    {item.tags.length > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-600 font-medium">{item.tags.length} nhãn</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(item.id)}
                                            disabled={uploading}
                                            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                                            title="Xóa file này"
                                        >
                                            <X className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </div>

                                    {/* Hàng nhãn riêng của file này */}
                                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 shrink-0">
                                            <Tag className="w-3 h-3 text-blue-500" />
                                            Nhãn:
                                        </span>

                                        {item.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all ${getTagColorClass(tag)}`}
                                            >
                                                #{tag}
                                                <button
                                                    type="button"
                                                    disabled={uploading}
                                                    onClick={() => handleRemoveTagFromFile(item.id, tag)}
                                                    className="p-0.5 hover:bg-black/10 rounded-full transition-colors"
                                                    title="Xóa nhãn khỏi file này"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}

                                        {/* Ô nhập tag riêng */}
                                        <input
                                            type="text"
                                            disabled={uploading}
                                            placeholder="+ Gõ nhãn (Enter)..."
                                            className="px-2 py-0.5 text-[11px] border border-dashed border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:bg-white bg-white/70 hover:border-gray-400 w-32 focus:w-44 transition-all disabled:opacity-50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const input = e.currentTarget;
                                                    const val = input.value.trim();
                                                    if (val) {
                                                        handleAddTagToFile(item.id, val);
                                                        input.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Khu vực gợi ý nhãn / Gắn nhanh cho tất cả */}
                {pendingFiles.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>
                                    {pendingFiles.length === 1
                                        ? 'Gợi ý nhãn nhanh cho file:'
                                        : 'Gắn nhanh nhãn chung cho tất cả file:'}
                                </span>
                            </div>
                            {totalTagsCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAllTags}
                                    disabled={uploading}
                                    className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    Xóa tất cả nhãn
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {availableTags.slice(0, 15).map((sTag) => (
                                <button
                                    key={sTag}
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => {
                                        if (pendingFiles.length === 1) {
                                            handleAddTagToFile(pendingFiles[0].id, sTag);
                                        } else {
                                            handleApplyTagToAll(sTag);
                                        }
                                    }}
                                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white text-gray-700 border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 transition-all shadow-2xs font-medium"
                                    title={
                                        pendingFiles.length === 1
                                            ? `Gắn #${sTag} cho file này`
                                            : `Gắn #${sTag} cho tất cả ${pendingFiles.length} file`
                                    }
                                >
                                    + #{sTag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="mt-4 text-xs text-gray-400">
                    File sẽ được tải lên thư mục <span className="text-gray-700 font-medium">{parentFolderName}</span>
                </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                    onClick={onClose}
                    disabled={uploading}
                    className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={pendingFiles.length === 0 || uploading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading
                        ? 'Đang tải lên...'
                        : `Upload ${pendingFiles.length > 0 ? `${pendingFiles.length} file` : ''}${
                              totalTagsCount > 0 ? ` (${totalTagsCount} nhãn)` : ''
                          }`}
                </button>
            </div>
        </ModalShell>
    );
}

interface RenameFileModalProps {
    currentName: string;
    onClose: () => void;
    onRename: (newName: string) => Promise<void> | void;
}

export function RenameFileModal({ currentName, onClose, onRename }: RenameFileModalProps) {
    const [name, setName] = useState(currentName);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const handleSubmit = async () => {
        if (!name.trim() || name.trim() === currentName || submitting) return;
        setSubmitting(true);
        try {
            await onRename(name.trim());
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title="Đổi tên tệp tài liệu" onClose={onClose}>
            <div className="px-5 py-4">
                <label className="text-sm text-gray-600">Tên tệp</label>
                <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Nhập tên tệp mới"
                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || name.trim() === currentName || submitting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Đang đổi tên...' : 'Đổi tên'}
                </button>
            </div>
        </ModalShell>
    );
}

interface MoveFileModalProps {
    file: { id: string | number; name: string; folderId?: string | number | null };
    folderTree: any[];
    onClose: () => void;
    onMove: (targetFolderId: string | number | null, targetFolderName: string) => Promise<void> | void;
}

export function MoveFileModal({ file, folderTree, onClose, onMove }: MoveFileModalProps) {
    const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
    const [selectedTargetName, setSelectedTargetName] = useState<string>('Kho tri thức chung');
    const [submitting, setSubmitting] = useState(false);

    const flatFolders = useMemo(() => {
        const list: { id: string; name: string; depth: number }[] = [
            { id: 'all', name: 'Kho tri thức chung (Gốc)', depth: 0 }
        ];
        const walk = (nodes: any[], depth: number) => {
            for (const n of nodes) {
                if (n.type === 'folder' || n.id !== undefined) {
                    list.push({ id: n.id.toString(), name: n.name, depth });
                    if (n.children && n.children.length > 0) {
                        walk(n.children.filter((c: any) => c.type === 'folder'), depth + 1);
                    }
                }
            }
        };
        walk(folderTree.filter((c: any) => c.type === 'folder'), 1);
        return list;
    }, [folderTree]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const targetId = selectedTargetId === 'all' ? null : selectedTargetId;
            await onMove(targetId, selectedTargetName);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell title={`Di chuyển "${file.name}"`} onClose={onClose}>
            <div className="px-5 py-4">
                <label className="text-sm font-medium text-gray-700">Chọn thư mục đích:</label>
                <div className="mt-2.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {flatFolders.map((f: { id: string; name: string; depth: number }) => {
                        const isCurrent = file.folderId ? file.folderId.toString() === f.id : f.id === 'all';
                        const isSelected = selectedTargetId === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                    setSelectedTargetId(f.id);
                                    setSelectedTargetName(f.name);
                                }}
                                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                                style={{ paddingLeft: `${14 + f.depth * 14}px` }}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600 fill-blue-500' : 'text-blue-500 fill-blue-400/30'}`} />
                                    <span className="truncate">{f.name}</span>
                                </div>
                                {isCurrent && (
                                    <span className="text-[10px] text-gray-400 font-normal shrink-0">
                                        (Thư mục hiện tại)
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Đang chuyển...' : 'Di chuyển đến đây'}
                </button>
            </div>
        </ModalShell>
    );
}


