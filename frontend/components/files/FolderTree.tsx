'use client';
import { useEffect, useRef, useState } from 'react';
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
    File as FileIcon
} from 'lucide-react';
import FileTypeIcon from './FileTypeIcon';

export type TreeNodeItem = {
    id: string;
    name: string;
    type: 'folder' | 'file';
    fileType?: string;
    size?: string;
    children?: TreeNodeItem[];
};

interface FolderTreeProps {
    selectedId: string;
    onSelect: (id: string, name: string) => void;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
    treeData?: TreeNodeItem[];
}

function FolderContextMenu({
    node,
    onClose,
    onManagePermission,
    onUploadToFolder,
    onCreateSubFolder
}: {
    node: TreeNodeItem;
    onClose: () => void;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
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
            className="absolute right-2 top-8 z-30 w-48 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 text-xs animate-fadeIn"
        >
            {isFile ? (
                <button
                    onClick={() => {
                        onClose();
                        router.push(`/files/${node.id}`);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
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
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                            <Upload className="w-3.5 h-3.5 text-gray-400" />
                            Tải file vào thư mục
                        </button>
                    )}
                    {onCreateSubFolder && (
                        <button
                            onClick={() => {
                                onClose();
                                onCreateSubFolder(node.id, node.name);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                            <FolderPlus className="w-3.5 h-3.5 text-gray-400" />
                            Tạo thư mục con
                        </button>
                    )}
                </>
            )}

            <button
                onClick={() => {
                    onClose();
                    onManagePermission(node.id, node.name);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-blue-600 hover:bg-blue-50 transition"
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
    onCreateSubFolder
}: {
    node: TreeNodeItem;
    depth: number;
    selectedId: string;
    onSelect: (id: string, name: string) => void;
    collapsed: boolean;
    onManagePermission: (id: string, name: string) => void;
    onUploadToFolder?: (folderId: string, folderName: string) => void;
    onCreateSubFolder?: (parentId: string, parentName: string) => void;
}) {
    const [open, setOpen] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    const isFile = node.type === 'file';
    const hasChildren = !isFile && !!node.children?.length;
    const isSelected = selectedId === node.id;

    const handleClick = () => {
        if (isFile) {
            router.push(`/files/${node.id}`);
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
                className={`group relative flex items-center rounded-xl mb-0.5 transition-all duration-150 ${
                    isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100/70'
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
                            className="w-3.5 h-3.5 shrink-0 flex items-center justify-center rounded hover:bg-gray-200/50 cursor-pointer text-gray-400"
                        >
                            {hasChildren ? (
                                open ? (
                                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.2} />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                                )
                            ) : (
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            )}
                        </span>
                    )}

                    {/* Indent spacer for files so they align neatly under folder contents */}
                    {!collapsed && isFile && (
                        <span className="w-3.5 shrink-0 flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        </span>
                    )}

                    {/* Icon */}
                    {isFile ? (
                        <FileTypeIcon type={(node.fileType || 'pdf').toLowerCase() as any} className="w-3.5 h-3.5 shrink-0" />
                    ) : open ? (
                        <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2} />
                    ) : (
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2} />
                    )}

                    {/* Name */}
                    {!collapsed && (
                        <span className={`truncate flex-1 ${isFile ? 'text-gray-600 font-normal hover:text-blue-600' : ''}`}>
                            {node.name}
                        </span>
                    )}
                </button>

                {/* More options button */}
                {!collapsed && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((o) => !o);
                        }}
                        aria-label="Tùy chọn"
                        className={`p-1 mr-1.5 rounded-lg hover:bg-gray-200/70 text-gray-400 hover:text-gray-600 shrink-0 transition-opacity ${
                            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                    />
                )}
            </div>

            {/* Render children (both subfolders & files) with slight depth */}
            {!collapsed && hasChildren && open && (
                <div className="relative border-l border-gray-200/60 ml-2 pl-0.5">
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
    treeData = []
}: FolderTreeProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`shrink-0 bg-white rounded-2xl border border-gray-200 flex flex-col h-full shadow-sm transition-all duration-200 overflow-hidden ${
                collapsed ? 'w-14' : 'w-64'
            }`}
        >
            {/* Header */}
            <div className={`flex items-center pt-3.5 pb-2.5 border-b border-gray-100 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
                {!collapsed && (
                    <div className="flex items-center gap-1.5">
                        <Folder className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cây thư mục & File</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                    title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                    <Menu className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>

            {/* Tree items */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-0.5">
                {/* Root: Tất cả file */}
                <button
                    onClick={() => onSelect('all', 'Tất cả file')}
                    title={collapsed ? 'Tất cả file' : undefined}
                    className={`w-full flex items-center gap-2 py-2 rounded-xl text-xs text-left mb-1 transition-all duration-150 ${
                        collapsed ? 'justify-center px-0' : 'px-3'
                    } ${selectedId === 'all' ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                    <Folder className={`w-4 h-4 shrink-0 ${selectedId === 'all' ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2} />
                    {!collapsed && <span className="truncate">Tất cả file</span>}
                </button>

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
                    />
                ))}

                {!collapsed && treeData.length === 0 && (
                    <div className="px-3 py-8 text-center text-xs text-gray-400">
                        Chưa có thư mục nào
                    </div>
                )}
            </div>
        </div>
    );
}