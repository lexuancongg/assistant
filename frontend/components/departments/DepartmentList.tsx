'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Department } from '@/lib/types';

export default function DepartmentList({
    departments,
    selectedId,
    onSelect,
    onCreate,
    onRename,
    onDelete,
}: {
    departments: Department[];
    selectedId: string | number;
    onSelect: (id: string | number) => void;
    onCreate: () => void;
    onRename?: (dept: Department) => void;
    onDelete?: (dept: Department) => void;
}) {
    const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
    const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClose = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
                setMenuCoords(null);
            }
        };
        const handleScroll = () => {
            setOpenMenuId(null);
            setMenuCoords(null);
        };
        if (openMenuId !== null) {
            document.addEventListener('mousedown', handleClose);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMenuId]);

    const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, deptId: string | number) => {
        e.stopPropagation();
        if (openMenuId === deptId) {
            setOpenMenuId(null);
            setMenuCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuCoords({
                top: rect.bottom + 6,
                left: Math.max(10, rect.right - 176) // 176px aligns w-44 menu nicely
            });
            setOpenMenuId(deptId);
        }
    };

    return (
        <div className="w-72 sm:w-80 shrink-0 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh sách phòng ban</p>
                <button
                    onClick={onCreate}
                    aria-label="Tạo phòng ban"
                    title="Tạo phòng ban mới"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition cursor-pointer"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-240px)]">
                {departments.map((dept) => {
                    const isSelected = selectedId === dept.id;
                    const isMenuOpen = openMenuId === dept.id;
                    return (
                        <div
                            key={dept.id}
                            onClick={() => onSelect(dept.id)}
                            className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                                isSelected
                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2} />
                                <span className="truncate">{dept.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {dept.members.length}
                                </span>

                                {/* 3-dot action button */}
                                <button
                                    type="button"
                                    onClick={(e) => handleToggleMenu(e, dept.id)}
                                    className={`p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100/60 transition cursor-pointer ${
                                        isMenuOpen ? 'bg-blue-100 text-blue-700' : ''
                                    }`}
                                    title="Tùy chọn phòng ban"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {departments.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-400">
                        Chưa có phòng ban nào
                    </div>
                )}
            </div>

            <button
                onClick={onCreate}
                className="mt-3 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-xl transition cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Tạo phòng ban mới
            </button>

            {/* Portal Menu — Tinh tế, hiện đại, không bị che khuất */}
            {openMenuId !== null && menuCoords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: `${menuCoords.top}px`,
                        left: `${menuCoords.left}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-200/80 p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                >
                    <button
                        type="button"
                        onClick={() => {
                            const targetDept = departments.find(d => d.id === openMenuId);
                            setOpenMenuId(null);
                            setMenuCoords(null);
                            if (targetDept && onRename) onRename(targetDept);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        Sửa tên phòng ban
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        type="button"
                        onClick={() => {
                            const targetDept = departments.find(d => d.id === openMenuId);
                            setOpenMenuId(null);
                            setMenuCoords(null);
                            if (targetDept && onDelete) onDelete(targetDept);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Xóa phòng ban
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}