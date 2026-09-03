'use client';
import { useState, ReactNode } from 'react';
import { X, UploadCloud, File as FileIcon } from 'lucide-react';

// ── Khung modal dùng chung ──
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
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
    onCreate: (name: string) => void;
}

export function CreateFolderModal({ parentFolderName, onClose, onCreate }: CreateFolderModalProps) {
    const [name, setName] = useState('');
    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate(name.trim());
        onClose();
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
                    Thư mục sẽ được tạo trong <span className="text-gray-600">{parentFolderName}</span>
                </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                    Tạo thư mục
                </button>
            </div>
        </ModalShell>
    );
}

interface PendingFile {
    id: string;
    file: File;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadFileModalProps {
    parentFolderName: string;
    onClose: () => void;
    onUpload: (files: File[]) => void;
}

export function UploadFileModal({ parentFolderName, onClose, onUpload }: UploadFileModalProps) {
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const newOnes: PendingFile[] = Array.from(fileList).map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
        }));
        setPendingFiles((prev) => [...prev, ...newOnes]);
    };

    const removeFile = (id: string) => setPendingFiles((prev) => prev.filter((f) => f.id !== id));

    const handleSubmit = () => {
        if (pendingFiles.length === 0) return;
        onUpload(pendingFiles.map((f) => f.file));
        onClose();
    };

    return (
        <ModalShell title="Upload file" onClose={onClose}>
            <div className="px-5 py-4">
                <label
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        addFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    <UploadCloud className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                    <p className="text-sm text-gray-600">
                        Kéo thả file vào đây, hoặc <span className="text-blue-600 font-medium">chọn file</span>
                    </p>
                    <p className="text-xs text-gray-400">Hỗ trợ PDF, Word, Excel, PowerPoint, hình ảnh</p>
                    <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </label>

                {pendingFiles.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                        {pendingFiles.map(({ id, file }) => (
                            <div key={id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileIcon className="w-4 h-4 shrink-0 text-gray-400" strokeWidth={2} />
                                    <span className="truncate text-gray-700">{file.name}</span>
                                    <span className="shrink-0 text-xs text-gray-400">{formatFileSize(file.size)}</span>
                                </div>
                                <button onClick={() => removeFile(id)} className="shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Xóa file">
                                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <p className="mt-3 text-xs text-gray-400">
                    File sẽ được tải lên <span className="text-gray-600">{parentFolderName}</span>
                </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button onClick={onClose} className="px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Hủy
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={pendingFiles.length === 0}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                    Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}
                </button>
            </div>
        </ModalShell>
    );
}
