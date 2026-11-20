'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Pencil, ChevronDown, MoreHorizontal, ChevronLeft, ChevronRight, Trash2, Users, Check } from 'lucide-react';
import type { Department, DepartmentRole } from '@/lib/types';
import UserAvatar from '@/components/common/UserAvatar';

interface MemberItem {
    userId: string | number;
    name: string;
    email: string;
    role: DepartmentRole;
    avatarInitial?: string;
    avatarColor?: string;
    avatarUrl?: string;
}

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

    const [openRoleUserId, setOpenRoleUserId] = useState<string | number | null>(null);
    const [roleCoords, setRoleCoords] = useState<{ top: number; left: number } | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const roleMenuRef = useRef<HTMLDivElement>(null);

    const members = department.members || [];

    useEffect(() => {
        const handleClose = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMemberMenuId(null);
                setMenuCoords(null);
            }
            if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
                setOpenRoleUserId(null);
                setRoleCoords(null);
            }
        };
        const handleScroll = () => {
            setOpenMemberMenuId(null);
            setMenuCoords(null);
            setOpenRoleUserId(null);
            setRoleCoords(null);
        };
        if (openMemberMenuId !== null || openRoleUserId !== null) {
            document.addEventListener('mousedown', handleClose);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClose);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMemberMenuId, openRoleUserId]);

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

    const handleToggleRoleMenu = (e: React.MouseEvent<HTMLButtonElement>, member: MemberItem) => {
        e.stopPropagation();
        if (openRoleUserId === member.userId) {
            setOpenRoleUserId(null);
            setRoleCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setRoleCoords({
                top: rect.bottom + 4,
                left: Math.max(10, rect.left),
            });
            setOpenRoleUserId(member.userId);
            setOpenMemberMenuId(null);
        }
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
            setOpenRoleUserId(null);
        }
    };

    const allSelected = members.length > 0 && selectedUserIds.length === members.length;

    return (
        <div className="flex-1 bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 p-6 flex flex-col justify-between min-w-0 select-none shadow-xs">
            <div>
                {/* Department Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E0E0E0] dark:border-neutral-800">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-[18px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] leading-none">
                                {department.name}
                            </h2>
                            {onRename && (
                                <button
                                    type="button"
                                    onClick={() => onRename(department)}
                                    className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[#747775] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
                                    title="Sửa tên phòng ban"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <p className="text-[12.5px] text-[#747775] mt-1.5">
                            {members.length} thành viên đang hoạt động
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onOpenAddMember}
                            className="h-[32px] px-3.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] active:scale-[0.98] text-white text-[12.5px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-none"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Thêm</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="border-b border-[#E0E0E0] dark:border-neutral-800 text-[13px] font-normal text-[#444746] dark:text-neutral-400 select-none h-11">
                                <th className="py-2 px-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0B57D0] focus:ring-[#0B57D0] cursor-pointer accent-[#0B57D0]"
                                    />
                                </th>
                                <th className="py-2 px-3 font-normal text-[#444746] dark:text-neutral-400 w-[42%]">Thành viên</th>
                                <th className="py-2 px-3 font-normal text-[#444746] dark:text-neutral-400 w-44">Vai trò</th>
                                <th className="py-2 px-3 font-normal text-[#444746] dark:text-neutral-400 w-40">Trạng thái</th>
                                <th className="py-2 px-3 font-normal text-[#444746] dark:text-neutral-400 w-20 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0] dark:divide-neutral-800/60">
                            {members.map((member) => {
                                const isChecked = selectedUserIds.includes(member.userId);
                                const initial = member.avatarInitial || (member.name ? member.name.charAt(0).toUpperCase() : '?');
                                const isRoleOpen = openRoleUserId === member.userId;

                                return (
                                    <tr
                                        key={member.userId}
                                        className={`h-12 hover:bg-[#F8FAFD] dark:hover:bg-neutral-800/40 text-[13px] transition-colors ${
                                            isChecked ? 'bg-[#EDF2FA] dark:bg-neutral-800/80' : ''
                                        }`}
                                    >
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSelectUser(member.userId)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#0B57D0] focus:ring-[#0B57D0] cursor-pointer accent-[#0B57D0]"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <UserAvatar
                                                    name={member.name}
                                                    email={member.email}
                                                    avatarUrl={(member as any).avatarUrl}
                                                    size="base"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-[11.5px] text-[#747775] truncate">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleRoleMenu(e, member)}
                                                className={`h-[30px] px-2.5 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer select-none ${
                                                    isRoleOpen ? 'bg-[#F0F4F9] dark:bg-neutral-800' : ''
                                                }`}
                                            >
                                                <span>{member.role}</span>
                                                <ChevronDown className="w-3.5 h-3.5 text-[#444746] dark:text-neutral-400" />
                                            </button>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[#137333] shrink-0 inline-block" />
                                                <span className="text-[13px] text-[#444746] dark:text-neutral-400">Đang hoạt động</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleMemberMenu(e, member.userId)}
                                                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-white inline-flex items-center justify-center transition cursor-pointer"
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
                                    <td colSpan={5} className="py-16 text-center text-[#747775]">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="w-8 h-8 text-[#747775]/60 mb-2 stroke-[1.5]" />
                                            <p className="text-[13px] font-medium text-[#444746] dark:text-neutral-300">Chưa có thành viên nào trong phòng ban</p>
                                            <p className="text-[12px] text-[#747775] mt-1">Nhấn &quot;Thêm&quot; để bổ sung nhân sự vào phòng ban này</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Pagination */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0] dark:border-neutral-800 mt-6 text-[12.5px] text-[#747775]">
                <span>
                    Hiển thị 1–{members.length} trong {members.length} kết quả
                </span>

                <div className="flex items-center gap-1">
                    <button
                        className="w-7 h-7 rounded-full text-[#747775] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 flex items-center justify-center transition cursor-pointer disabled:opacity-30"
                        disabled
                        aria-label="Trang trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="w-7 h-7 rounded-full bg-[#0B57D0] text-white text-[12px] font-medium flex items-center justify-center">
                        1
                    </span>
                    <button
                        className="w-7 h-7 rounded-full text-[#747775] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 flex items-center justify-center transition cursor-pointer disabled:opacity-30"
                        disabled
                        aria-label="Trang sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Role Select Popover Menu (Matching ShareModal style) */}
            {openRoleUserId !== null && roleCoords && typeof document !== 'undefined' && createPortal(
                <div
                    ref={roleMenuRef}
                    style={{
                        position: 'fixed',
                        top: `${roleCoords.top}px`,
                        left: `${roleCoords.left}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-44 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-neutral-700 py-1.5 z-[9999] animate-in fade-in duration-100 select-none"
                >
                    {(['Quản trị viên', 'Quản lý', 'Thành viên'] as const).map((roleOption) => {
                        const activeMember = members.find(m => m.userId === openRoleUserId);
                        const isSelected = activeMember?.role === roleOption;
                        return (
                            <button
                                key={roleOption}
                                type="button"
                                onClick={() => {
                                    onChangeRole(openRoleUserId, roleOption);
                                    setOpenRoleUserId(null);
                                    setRoleCoords(null);
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-neutral-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer transition-colors"
                            >
                                <span>{roleOption}</span>
                                {isSelected && <Check className="w-4 h-4 text-[#0B57D0]" />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}

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
                    className="w-44 bg-white dark:bg-[#282A2C] rounded-[8px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-[#E0E0E0] dark:border-neutral-700 py-1.5 z-[9999] animate-in fade-in duration-100"
                >
                    <button
                        type="button"
                        onClick={() => {
                            const target = members.find(m => m.userId === openMemberMenuId);
                            setOpenMemberMenuId(null);
                            setMenuCoords(null);
                            if (target) onOpenRemoveMember(target);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-[13px] text-[#D93025] hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4 text-[#D93025]" />
                        <span>Xóa khỏi phòng ban</span>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}
