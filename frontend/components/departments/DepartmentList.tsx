'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Search, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
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
                left: Math.max(10, rect.right - 176)
            });
            setOpenMenuId(deptId);
        }
    };

    const filteredDepartments = useMemo(() => {
        if (!searchQuery.trim()) return departments;
        return departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    }, [departments, searchQuery]);

    return (
        <div className="w-80 shrink-0 bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 p-4 flex flex-col justify-between shadow-xs select-none">
            <div className="flex flex-col flex-1 min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[14px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Danh sách phòng ban</h2>
                    <button
                        onClick={onCreate}
                        aria-label="Tạo phòng ban"
                        title="Tạo phòng ban mới"
                        className="w-8 h-8 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 text-[#444746] dark:text-neutral-300 flex items-center justify-center transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Search Box */}
                <div className="relative mb-3">
                    <Search className="w-4 h-4 text-[#747775] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm phòng ban..."
                        className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded-full bg-[#EDF2FC] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] border-0 focus:bg-white dark:focus:bg-[#1E1F20] focus:outline-none focus:ring-1 focus:ring-[#0B57D0] transition"
                    />
                </div>

                {/* List Items */}
                <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-0.5">
                    {filteredDepartments.map((dept) => {
                        const isSelected = selectedId.toString() === dept.id.toString();
                        const isMenuOpen = openMenuId === dept.id;
                        return (
                            <div
                                key={dept.id}
                                onClick={() => onSelect(dept.id)}
                                className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-full text-[13px] transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#C2E7FF] dark:bg-[#004A77] text-[#001D35] dark:text-[#C2E7FF] font-medium'
                                        : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 font-normal'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#001D35] dark:text-[#C2E7FF]' : 'text-[#5f6368] dark:text-neutral-400'}`} />
                                    <span className="truncate">{dept.name}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                        isSelected
                                            ? 'bg-white/80 dark:bg-black/30 text-[#001D35] dark:text-[#C2E7FF]'
                                            : 'bg-[#EDF2FC] dark:bg-neutral-800 text-[#444746] dark:text-neutral-400'
                                    }`}>
                                        {dept.members ? dept.members.length : 0}
                                    </span>

                                    {/* 3-dot action button */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleToggleMenu(e, dept.id)}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[#5f6368] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer ${
                                            isMenuOpen ? 'bg-black/10 text-[#1F1F1F]' : ''
                                        }`}
                                        title="Tùy chọn phòng ban"
                                    >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredDepartments.length === 0 && (
                        <div className="py-8 text-center text-[13px] text-[#747775]">
                            {departments.length === 0 ? 'Chưa có phòng ban nào' : 'Không tìm thấy phòng ban'}
                        </div>
                    )}
                </div>
            </div>

            {/* Portal Action Menu */}
            {openMenuId !== null && menuCoords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: `${menuCoords.top}px`,
                        left: `${menuCoords.left}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-44 bg-white dark:bg-[#282A2C] rounded-[8px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-[#E0E0E0] dark:border-neutral-700 py-1.5 z-[9999] animate-in fade-in duration-100"
                >
                    <button
                        type="button"
                        onClick={() => {
                            const targetDept = departments.find(d => d.id === openMenuId);
                            setOpenMenuId(null);
                            setMenuCoords(null);
                            if (targetDept && onRename) onRename(targetDept);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                        <Pencil className="w-4 h-4 text-[#747775]" />
                        <span>Sửa tên phòng ban</span>
                    </button>
                    <div className="my-1 border-t border-[#F0F0F0] dark:border-neutral-800" />
                    <button
                        type="button"
                        onClick={() => {
                            const targetDept = departments.find(d => d.id === openMenuId);
                            setOpenMenuId(null);
                            setMenuCoords(null);
                            if (targetDept && onDelete) onDelete(targetDept);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-[#D93025] hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4 text-[#D93025]" />
                        <span>Xóa phòng ban</span>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}
