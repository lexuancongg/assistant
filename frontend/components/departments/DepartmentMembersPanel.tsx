'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Pencil, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { Department, DepartmentRole } from '@/lib/types';

interface MemberItem {
    userId: string | number;
    name: string;
    email: string;
    role: DepartmentRole;
    avatarInitial?: string;
    avatarColor?: string;
}

const AVATAR_COLORS = [
    'bg-rose-100 text-rose-600',
    'bg-sky-100 text-sky-600',
    'bg-purple-100 text-purple-600',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-indigo-100 text-indigo-700',
];

export default function DepartmentMembersPanel({
    department,
    onOpenAddMember,
    onOpenRemoveMember,
    onChangeRole,
    onRename,
}: {
    department: Department;
    onOpenAddMember: () => void;
    onOpenRemoveMember: (member: MemberItem) => void;
    onChangeRole: (userId: string | number, role: DepartmentRole) => void;
    onRename?: (dept: Department) => void;
}) {
    const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);
    const [openMemberMenuId, setOpenMemberMenuId] = useState<string | number | null>(null);
    const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const [deptMenuOpen, setDeptMenuOpen] = useState(false);
    const [deptMenuCoords, setDeptMenuCoords] = useState<{ top: number; left: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const deptMenuRef = useRef<HTMLDivElement>(null);

    const members = department.members || [];

    useEffect(() => {
        const handleClose = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMemberMenuId(null);
                setMenuCoords(null);
            }
            if (deptMenuRef.current && !deptMenuRef.current.contains(e.target as Node)) {
                setDeptMenuOpen(false);
                setDeptMenuCoords(null);
            }
        };
        const handleScroll = () => {
            setOpenMemberMenuId(null);
            setMenuCoords(null);
            setDeptMenuOpen(false);
            setDeptMenuCoords(null);
        };
        if (openMemberMenuId !== null || deptMenuOpen) {
            document.addEventListener('mousedown', handleClose);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMemberMenuId, deptMenuOpen]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(members.map(m => m.userId));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleToggleSelectUser = (userId: string | number) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleToggleMemberMenu = (e: React.MouseEvent<HTMLButtonElement>, userId: string | number) => {
        e.stopPropagation();
        if (openMemberMenuId === userId) {
            setOpenMemberMenuId(null);
            setMenuCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuCoords({
                top: rect.bottom + 6,
                left: Math.max(10, rect.right - 160)
            });
            setOpenMemberMenuId(userId);
        }
    };

    const handleToggleDeptMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (deptMenuOpen) {
            setDeptMenuOpen(false);
            setDeptMenuCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setDeptMenuCoords({
                top: rect.bottom + 6,
                left: Math.max(10, rect.right - 160)
            });
            setDeptMenuOpen(true);
        }
    };

    const allSelected = members.length > 0 && selectedUserIds.length === members.length;

    return (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs min-w-0 flex flex-col justify-between">
            <div>
                {/* Department Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-[18px] font-medium text-[#1F1F1F] dark:text-white">{department.name}</h2>
                                {onRename && (
                                    <button
                                        onClick={() => onRename(department)}
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                        title="Sửa tên phòng ban"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {members.length} thành viên đang hoạt động
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenAddMember}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                            <UserPlus className="w-3.5 h-3.5" strokeWidth={2.2} />
                            Thêm thành viên
                        </button>
                        <button
                            type="button"
                            onClick={handleToggleDeptMenu}
                            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            title="Tùy chọn phòng ban"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                                <th className="py-3 px-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                    />
                                </th>
                                <th className="py-3 px-3 font-semibold text-slate-500">Thành viên</th>
                                <th className="py-3 px-3 font-semibold text-slate-500 w-44">Vai trò</th>
                                <th className="py-3 px-3 font-semibold text-slate-500 w-44">Trạng thái</th>
                                <th className="py-3 px-3 font-semibold text-slate-500 w-20 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.map((member, idx) => {
                                const isChecked = selectedUserIds.includes(member.userId);
                                const avatarColor = member.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                const initial = member.avatarInitial || (member.name ? member.name.charAt(0).toUpperCase() : '?');

                                return (
                                    <tr key={member.userId} className={`hover:bg-slate-50/70 transition ${isChecked ? 'bg-blue-50/30' : ''}`}>
                                        <td className="py-3.5 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSelectUser(member.userId)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                                            />
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${avatarColor}`}>
                                                    {initial}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="relative inline-block">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => onChangeRole(member.userId, e.target.value as DepartmentRole)}
                                                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 text-slate-700 text-xs font-medium outline-none hover:bg-slate-100/70 focus:border-blue-500 cursor-pointer transition"
                                                >
                                                    <option value="Quản trị viên">Quản trị viên</option>
                                                    <option value="Quản lý">Quản lý</option>
                                                    <option value="Thành viên">Thành viên</option>
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0 inline-block"></span>
                                                <span className="text-xs font-medium text-slate-700">Đang hoạt động</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleMemberMenu(e, member.userId)}
                                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                                title="Tùy chọn thành viên"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-xs font-medium text-slate-600">Chưa có thành viên nào trong phòng ban</p>
                                            <p className="text-[11px] text-slate-400 mt-1">Nhấn &quot;Thêm thành viên&quot; để bổ sung nhân sự vào phòng ban này</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Pagination Matching Reference Image */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                <span className="text-xs text-slate-400 font-medium">
                    Hiển thị 1–{members.length} trong {members.length} kết quả
                </span>

                <div className="flex items-center gap-1.5">
                    <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30"
                        disabled
                        aria-label="Trang trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center justify-center shadow-xs">
                        1
                    </button>
                    <button
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-30"
                        disabled
                        aria-label="Trang sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Member Context Menu */}
            {openMemberMenuId !== null && menuCoords && typeof document !== 'undefined' && createPortal(
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
                            const target = members.find(m => m.userId === openMemberMenuId);
                            setOpenMemberMenuId(null);
                            setMenuCoords(null);
                            if (target) onOpenRemoveMember(target);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Xóa khỏi phòng ban
                    </button>
                </div>,
                document.body
            )}

            {/* Department Actions Context Menu */}
            {deptMenuOpen && deptMenuCoords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={deptMenuRef}
                    style={{
                        position: 'fixed',
                        top: `${deptMenuCoords.top}px`,
                        left: `${deptMenuCoords.left}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                >
                    {onRename && (
                        <button
                            type="button"
                            onClick={() => {
                                setDeptMenuOpen(false);
                                setDeptMenuCoords(null);
                                onRename(department);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            Sửa tên phòng ban
                        </button>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
