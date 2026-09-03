'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderPlus, Upload, MoreVertical, Search, ShieldCheck, Trash2, Loader2, RefreshCw, KeyRound } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import FolderTree from '@/components/files/FolderTree';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import PermissionModal from '@/components/files/PermissionModal';
import RequestAccessModal from '@/components/files/RequestAccessModal';
import { CreateFolderModal, UploadFileModal } from '@/components/files/FileModals';
import forderService from "@/services/forder/forderService";
import fileManagementService, { FileItemDto } from "@/services/files/fileManagementService";
import { ForderCreateRequest } from "@/models/forder/forder";
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const FILE_TYPES = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'pptx', label: 'PowerPoint' },
    { value: 'txt', label: 'Văn bản' },
];

export default function FilesPage() {
    const router = useRouter();
    usePageBreadcrumb(['Quản lý file']);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedFolderName, setSelectedFolderName] = useState('Tất cả file');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showUploadFile, setShowUploadFile] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
    const [files, setFiles] = useState<FileItemDto[]>([]);
    const [folderTree, setFolderTree] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [loadingTree, setLoadingTree] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');

    const loadData = async (silent = false) => {
        if (!silent) {
            setLoadingFiles(true);
            setLoadingTree(true);
        }

        try {
            const [filesRes, treeRes] = await Promise.allSettled([
                fileManagementService.getActiveFiles(),
                forderService.getFolderTree()
            ]);

            const activeFiles = filesRes.status === 'fulfilled' ? filesRes.value : [];
            const folderData = treeRes.status === 'fulfilled' ? treeRes.value : [];

            if (filesRes.status === 'fulfilled') {
                setFiles(activeFiles);
            }

            // Xây dựng cây phân cấp chứa cả Thư mục và File con
            const mapTree = (nodes: any[]): any[] => {
                return (nodes || []).map(n => {
                    const folderIdStr = n.id ? n.id.toString() : '';
                    const childFolders = mapTree(n.children || []);
                    const childFiles = activeFiles
                        .filter(f => f.folderId && f.folderId.toString() === folderIdStr)
                        .map(f => ({
                            id: f.id,
                            name: f.name,
                            type: 'file' as const,
                            fileType: f.fileType,
                            size: f.size
                        }));

                    return {
                        id: folderIdStr,
                        name: n.name,
                        type: 'folder' as const,
                        children: [...childFolders, ...childFiles]
                    };
                });
            };

            setFolderTree(mapTree(folderData));
        } catch (err) {
            console.warn('Cannot fetch files data:', err);
        } finally {
            setLoadingFiles(false);
            setLoadingTree(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const usedGb = 2.4;
    const totalGb = 10;
    const usedPct = Math.round((usedGb / totalGb) * 100);

    const filteredFiles = useMemo(() => {
        return files.filter((file) => {
            const inFolder = selectedFolder === 'all' || (file.folderId && file.folderId.toString() === selectedFolder);
            const matchesName = file.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
            const matchesType = typeFilter === 'all' || file.fileType.toLowerCase() === typeFilter.toLowerCase();
            return inFolder && matchesName && matchesType;
        });
    }, [files, selectedFolder, searchTerm, typeFilter]);

    const handleDeleteFile = async (id: string) => {
        if (!confirm('Bạn có muốn đưa file này vào thùng rác?')) return;
        setDeletingId(id);
        setIsProcessing(true);
        setProcessingText('Đang chuyển file vào thùng rác...');
        const tId = toast.loading('Đang xóa file...');
        try {
            await fileManagementService.softDelete(id);
            toast.success('Đã chuyển file vào thùng rác!', { id: tId });
            await loadData(true);
        } catch (err: any) {
            toast.error('Xóa file thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setDeletingId(null);
            setIsProcessing(false);
        }
    };

    return (
        <div className="px-6 pt-3 h-[calc(100vh-64px)] flex flex-col relative">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadData()}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
                        title="Tải lại danh sách"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {selectedFolder !== 'all' && (
                        <>
                            <button
                                onClick={() => router.push(`/files/permissions?folderId=${selectedFolder}&name=${encodeURIComponent(selectedFolderName)}`)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <ShieldCheck className="w-4 h-4 text-blue-600" strokeWidth={2} />
                                Phân quyền
                            </button>
                            <button
                                onClick={() => setShowRequestAccessModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                title="Gửi yêu cầu xin cấp quyền truy cập"
                            >
                                <KeyRound className="w-4 h-4 text-purple-600" strokeWidth={2} />
                                Xin quyền
                            </button>
                        </>
                    )}
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

            <div className="flex gap-4 flex-1 min-h-0">
                <FolderTree
                    selectedId={selectedFolder}
                    treeData={folderTree}
                    onSelect={(id, name) => {
                        if (selectedFolder === id) {
                            setSelectedFolder('all');
                            setSelectedFolderName('Tất cả file');
                            return;
                        }
                        setSelectedFolder(id);
                        setSelectedFolderName(name);
                    }}
                    onManagePermission={(id, name) => {
                        router.push(`/files/permissions?folderId=${id}&name=${encodeURIComponent(name)}`);
                    }}
                    onUploadToFolder={(folderId, folderName) => {
                        setSelectedFolder(folderId);
                        setSelectedFolderName(folderName);
                        setShowUploadFile(true);
                    }}
                    onCreateSubFolder={(parentId, parentName) => {
                        setSelectedFolder(parentId);
                        setSelectedFolderName(parentName);
                        setShowCreateFolder(true);
                    }}
                />

                <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-w-0">
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
                        <h2 className="text-base font-semibold text-gray-900">{selectedFolderName}</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={2} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={
                                        selectedFolder === 'all'
                                            ? 'Tìm trong tất cả file...'
                                            : `Tìm trong "${selectedFolderName}"...`
                                    }
                                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {FILE_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 border-y border-gray-100 bg-gray-50/50">
                                    <th className="px-4 py-3 min-w-[240px]">Tên file</th>
                                    <th className="px-4 py-3 whitespace-nowrap min-w-[130px]">Chủ sở hữu</th>
                                    <th className="px-4 py-3 whitespace-nowrap min-w-[150px]">Người tải lên</th>
                                    <th className="px-4 py-3 whitespace-nowrap min-w-[130px]">Cập nhật</th>
                                    <th className="px-4 py-3 whitespace-nowrap min-w-[90px]">Kích thước</th>
                                    <th className="px-4 py-3 whitespace-nowrap min-w-[110px] text-center">AI Index</th>
                                    <th className="px-4 py-3 whitespace-nowrap w-16 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loadingFiles ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-28"></div></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                            <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                            <td className="px-4 py-3 text-center"><div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                            <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-100 rounded w-8 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredFiles.map((file) => (
                                        <tr
                                            key={file.id}
                                            className="hover:bg-gray-50/70 transition-colors group"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/files/${file.id}`}
                                                    className="flex items-center gap-2.5 min-w-0"
                                                    title={file.name}
                                                >
                                                    <FileTypeIcon type={file.fileType} className="w-4 h-4 shrink-0" />
                                                    <span className="text-gray-900 group-hover:text-blue-600 font-medium truncate max-w-[260px] sm:max-w-[340px]">
                                                        {file.name}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium text-xs">
                                                {file.ownerDepartmentName || file.owner || 'Công ty'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                                                {file.uploadedByName || 'Quản trị viên'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                                                {file.updatedAt}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs font-mono">
                                                {file.size}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${file.aiIndexed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${file.aiIndexed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                                    {file.aiIndexed ? 'Đã index' : 'Đang xử lý'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDeleteFile(file.id)}
                                                    disabled={deletingId === file.id}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                                                    title="Chuyển vào thùng rác"
                                                >
                                                    {deletingId === file.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {!loadingFiles && filteredFiles.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                                            Không có file nào trong thư mục này
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center gap-3">
                        <span className="text-sm text-gray-500">Đã dùng: {usedGb} GB / {totalGb} GB</span>
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
                    onCreate={async (name) => {
                        setIsProcessing(true);
                        setProcessingText('Đang tạo thư mục mới...');
                        const tId = toast.loading('Đang tạo thư mục...');
                        try {
                            const forderRequest: ForderCreateRequest = {
                                name: name,
                                parentId: selectedFolder === 'all' ? null : selectedFolder
                            };
                            await forderService.createForder(forderRequest);
                            toast.success('Tạo thư mục thành công!', { id: tId });
                            setShowCreateFolder(false);
                            await loadData(true);
                        } catch (error: any) {
                            toast.error('Tạo thư mục thất bại: ' + (error?.message || error), { id: tId });
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                />
            )}

            {showUploadFile && (
                <UploadFileModal
                    parentFolderName={selectedFolderName}
                    onClose={() => setShowUploadFile(false)}
                    onUpload={async (filesToUpload) => {
                        if (filesToUpload.length === 0) return;
                        setIsProcessing(true);
                        setProcessingText(`Đang tải lên ${filesToUpload.length} file vào hệ thống...`);
                        const tId = toast.loading(`Đang upload ${filesToUpload.length} file...`);
                        try {
                            for (const file of filesToUpload) {
                                const fd = new FormData();
                                fd.append('file', file);
                                if (selectedFolder && selectedFolder !== 'all') {
                                    fd.append('folderId', selectedFolder);
                                }
                                await fileManagementService.uploadFile(fd);
                            }
                            toast.success('Upload file thành công!', { id: tId });
                            await loadData(true);
                        } catch (err: any) {
                            toast.error('Upload thất bại: ' + (err?.message || err), { id: tId });
                            throw err;
                        } finally {
                            setIsProcessing(false);
                        }
                    }}
                />
            )}

            {showPermissionModal && selectedFolder !== 'all' && (
                <PermissionModal
                    target={{
                        type: 'folder',
                        id: selectedFolder,
                        name: selectedFolderName,
                        childFileCount: filteredFiles.length,
                        childFolderCount: 0,
                    }}
                    onClose={() => setShowPermissionModal(false)}
                />
            )}

            <RequestAccessModal
                isOpen={showRequestAccessModal}
                folderId={selectedFolder !== 'all' && !isNaN(Number(selectedFolder)) ? Number(selectedFolder) : undefined}
                folderName={selectedFolderName}
                onClose={() => setShowRequestAccessModal(false)}
            />
        </div>
    );
}
