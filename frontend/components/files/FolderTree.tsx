'use client';
import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight } from 'lucide-react';
import type { FolderNode } from '@/lib/types';
import { FOLDER_TREE } from '@/lib/fake-data';

interface TreeNodeProps {
    node: FolderNode;
    depth: number;
    selectedId: string;
    onSelect: (id: string, name: string) => void;
}

function TreeNode({ node, depth, selectedId, onSelect }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(depth === 0);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div>
            <button
                onClick={() => {
                    onSelect(node.id, node.name);
                    if (hasChildren) setExpanded((v) => !v);
                }}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                className={`w-full flex items-center gap-1.5 py-1.5 pr-2 rounded-md text-sm transition-colors duration-150 ${
                    isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${
                            expanded ? 'rotate-90' : ''
                        }`}
                        strokeWidth={2.5}
                    />
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}
                {expanded && hasChildren ? (
                    <FolderOpen className="w-4 h-4 shrink-0 text-blue-500" strokeWidth={2} />
                ) : (
                    <Folder className="w-4 h-4 shrink-0 text-gray-400" strokeWidth={2} />
                )}
                <span className="truncate">{node.name}</span>
            </button>
            {hasChildren && expanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface FolderTreeProps {
    selectedId: string;
    onSelect: (id: string, name: string) => void;
}

export default function FolderTree({ selectedId, onSelect }: FolderTreeProps) {
    return (
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col">
            <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">Thư mục</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3">
                <button
                    onClick={() => onSelect('all', 'Tất cả file')}
                    className={`w-full flex items-center gap-1.5 py-1.5 px-2 rounded-md text-sm mb-1 transition-colors duration-150 ${
                        selectedId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <span className="w-3.5 shrink-0" />
                    <Folder className="w-4 h-4 shrink-0 text-gray-400" strokeWidth={2} />
                    Tất cả file
                </button>
                {FOLDER_TREE.map((node) => (
                    <TreeNode key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
}
