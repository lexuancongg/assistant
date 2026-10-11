'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Menu,
    MoreVertical,
    ShieldCheck,
    Upload,
    Edit3,
    Trash2,
    Eye,
    FolderPlus,
    FolderInput,
    File as FileIcon
} from 'lucide-react';
import FileTypeIcon from './FileTypeIcon';
import { useSidebar } from '@/lib/sidebar-context';

export type TreeNodeItem = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    fileType?: string;
    size?: string;
    uploadedByEmail?: string;
    children?: TreeNodeItem[];
};

interface FolderTreeProps {
    selectedId: string;
    onSelect: (id: string, name: string) => void;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
    onRenameFolder?: (id: string, name: string) => void;
    onMoveFiles?: (fileIds: (string | number)[], targetFolderId: string | number | null, targetFolderName: string) => void;
    treeData?: TreeNodeItem[];
    currentUserEmail?: string;
    isAdmin?: boolean;
}

function FolderContextMenu({
    node,
    onClose,
    onManagePermission,
    onUploadToFolder,
    onCreateSubFolder,
    onRenameFolder
}: {
    node: TreeNodeItem;
    onClose: () => void;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
    onRenameFolder?: (id: string, name: string) => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const isFile = node.type === 'file';

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute right-2 top-8 z-30 w-48 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xl dark:shadow-slate-950/50 py-1.5 text-xs animate-fadeIn"
        >
            {isFile ? (
                <button
                    onClick={() => {
                        onClose();
                        router.push('/files');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                    <Eye className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                    Xem chi tiết file
                </button>
            ) : (
                <>
                    {onUploadToFolder && (
                        <button
                            onClick={() => {
                                onClose();
                                onUploadToFolder(node.id, node.name);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            <Upload className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                            Tải file vào thư mục
                        </button>
                    )}
                    {onCreateSubFolder && (
                        <button
                            onClick={() => {
                                onClose();
                                onCreateSubFolder(node.id, node.name);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            <FolderPlus className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                            Tạo thư mục con
                        </button>
                    )}
                    {onRenameFolder && (
                        <button
                            onClick={() => {
                                onClose();
                                onRenameFolder(node.id, node.name);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                            Đổi tên thư mục
                        </button>
                    )}
                </>
            )}

            <button
                onClick={() => {
                    onClose();
                    onManagePermission(node.id, node.name);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isFile ? 'Phân quyền tài liệu' : 'Phân quyền thư mục'}
            </button>
        </div>
    );
}

function TreeNode({
    node,
    depth,
    selectedId,
    onSelect,
    collapsed,
    onManagePermission,
    onUploadToFolder,
    onCreateSubFolder,
    onRenameFolder,
    onMoveFiles,
    currentUserEmail,
    isAdmin,
}: {
    node: TreeNodeItem;
    depth: number;
    selectedId: string;
    onSelect: (id: string, name: string) => void;
    collapsed: boolean;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
    onRenameFolder?: (id: string, name: string) => void;
    onMoveFiles?: (fileIds: (string | number)[], targetFolderId: string | number | null, targetFolderName: string) => void;
    currentUserEmail?: string;
    isAdmin?: boolean;
}) {
    // Chỉ tự động mở nếu thư mục con bên dưới nó đang được chọn (đảm bảo mở từng cấp 1)
    const isAncestorOfSelected = useMemo(() => {
        if (!selectedId || selectedId === 'all') return false;
        const checkChild = (items?: TreeNodeItem[]): boolean => {
            if (!items) return false;
            return items.some((c) => c.id.toString() === selectedId.toString() || checkChild(c.children));
        };
        return checkChild(node.children);
    }, [node.children, selectedId]);

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isAncestorOfSelected) {
            setOpen(true);
        }
    }, [isAncestorOfSelected]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const router = useRouter();
    const isFile = node.type === 'file';
    const hasChildren = !isFile && !!node.children?.length;
    const isSelected = selectedId === node.id;

    const isOwner = !!(currentUserEmail && node.uploadedByEmail && currentUserEmail.toLowerCase() === node.uploadedByEmail.toLowerCase());
    const canMoveFile = isFile ? (isAdmin || isOwner) : false;

    const handleClick = () => {
        if (isFile) {
            router.push('/files');
        } else {
            onSelect(node.id, node.name);
            if (hasChildren) {
                setOpen((o) => !o);
            }
        }
    };

    return (
        <div className="relative">
            <div
                draggable={canMoveFile}
                onDragStart={canMoveFile ? (e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('application/json', JSON.stringify({ fileIds: [node.id] }));
                    e.dataTransfer.setData('text/plain', node.id.toString());
                    e.dataTransfer.effectAllowed = 'move';
                } : undefined}
                onDragOver={!isFile ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    if (!isDragOver) setIsDragOver(true);
                } : undefined}
                onDragLeave={!isFile ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                } : undefined}
                onDrop={!isFile ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                    try {
                        let fileIds: (string | number)[] = [];
                        const jsonStr = e.dataTransfer.getData('application/json');
                        if (jsonStr) {
                            const parsed = JSON.parse(jsonStr);
                            fileIds = parsed.fileIds || [];
                        }
                        if (fileIds.length === 0) {
                            const plain = e.dataTransfer.getData('text/plain');
                            if (plain) fileIds = [plain];
                        }
                        if (fileIds.length > 0 && onMoveFiles) {
                            onMoveFiles(fileIds, node.id, node.name);
                        }
                    } catch (err) {
                        console.error('Error handling drop:', err);
                    }
                } : undefined}
                onContextMenu={!isFile ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(true);
                } : undefined}
                className={`group relative flex items-center rounded-xl mb-0.5 transition-all duration-150 ${
                    canMoveFile
                        ? 'cursor-grab active:cursor-grabbing'
                        : isFile
                        ? 'cursor-pointer'
                        : ''
                } ${
                    isDragOver
                        ? 'ring-2 ring-blue-500 bg-blue-100/90 dark:bg-blue-900/60 font-bold scale-[1.02] shadow-md z-10'
                        : isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100/70 dark:hover:bg-slate-800/60'
                }`}
            >
                <button
                    onClick={handleClick}
                    title={node.name}
                    className={`flex-1 min-w-0 flex items-center gap-2 py-2 text-xs text-left ${
                        collapsed ? 'justify-center px-0' : 'pr-2'
                    }`}
                    style={collapsed ? undefined : { paddingLeft: `${6 + depth * 8}px` }}
                >
                    {/* Expand/Collapse arrow for folders */}
                    {!collapsed && !isFile && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                if (hasChildren) setOpen((o) => !o);
                            }}
                            className="w-3.5 h-3.5 shrink-0 flex items-center justify-center rounded hover:bg-gray-200/50 dark:hover:bg-slate-800 cursor-pointer text-gray-400 dark:text-slate-500"
                        >
                            {hasChildren ? (
                                open ? (
                                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.2} />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                                )
                            ) : (
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                            )}
                        </span>
                    )}

                    {/* Indent spacer for files so they align neatly under folder contents */}
                    {!collapsed && isFile && (
                        <span className="w-3.5 shrink-0 flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                        </span>
                    )}

                    {/* Icon */}
                    {isFile ? (
                        <FileTypeIcon type={(node.fileType || 'pdf').toLowerCase() as any} className="w-3.5 h-3.5 shrink-0" />
                    ) : open ? (
                        <FolderOpen className="w-4 h-4 text-blue-600 fill-blue-500 shrink-0" strokeWidth={1.5} />
                    ) : (
                        <Folder className="w-4 h-4 text-blue-600 fill-blue-500 shrink-0" strokeWidth={1.5} />
                    )}

                    {/* Name */}
                    {!collapsed && (
                        <span 
                            title={node.name}
                            className={`truncate flex-1 ${isFile ? 'text-gray-600 dark:text-slate-400 font-normal hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                        >
                            {node.name}
                        </span>
                    )}

                    {/* Drag over indicator icon */}
                    {!collapsed && isDragOver && (
                        <FolderInput className="w-3.5 h-3.5 text-blue-600 animate-pulse ml-auto mr-1 shrink-0" />
                    )}
                </button>

                {/* More options button (Only for folders, always visible) */}
                {!collapsed && !isFile && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((o) => !o);
                        }}
                        aria-label="Tùy chọn thư mục"
                        title="Tùy chọn thư mục"
                        className={`p-1 mr-1 rounded-lg hover:bg-gray-200/80 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 transition-colors cursor-pointer ${
                            menuOpen
                                ? 'bg-gray-200/80 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                                : ''
                        }`}
                    >
                        <MoreVertical className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                )}

                {menuOpen && (
                    <FolderContextMenu
                        node={node}
                        onClose={() => setMenuOpen(false)}
                        onManagePermission={onManagePermission}
                        onUploadToFolder={onUploadToFolder}
                        onCreateSubFolder={onCreateSubFolder}
                        onRenameFolder={onRenameFolder}
                    />
                )}
            </div>

            {/* Render children (both subfolders & files) with slight depth */}
            {!collapsed && hasChildren && open && (
                <div className="relative border-l border-gray-200/60 dark:border-slate-800 ml-2 pl-0.5">
                    {node.children!.map((child) => (
                        <TreeNode
                            key={`${child.type}-${child.id}`}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            collapsed={collapsed}
                            onManagePermission={onManagePermission}
                            onUploadToFolder={onUploadToFolder}
                            onCreateSubFolder={onCreateSubFolder}
                            onRenameFolder={onRenameFolder}
                            onMoveFiles={onMoveFiles}
                            currentUserEmail={currentUserEmail}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({
    selectedId,
    onSelect,
    onManagePermission,
    onUploadToFolder,
    onCreateSubFolder,
    onRenameFolder,
    onMoveFiles,
    treeData = [],
    currentUserEmail,
    isAdmin
}: FolderTreeProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [rootMenuOpen, setRootMenuOpen] = useState(false);
    const rootMenuRef = useRef<HTMLDivElement>(null);
    const { isOpen: isNavbarOpen } = useSidebar();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (rootMenuRef.current && !rootMenuRef.current.contains(e.target as Node)) {
                setRootMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={`shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col h-full shadow-sm transition-all duration-300 overflow-hidden ${
                collapsed 
                    ? 'w-14' 
                    : !isNavbarOpen 
                        ? 'w-[340px]' 
                        : 'w-64'
            }`}
        >
            {/* Header */}
            <div className={`flex items-center pt-3.5 pb-2.5 border-b border-gray-100 dark:border-slate-800 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
                {!collapsed && (
                    <div className="flex items-center gap-1.5">
                        <Folder className="w-4 h-4 text-blue-600 fill-blue-500" strokeWidth={1.5} />
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cây thư mục & File</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 transition"
                    title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                    <Menu className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>

            {/* Tree items */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-0.5">
                {/* Root: Tất cả file (Kho tri thức chung) */}
                <div
                    className="group relative flex items-center rounded-xl mb-1"
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRootMenuOpen(true);
                    }}
                >
                    <button
                        onClick={() => onSelect('all', 'Tất cả file')}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (!isRootDragOver) setIsRootDragOver(true);
                        }}
                        onDragLeave={() => setIsRootDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsRootDragOver(false);
                            try {
                                let fileIds: (string | number)[] = [];
                                const jsonStr = e.dataTransfer.getData('application/json');
                                if (jsonStr) {
                                    const parsed = JSON.parse(jsonStr);
                                    fileIds = parsed.fileIds || [];
                                }
                                if (fileIds.length === 0) {
                                    const plain = e.dataTransfer.getData('text/plain');
                                    if (plain) fileIds = [plain];
                                }
                                if (fileIds.length > 0 && onMoveFiles) {
                                    onMoveFiles(fileIds, null, 'Kho tri thức chung');
                                }
                            } catch (err) {
                                console.error('Error dropping on root:', err);
                            }
                        }}
                        title={collapsed ? 'Tất cả file' : undefined}
                        className={`flex-1 min-w-0 flex items-center gap-2 py-2 rounded-xl text-xs text-left transition-all duration-150 ${
                            collapsed ? 'justify-center px-0' : 'px-3'
                        } ${
                            isRootDragOver
                                ? 'ring-2 ring-blue-500 bg-blue-100/90 dark:bg-blue-900/60 font-bold scale-[1.02] shadow-md z-10'
                                : selectedId === 'all'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold shadow-xs'
                                : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                        <Folder className={`w-4 h-4 shrink-0 ${selectedId === 'all' ? 'text-blue-600 fill-blue-500' : 'text-blue-500 fill-blue-500/40 dark:text-blue-400'}`} strokeWidth={1.5} />
                        {!collapsed && <span className="truncate flex-1">Tất cả file</span>}
                        {isRootDragOver && !collapsed && (
                            <FolderInput className="w-3.5 h-3.5 text-blue-600 animate-pulse ml-auto" />
                        )}
                    </button>

                    {!collapsed && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setRootMenuOpen((o) => !o);
                            }}
                            title="Tùy chọn kho tài liệu"
                            aria-label="Tùy chọn kho tài liệu"
                            className={`p-1 mr-1 rounded-lg hover:bg-gray-200/80 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0 transition-colors cursor-pointer ${
                                rootMenuOpen
                                    ? 'bg-gray-200/80 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                                    : ''
                            }`}
                        >
                            <MoreVertical className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                    )}

                    {rootMenuOpen && (
                        <div
                            ref={rootMenuRef}
                            className="absolute right-2 top-8 z-30 w-48 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xl dark:shadow-slate-950/50 py-1.5 text-xs animate-in fade-in"
                        >
                            {onCreateSubFolder && (
                                <button
                                    onClick={() => {
                                        setRootMenuOpen(false);
                                        onCreateSubFolder('', 'Kho tài liệu');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                >
                                    <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                                    Tạo thư mục mới
                                </button>
                            )}
                            {onUploadToFolder && (
                                <button
                                    onClick={() => {
                                        setRootMenuOpen(false);
                                        onUploadToFolder('', 'Kho tri thức chung');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                                    Tải file lên kho chung
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tree Nodes */}
                {treeData.map((node) => (
                    <TreeNode
                        key={`${node.type}-${node.id}`}
                        node={node}
                        depth={0}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        collapsed={collapsed}
                        onManagePermission={onManagePermission}
                        onUploadToFolder={onUploadToFolder}
                        onCreateSubFolder={onCreateSubFolder}
                        onRenameFolder={onRenameFolder}
                        onMoveFiles={onMoveFiles}
                        currentUserEmail={currentUserEmail}
                        isAdmin={isAdmin}
                    />
                ))}

                {!collapsed && treeData.length === 0 && (
                    <div className="px-3 py-8 text-center text-xs text-gray-400 dark:text-slate-500">
                        Chưa có thư mục nào
                    </div>
                )}
            </div>
        </div>
    );
}