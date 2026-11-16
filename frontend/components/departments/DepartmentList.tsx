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
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Danh sách phòng ban</h2>
                    <button
                        onClick={onCreate}
                        aria-label="Tạo phòng ban"
                        title="Tạo phòng ban mới"
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Search Box */}
                <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm phòng ban..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder:text-slate-400 transition"
                    />
                </div>

                {/* List Items */}
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-0.5">
                    {filteredDepartments.map((dept) => {
                        const isSelected = selectedId.toString() === dept.id.toString();
                        const isMenuOpen = openMenuId === dept.id;
                        return (
                            <div
                                key={dept.id}
                                onClick={() => onSelect(dept.id)}
                                className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900 font-semibold shadow-2xs'
                                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={2} />
                                    <span className="truncate">{dept.name}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {dept.members ? dept.members.length : 0}
                                    </span>

                                    {/* 3-dot action button */}
                                    <button
                                        type="button"
                                        onClick={(e) => handleToggleMenu(e, dept.id)}
                                        className={`p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer ${
                                            isMenuOpen ? 'bg-slate-100 text-slate-600' : ''
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
                        <div className="py-8 text-center text-xs text-slate-400">
                            {departments.length === 0 ? 'Chưa có phòng ban nào' : 'Không tìm thấy phòng ban'}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom CTA Box Matching Reference Image */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center text-center">
                <svg className="w-16 h-16 mb-2" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="20" width="44" height="32" rx="7" fill="#EFF6FF" />
                    <path d="M10 24C10 21.7909 11.7909 20 14 20H24.5858C25.6467 20 26.6642 20.4214 27.4142 21.1716L29.5858 23.3431C30.3358 24.0933 31.3533 24.5147 32.4142 24.5147H50C52.2091 24.5147 54 26.3056 54 28.5147V45C54 47.2091 52.2091 49 50 49H14C11.7909 49 10 47.2091 10 45V24Z" fill="#DBEAFE" />
                    <circle cx="32" cy="36" r="9" fill="#2563EB" fillOpacity="0.1" />
                    <path d="M32 30L37 32.5V36.5C37 39.8 34.8 42.2 32 43C29.2 42.2 27 39.8 27 36.5V32.5L32 30Z" fill="#3B82F6" />
                    <path d="M30.5 36.5L31.8 37.8L34.5 35" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-xs font-bold text-slate-800">Tạo phòng ban mới</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                    Thêm phòng ban để quản lý tổ chức hiệu quả hơn
                </p>
                <button
                    onClick={onCreate}
                    className="w-full mt-3 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Tạo phòng ban
                </button>
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
                    className="w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                >
                    <button
                        type="button"
                        onClick={() => {
                            const targetDept = departments.find(d => d.id === openMenuId);
                            setOpenMenuId(null);
                            setMenuCoords(null);
                            if (targetDept && onRename) onRename(targetDept);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition cursor-pointer"
                    >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        Sửa tên phòng ban
                    </button>
                    <div className="my-1 border-t border-slate-100" />
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
