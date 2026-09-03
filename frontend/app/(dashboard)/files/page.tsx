'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FolderPlus, Upload, MoreVertical } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import FolderTree from '@/components/files/FolderTree';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import { CreateFolderModal, UploadFileModal } from '@/components/files/FileModals';
import { FILES } from '@/lib/fake-data';

export default function FilesPage() {
    usePageBreadcrumb(['Quản lý file']);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedFolderName, setSelectedFolderName] = useState('Tất cả file');
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showUploadFile, setShowUploadFile] = useState(false);

    const usedGb = 2.4;
    const totalGb = 10;
    const usedPct = Math.round((usedGb / totalGb) * 100);

    return (
        <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Quản lý file</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổ chức, quản lý và chia sẻ file an toàn trong tổ chức</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateFolder(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" strokeWidth={2} />
                        Tạo thư mục
                    </button>
                    <button
                        onClick={() => setShowUploadFile(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" strokeWidth={2} />
                        Upload file
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <FolderTree
                    selectedId={selectedFolder}
                    onSelect={(id, name) => {
                        setSelectedFolder(id);
                        setSelectedFolderName(name);
                    }}
                />

                <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-w-0">
                    <div className="px-5 pt-4 pb-3">
                        <h2 className="text-base font-semibold text-gray-900">Tất cả file</h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                                    <th className="font-medium px-5 py-2.5">Tên</th>
                                    <th className="font-medium px-5 py-2.5">Chủ sở hữu</th>
                                    <th className="font-medium px-5 py-2.5">Người tải lên</th>
                                    <th className="font-medium px-5 py-2.5">Cập nhật</th>
                                    <th className="font-medium px-5 py-2.5">Kích thước</th>
                                    <th className="font-medium px-5 py-2.5 w-8"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {FILES.map((file) => (
                                    <tr key={file.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-2.5">
                                            <Link href={`/files/${file.id}`} className="flex items-center gap-2 min-w-0">
                                                <FileTypeIcon type={file.type} />
                                                <span className="text-gray-800 truncate hover:text-blue-600 transition-colors">{file.name}</span>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">{file.owner}</td>
                                        <td className="px-5 py-2.5">
                                            <div className="min-w-0">
                                                <p className="text-gray-700 truncate">{file.uploadedByName}</p>
                                                <p className="text-xs text-gray-400 truncate">{file.uploadedByEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{file.updatedAt}</td>
                                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{file.size}</td>
                                        <td className="px-5 py-2.5">
                                            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreVertical className="w-4 h-4" strokeWidth={2} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                            Đã sử dụng: {usedGb} GB / {totalGb} GB
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${usedPct}%` }} />
                        </div>
                        <span className="text-sm text-gray-500">{usedPct}%</span>
                    </div>
                </div>
            </div>

            {showCreateFolder && (
                <CreateFolderModal
                    parentFolderName={selectedFolderName}
                    onClose={() => setShowCreateFolder(false)}
                    onCreate={(name) => {
                        // TODO: gọi API tạo thư mục, ví dụ POST /api/folders { name, parentId: selectedFolder }
                        console.log('Tạo thư mục:', name, 'trong', selectedFolder);
                    }}
                />
            )}

            {showUploadFile && (
                <UploadFileModal
                    parentFolderName={selectedFolderName}
                    onClose={() => setShowUploadFile(false)}
                    onUpload={(files) => {
                        // TODO: gọi API upload, ví dụ POST /api/files/upload (FormData) với folderId: selectedFolder
                        console.log('Upload files:', files, 'vào', selectedFolder);
                    }}
                />
            )}
        </div>
    );
}
