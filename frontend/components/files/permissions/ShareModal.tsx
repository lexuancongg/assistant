'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    X,
    Building2,
    Lock,
    Globe,
    Link2,
    Check,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Settings,
} from 'lucide-react';
import departmentService, { DepartmentDto } from '@/services/department/departmentService';
import userService, { UserDto } from '@/services/user/userService';
import forderService, { FolderPermissionDto } from '@/services/forder/forderService';
import fileManagementService from '@/services/files/fileManagementService';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId?: string | number;
    folderName?: string;
    fileId?: string | number;
    fileName?: string;
    onSuccess?: () => void;
}

type AccessScope = 'Riêng tư' | 'Hạn chế' | 'Toàn công ty';

interface SelectedDept {
    id: string | number;
    name: string;
    memberCount: number;
    level: 'VIEWER' | 'EDITOR';
    isInherited?: boolean;
}

interface SelectedUser {
    id: string | number;
    name: string;
    email: string;
    level: 'VIEWER' | 'EDITOR' | 'DENY';
    isInherited?: boolean;
}

export default function ShareModal({
    isOpen,
    onClose,
    folderId,
    folderName,
    fileId,
    fileName,
    onSuccess,
}: ShareModalProps) {
    const isFile = !!fileId;
    const targetId = isFile ? fileId : folderId;
    const titleName = isFile ? (fileName || 'Tài liệu') : (folderName || 'Thư mục');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [owner, setOwner] = useState<any>(null);

    const [scope, setScope] = useState<AccessScope>('Hạn chế');
    const [generalRole, setGeneralRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
    const [directDepts, setDirectDepts] = useState<SelectedDept[]>([]);
    const [directUsers, setDirectUsers] = useState<SelectedUser[]>([]);

    // Lưu các override cá nhân cho thành viên trong phòng ban: userId -> 'INHERIT' | 'EDITOR' | 'VIEWER' | 'DENY'
    const [memberOverrides, setMemberOverrides] = useState<Record<string, 'INHERIT' | 'EDITOR' | 'VIEWER' | 'DENY'>>({});

    // Trạng thái mở rộng danh sách thành viên của phòng ban
    const [expandedDeptIds, setExpandedDeptIds] = useState<Record<string, boolean>>({});

    // Tìm kiếm thêm người/phòng ban
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Custom Dropdown Menus State (để không dùng <select> xấu)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
            // Đóng menu nổi nếu click bên ngoài
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown-container]')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = useCallback(async () => {
        if (!isOpen || !targetId) return;
        setIsLoading(true);
        try {
            const [deptsData, usersData] = await Promise.all([
                departmentService.getDepartments().catch(() => []),
                userService.getUsers().catch(() => []),
            ]);
            setDepartments(deptsData);
            setUsers(usersData);

            if (isFile) {
                const [perms, fileDetail] = await Promise.all([
                    fileManagementService.getFilePermissions(Number(targetId)).catch(() => []),
                    fileManagementService.getFileDetail(Number(targetId)).catch(() => null),
                ]);

                if (fileDetail?.uploadedByName) {
                    setOwner({
                        id: 'owner',
                        name: fileDetail.uploadedByName,
                        email: fileDetail.uploadedByEmail || '',
                        role: 'USER',
                    });
                } else if (usersData.length > 0) {
                    setOwner(usersData[0]);
                }

                if (fileDetail?.visibility === 'COMPANY') setScope('Toàn công ty');
                else if (fileDetail?.visibility === 'PRIVATE') setScope('Riêng tư');
                else setScope('Hạn chế');

                const depts: SelectedDept[] = [];
                const uList: SelectedUser[] = [];
                const overrides: Record<string, 'INHERIT' | 'EDITOR' | 'VIEWER' | 'DENY'> = {};

                perms.forEach((p: any) => {
                    if (p.subjectType === 'DEPARTMENT') {
                        const d = deptsData.find((x) => String(x.id) === String(p.subjectId));
                        depts.push({
                            id: p.subjectId,
                            name: d ? d.name : p.subjectName || 'Phòng ban',
                            memberCount: d?.members ? d.members.length : 0,
                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                        });
                    } else if (p.subjectType === 'USER') {
                        const u = usersData.find((x) => String(x.id) === String(p.subjectId));
                        overrides[String(p.subjectId)] = p.level as any;
                        uList.push({
                            id: p.subjectId,
                            name: u ? u.name : p.subjectName || 'Người dùng',
                            email: u ? u.email : p.subjectDetail || '',
                            level: p.level as any,
                        });
                    }
                });
                setDirectDepts(depts);
                setDirectUsers(uList);
                setMemberOverrides(overrides);
            } else {
                const [folderData, perms] = await Promise.all([
                    forderService.getFolderById(String(targetId)).catch(() => null),
                    forderService.getFolderPermissions(String(targetId)).catch(() => []),
                ]);

                if (folderData?.createdBy) {
                    setOwner({
                        id: folderData.createdBy.id,
                        name: folderData.createdBy.name,
                        email: folderData.createdBy.email,
                        role: 'USER',
                    });
                } else if (usersData.length > 0) {
                    setOwner(usersData[0]);
                }

                if (folderData?.accessScope === 'COMPANY_WIDE') setScope('Toàn công ty');
                else if (folderData?.accessScope === 'PRIVATE') setScope('Riêng tư');
                else setScope('Hạn chế');

                const depts: SelectedDept[] = [];
                const uList: SelectedUser[] = [];
                const overrides: Record<string, 'INHERIT' | 'EDITOR' | 'VIEWER' | 'DENY'> = {};

                perms.forEach((p: FolderPermissionDto) => {
                    if (p.subjectType === 'DEPARTMENT') {
                        const d = deptsData.find((x) => String(x.id) === String(p.subjectId));
                        depts.push({
                            id: p.subjectId,
                            name: d ? d.name : p.subjectName || 'Phòng ban',
                            memberCount: d?.members ? d.members.length : 0,
                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                        });
                    } else if (p.subjectType === 'USER') {
                        const u = usersData.find((x) => String(x.id) === String(p.subjectId));
                        overrides[String(p.subjectId)] = p.level as any;
                        uList.push({
                            id: p.subjectId,
                            name: u ? u.name : p.subjectName || 'Người dùng',
                            email: u ? u.email : p.subjectDetail || '',
                            level: p.level as any,
                        });
                    }
                });
                setDirectDepts(depts);
                setDirectUsers(uList);
                setMemberOverrides(overrides);
            }
        } catch (err) {
            console.error('Failed to load permissions:', err);
            toast.error('Không thể tải thông tin phân quyền');
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, targetId, isFile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Gợi ý tìm kiếm
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return { depts: [], users: [] };
        const q = searchQuery.toLowerCase();

        const filteredDepts = departments
            .filter((d) => d.name.toLowerCase().includes(q))
            .filter((d) => !directDepts.some((item) => String(item.id) === String(d.id)));

        const filteredUsers = users
            .filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
            .filter((u) => !owner || String(u.id) !== String(owner.id))
            .filter((u) => !directUsers.some((item) => String(item.id) === String(u.id)));

        return { depts: filteredDepts, users: filteredUsers };
    }, [searchQuery, departments, users, directDepts, directUsers, owner]);

    const handleAddDepartment = (dept: DepartmentDto) => {
        setDirectDepts((prev) => [
            ...prev,
            {
                id: dept.id,
                name: dept.name,
                memberCount: dept.members ? dept.members.length : 0,
                level: 'VIEWER',
            },
        ]);
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    const handleAddUser = (user: UserDto) => {
        setDirectUsers((prev) => [
            ...prev,
            {
                id: user.id,
                name: user.name,
                email: user.email,
                level: 'VIEWER',
            },
        ]);
        setMemberOverrides((prev) => ({
            ...prev,
            [String(user.id)]: 'VIEWER',
        }));
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    const handleRemoveDepartment = (deptId: string | number) => {
        setDirectDepts((prev) => prev.filter((d) => String(d.id) !== String(deptId)));
        const dept = departments.find((d) => String(d.id) === String(deptId));
        if (dept?.members) {
            setMemberOverrides((prev) => {
                const next = { ...prev };
                dept.members.forEach((m) => {
                    if (!directUsers.some((du) => String(du.id) === String(m.userId))) {
                        delete next[String(m.userId)];
                    }
                });
                return next;
            });
        }
    };

    const handleRemoveUser = (userId: string | number) => {
        setDirectUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
        setMemberOverrides((prev) => {
            const next = { ...prev };
            delete next[String(userId)];
            return next;
        });
    };

    const handleDeptLevelChange = (deptId: string | number, level: 'VIEWER' | 'EDITOR') => {
        setDirectDepts((prev) =>
            prev.map((d) => (String(d.id) === String(deptId) ? { ...d, level } : d))
        );
        setOpenDropdownId(null);
    };

    const handleUserLevelChange = (userId: string | number, level: 'VIEWER' | 'EDITOR' | 'DENY') => {
        setDirectUsers((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? { ...u, level } : u))
        );
        setMemberOverrides((prev) => ({
            ...prev,
            [String(userId)]: level,
        }));
        setOpenDropdownId(null);
    };

    const handleMemberOverride = (userId: string | number, override: 'INHERIT' | 'EDITOR' | 'VIEWER' | 'DENY') => {
        setMemberOverrides((prev) => {
            const next = { ...prev };
            if (override === 'INHERIT') {
                delete next[String(userId)];
                setDirectUsers((du) => du.filter((u) => String(u.id) !== String(userId)));
            } else {
                next[String(userId)] = override;
                const targetU = users.find((u) => String(u.id) === String(userId));
                if (targetU && !directUsers.some((du) => String(du.id) === String(userId))) {
                    setDirectUsers((du) => [
                        ...du,
                        {
                            id: targetU.id,
                            name: targetU.name,
                            email: targetU.email,
                            level: override,
                        },
                    ]);
                } else {
                    setDirectUsers((du) =>
                        du.map((u) => (String(u.id) === String(userId) ? { ...u, level: override } : u))
                    );
                }
            }
            return next;
        });
        setOpenDropdownId(null);
    };

    const toggleDeptExpand = (deptId: string | number) => {
        setExpandedDeptIds((prev) => ({
            ...prev,
            [String(deptId)]: !prev[String(deptId)],
        }));
    };

    const handleCopyLink = () => {
        const link = window.location.origin + `/files?folderId=${targetId}`;
        navigator.clipboard.writeText(link);
        toast.success('Đã sao chép đường liên kết vào bộ nhớ tạm');
    };

    const handleSave = async () => {
        if (!targetId) return;
        setIsSaving(true);
        try {
            const permissionsPayload: Array<{
                subjectType: 'DEPARTMENT' | 'USER';
                subjectId: number | string;
                level: 'VIEWER' | 'EDITOR' | 'DENY';
            }> = [];

            directDepts.forEach((d) => {
                permissionsPayload.push({
                    subjectType: 'DEPARTMENT',
                    subjectId: d.id,
                    level: d.level,
                });
            });

            const userIdsDone = new Set<string>();
            directUsers.forEach((u) => {
                userIdsDone.add(String(u.id));
                permissionsPayload.push({
                    subjectType: 'USER',
                    subjectId: u.id,
                    level: u.level,
                });
            });

            Object.entries(memberOverrides).forEach(([uId, lvl]) => {
                if (lvl !== 'INHERIT' && !userIdsDone.has(String(uId))) {
                    userIdsDone.add(String(uId));
                    permissionsPayload.push({
                        subjectType: 'USER',
                        subjectId: uId,
                        level: lvl,
                    });
                }
            });

            let backendScope = 'RESTRICTED';
            if (scope === 'Toàn công ty') backendScope = 'COMPANY_WIDE';
            if (scope === 'Riêng tư') backendScope = 'PRIVATE';

            if (isFile) {
                let fileVisibility = 'RESTRICTED';
                if (scope === 'Toàn công ty') fileVisibility = 'COMPANY';
                if (scope === 'Riêng tư') fileVisibility = 'PRIVATE';

                await fileManagementService.updateFilePermissions(Number(targetId), {
                    visibility: fileVisibility,
                    permissions: permissionsPayload.map((p) => ({
                        subjectType: p.subjectType,
                        subjectId: Number(p.subjectId),
                        level: p.level,
                    })),
                });
            } else {
                await forderService.updateFolderPermissions(String(targetId), {
                    accessScope: backendScope,
                    permissions: permissionsPayload.map((p) => ({
                        subjectType: p.subjectType,
                        subjectId: Number(p.subjectId),
                        level: p.level,
                    })),
                });
            }

            toast.success('Đã lưu quyền truy cập');
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error('Failed to save permissions:', err);
            toast.error('Lưu phân quyền thất bại');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 backdrop-blur-[1px] p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[512px] bg-white dark:bg-[#1E1F20] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.18)] flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. Header Google Drive Chuẩn (text-[22px] font-normal) */}
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                    <h2 className="text-[22px] font-normal leading-tight text-[#1F1F1F] dark:text-[#E3E3E3] truncate tracking-tight">
                        Chia sẻ &quot;{titleName}&quot;
                    </h2>
                    <div className="flex items-center gap-1 shrink-0 -mr-2">
                        <button
                            type="button"
                            title="Trợ giúp"
                            className="w-10 h-10 flex items-center justify-center text-[#444746] dark:text-slate-400 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                        >
                            <HelpCircle className="w-5 h-5 stroke-[1.75]" />
                        </button>
                        <button
                            type="button"
                            title="Cài đặt"
                            className="w-10 h-10 flex items-center justify-center text-[#444746] dark:text-slate-400 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                        >
                            <Settings className="w-5 h-5 stroke-[1.75]" />
                        </button>
                    </div>
                </div>

                {/* Body có khoảng cách thoáng tự nhiên */}
                <div className="px-6 py-2.5 space-y-6">
                    {/* 2. Ô input thêm người/phòng ban chuẩn Drive (border viền xám mảnh, không icon thừa) */}
                    <div ref={searchRef} className="relative">
                        <div className="relative flex items-center h-[48px] border border-[#747775] hover:border-[#1F1F1F] dark:border-slate-600 dark:hover:border-slate-400 focus-within:!border-[#0B57D0] focus-within:ring-1 focus-within:ring-[#0B57D0] rounded-[8px] px-4 transition bg-white dark:bg-[#1E1F20]">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                                placeholder="Thêm người, nhóm, không gian và sự kiện trên lịch"
                                className="w-full text-[14px] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#444746] dark:placeholder-slate-400 bg-transparent outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-[#444746] hover:text-[#1F1F1F] cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Gợi ý tìm kiếm */}
                        {isSearchOpen && (searchSuggestions.depts.length > 0 || searchSuggestions.users.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#282A2C] rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-700 py-2 z-30 max-h-60 overflow-y-auto animate-in fade-in duration-100">
                                {searchSuggestions.depts.length > 0 && (
                                    <div className="px-3 py-1">
                                        <div className="text-[11px] font-medium text-[#444746] dark:text-slate-400 uppercase tracking-wider mb-1 px-1">
                                            Phòng ban
                                        </div>
                                        {searchSuggestions.depts.map((dept) => (
                                            <button
                                                key={dept.id}
                                                type="button"
                                                onClick={() => handleAddDepartment(dept)}
                                                className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-[#F0F4F9] dark:hover:bg-slate-700/60 rounded-lg text-left transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#E8DEF8] dark:bg-purple-950/60 text-[#1D192B] dark:text-purple-300 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="truncate text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                        {dept.name}
                                                    </div>
                                                </div>
                                                <span className="text-[12px] text-[#444746] dark:text-slate-400 shrink-0">
                                                    {dept.members ? dept.members.length : 0} người
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchSuggestions.users.length > 0 && (
                                    <div className="px-3 py-1 border-t border-gray-100 dark:border-slate-800">
                                        <div className="text-[11px] font-medium text-[#444746] dark:text-slate-400 uppercase tracking-wider my-1 px-1">
                                            Cá nhân
                                        </div>
                                        {searchSuggestions.users.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleAddUser(user)}
                                                className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-[#F0F4F9] dark:hover:bg-slate-700/60 rounded-lg text-left transition cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#D3E3FD] text-[#041E49] font-medium text-[13px] flex items-center justify-center shrink-0">
                                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 truncate">
                                                        <div className="truncate text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                            {user.name}
                                                        </div>
                                                        <div className="truncate text-[12px] text-[#444746] dark:text-slate-400">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Section: Những người có quyền truy cập */}
                    <div>
                        <h3 className="text-[14px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-3">
                            Những người có quyền truy cập
                        </h3>

                        {isLoading ? (
                            <div className="py-6 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-[#0B57D0] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {/* Chủ sở hữu */}
                                {owner && (
                                    <div className="flex items-center justify-between py-0.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-[#3F51B5] text-white flex items-center justify-center font-medium text-[13px] shrink-0">
                                                {(owner.name || owner.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                        {owner.name}
                                                    </span>
                                                    <span className="text-[13px] text-[#444746] dark:text-slate-400 font-normal">
                                                        (you)
                                                    </span>
                                                </div>
                                                <div className="text-[12px] text-[#444746] dark:text-slate-400 truncate">
                                                    {owner.email}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[13.5px] text-[#444746] dark:text-slate-400 shrink-0 font-normal">
                                            Chủ sở hữu
                                        </span>
                                    </div>
                                )}

                                {/* Danh sách Phòng ban */}
                                {directDepts.map((dept) => {
                                    const fullDept = departments.find((d) => String(d.id) === String(dept.id));
                                    // Loại trừ Chủ sở hữu (Owner) khỏi danh sách thành viên phòng ban vì chủ sở hữu luôn có toàn quyền
                                    const deptMembers = (fullDept?.members || []).filter(
                                        (m) => !owner || String(m.userId) !== String(owner.id)
                                    );
                                    const isExpanded = !!expandedDeptIds[String(dept.id)];
                                    const dropdownKey = `dept-${dept.id}`;
                                    const isDeptDropdownActive = openDropdownId === dropdownKey;

                                    return (
                                        <div key={dept.id} className={`space-y-1.5 relative ${isDeptDropdownActive ? 'z-50' : 'z-20'}`}>
                                            <div className="flex items-center justify-between py-0.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#E8DEF8] dark:bg-purple-950/60 text-[#1D192B] dark:text-purple-300 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate font-normal">
                                                            {dept.name}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[12px] text-[#444746] dark:text-slate-400">
                                                                {dept.memberCount} thành viên
                                                            </span>
                                                            {deptMembers.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleDeptExpand(dept.id)}
                                                                    className="text-[12px] text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                                                                >
                                                                    {isExpanded ? (
                                                                        <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                                                                    ) : (
                                                                        <>Xem thành viên <ChevronDown className="w-3 h-3" /></>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Custom Material Dropdown cho Phòng ban */}
                                                <div className="flex items-center gap-1 shrink-0 relative" data-dropdown-container>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenDropdownId(openDropdownId === dropdownKey ? null : dropdownKey)}
                                                        className="h-[32px] px-2 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 text-[13.5px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer"
                                                    >
                                                        <span>{dept.level === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}</span>
                                                        <ChevronDown className="w-4 h-4 text-[#444746]" />
                                                    </button>

                                                    {openDropdownId === dropdownKey && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-slate-700 py-1.5 z-[60] w-52 animate-in fade-in duration-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeptLevelChange(dept.id, 'VIEWER')}
                                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13.5px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                            >
                                                                <span>Người xem</span>
                                                                {dept.level === 'VIEWER' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeptLevelChange(dept.id, 'EDITOR')}
                                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13.5px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                            >
                                                                <span>Người chỉnh sửa</span>
                                                                {dept.level === 'EDITOR' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                            </button>
                                                            <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleRemoveDepartment(dept.id);
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-left text-[13.5px] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 cursor-pointer"
                                                            >
                                                                Xóa quyền
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Thành viên trong phòng ban */}
                                            {isExpanded && deptMembers.length > 0 && (
                                                <div className="ml-5 pl-4 border-l-2 border-[#E0E2EC] dark:border-slate-800 space-y-2 py-1.5 my-1 max-h-52 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                    {deptMembers.map((member) => {
                                                        const currentOverride = memberOverrides[String(member.userId)] || 'INHERIT';
                                                        const memberDropdownKey = `member-${member.userId}`;

                                                        // Nếu không override thì hiển thị đúng quyền của phòng ban ("Người xem" hoặc "Người chỉnh sửa")
                                                        let roleLabel = dept.level === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem';
                                                        if (currentOverride === 'EDITOR') roleLabel = 'Người chỉnh sửa';
                                                        if (currentOverride === 'VIEWER') roleLabel = 'Người xem';
                                                        if (currentOverride === 'DENY') roleLabel = 'Chặn truy cập';

                                                        return (
                                                            <div
                                                                key={member.userId}
                                                                className="flex items-center justify-between py-1 text-[12.5px]"
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-[10.5px] font-medium flex items-center justify-center shrink-0">
                                                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="min-w-0 truncate">
                                                                        <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                                            {member.name}
                                                                        </div>
                                                                        <div className="text-[11px] text-[#444746] dark:text-slate-400 truncate">
                                                                            {member.email}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Custom Dropdown cho từng thành viên: Hiển thị trực tiếp Người xem / Người chỉnh sửa */}
                                                                <div className="relative shrink-0 ml-2" data-dropdown-container>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenDropdownId(openDropdownId === memberDropdownKey ? null : memberDropdownKey)}
                                                                        className="h-[32px] px-2 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 text-[13px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer"
                                                                    >
                                                                        <span>{roleLabel}</span>
                                                                        <ChevronDown className="w-3.5 h-3.5 text-[#444746]" />
                                                                    </button>

                                                                    {openDropdownId === memberDropdownKey && (
                                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-slate-700 py-1.5 z-[60] w-52 animate-in fade-in duration-100">
                                                                            {dept.level === 'VIEWER' ? (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMemberOverride(member.userId, 'INHERIT')}
                                                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 cursor-pointer"
                                                                                    >
                                                                                        <span>Người xem</span>
                                                                                        {(currentOverride === 'INHERIT' || currentOverride === 'VIEWER') && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMemberOverride(member.userId, 'EDITOR')}
                                                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 cursor-pointer"
                                                                                    >
                                                                                        <span>Người chỉnh sửa</span>
                                                                                        {currentOverride === 'EDITOR' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMemberOverride(member.userId, 'INHERIT')}
                                                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 cursor-pointer"
                                                                                    >
                                                                                        <span>Người chỉnh sửa</span>
                                                                                        {(currentOverride === 'INHERIT' || currentOverride === 'EDITOR') && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleMemberOverride(member.userId, 'VIEWER')}
                                                                                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 cursor-pointer"
                                                                                    >
                                                                                        <span>Người xem</span>
                                                                                        {currentOverride === 'VIEWER' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                                                    </button>
                                                                                </>
                                                                            )}

                                                                            <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleMemberOverride(member.userId, 'DENY')}
                                                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-red-50 text-red-600 cursor-pointer"
                                                                            >
                                                                                <span>Chặn truy cập</span>
                                                                                {currentOverride === 'DENY' && <Check className="w-4 h-4 text-red-600" />}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Danh sách Cá nhân trực tiếp */}
                                {directUsers
                                    .filter((u) => !directDepts.some((d) => {
                                        const fd = departments.find((x) => String(x.id) === String(d.id));
                                        return fd?.members?.some((m) => String(m.userId) === String(u.id));
                                    }))
                                    .map((user) => {
                                        const userDropdownKey = `user-${user.id}`;
                                        let userRoleText = 'Người xem';
                                        if (user.level === 'EDITOR') userRoleText = 'Người chỉnh sửa';
                                        if (user.level === 'DENY') userRoleText = 'Chặn truy cập';

                                        return (
                                            <div key={user.id} className="flex items-center justify-between py-0.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#D3E3FD] text-[#041E49] flex items-center justify-center font-medium text-[13px] shrink-0">
                                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3] truncate font-normal">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-[12px] text-[#444746] dark:text-slate-400 truncate">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 relative" data-dropdown-container>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenDropdownId(openDropdownId === userDropdownKey ? null : userDropdownKey)}
                                                        className="h-[32px] px-3 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer"
                                                    >
                                                        <span>{userRoleText}</span>
                                                        <ChevronDown className="w-4 h-4 text-[#444746]" />
                                                    </button>

                                                    {openDropdownId === userDropdownKey && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-slate-700 py-1.5 z-50 w-44 animate-in fade-in duration-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUserLevelChange(user.id, 'VIEWER')}
                                                                className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                            >
                                                                <span>Người xem</span>
                                                                {user.level === 'VIEWER' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUserLevelChange(user.id, 'EDITOR')}
                                                                className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                            >
                                                                <span>Người chỉnh sửa</span>
                                                                {user.level === 'EDITOR' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                            </button>
                                                            <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleRemoveUser(user.id);
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="w-full px-3.5 py-2 text-left text-[13px] hover:bg-red-50 text-red-600 cursor-pointer"
                                                            >
                                                                Xóa quyền
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* 4. Section: Quyền truy cập chung (General access) Chuẩn Google Drive */}
                    <div className="pt-1 relative z-10">
                        <h3 className="text-[14px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-3">
                            Quyền truy cập chung
                        </h3>

                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Icon tròn nằm ở GIỮA theo chiều dọc so với 2 dòng chữ bên cạnh */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    scope === 'Toàn công ty' 
                                        ? 'bg-[#CBF0D8] text-[#146C2E] dark:bg-emerald-950 dark:text-emerald-300' 
                                        : 'bg-[#E0E2EC] text-[#444746] dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                    {scope === 'Toàn công ty' ? (
                                        <Globe className="w-4 h-4" />
                                    ) : (
                                        <Lock className="w-4 h-4" />
                                    )}
                                </div>

                                {/* Hai dòng chữ thẳng hàng tuyệt đối với nhau theo chiều dọc */}
                                <div className="flex flex-col min-w-0">
                                    {/* Dòng 1: Dropdown phạm vi (Bị hạn chế / Toàn công ty) */}
                                    <div className="relative inline-block" data-dropdown-container>
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdownId(openDropdownId === 'scope-dropdown' ? null : 'scope-dropdown')}
                                            className="h-[28px] -ml-2 px-2 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 text-[13.5px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer"
                                        >
                                            <span>
                                                {scope === 'Toàn công ty' ? 'Toàn công ty' : (scope === 'Riêng tư' ? 'Riêng tư' : 'Bị hạn chế')}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-[#444746]" />
                                        </button>

                                        {openDropdownId === 'scope-dropdown' && (
                                            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-slate-700 py-1.5 z-50 w-56 animate-in fade-in duration-100">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setScope('Hạn chế');
                                                        setOpenDropdownId(null);
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13.5px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                >
                                                    <span>Bị hạn chế</span>
                                                    {scope === 'Hạn chế' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setScope('Toàn công ty');
                                                        setOpenDropdownId(null);
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[13.5px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                                >
                                                    <span>Toàn công ty</span>
                                                    {scope === 'Toàn công ty' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dòng 2: Chú thích (thẳng hàng chuẩn với chữ dòng 1) */}
                                    <div className="text-[12px] text-[#444746] dark:text-slate-400 leading-snug">
                                        {scope === 'Toàn công ty' && 'Bất kỳ ai trong công ty có đường liên kết này đều có thể truy cập'}
                                        {scope === 'Hạn chế' && 'Chỉ những người có quyền truy cập mới có thể mở bằng đường liên kết này'}
                                        {scope === 'Riêng tư' && 'Chỉ duy nhất người tạo và quản trị viên mới có quyền'}
                                    </div>
                                </div>
                            </div>

                            {/* Vai trò bên phải: Dropdown chuẩn Google Drive */}
                            <div className="relative shrink-0 ml-2" data-dropdown-container>
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdownId(openDropdownId === 'general-role-dropdown' ? null : 'general-role-dropdown')}
                                    className="h-[32px] px-2 rounded-[4px] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 text-[13.5px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 transition cursor-pointer"
                                >
                                    <span>{generalRole === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}</span>
                                    <ChevronDown className="w-4 h-4 text-[#444746]" />
                                </button>

                                {openDropdownId === 'general-role-dropdown' && (
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-slate-700 py-2 z-50 w-64 animate-in fade-in duration-100">
                                        <div className="px-4 pt-1 pb-1.5 text-[11px] font-semibold text-[#444746] dark:text-slate-400 tracking-wider uppercase">
                                            VAI TRÒ
                                        </div>

                                        {/* Tùy chọn 1: Người xem */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGeneralRole('VIEWER');
                                                setOpenDropdownId(null);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-[13.5px] hover:bg-[#F0F4F9] dark:hover:bg-slate-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer"
                                        >
                                            <span className="w-4 flex items-center justify-center shrink-0">
                                                {generalRole === 'VIEWER' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                            </span>
                                            <span>Người xem</span>
                                        </button>

                                        {/* Tùy chọn 2: Người chỉnh sửa (đã bỏ Người nhận xét) */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGeneralRole('EDITOR');
                                                setOpenDropdownId(null);
                                            }}
                                            className="w-full flex items-start gap-3 px-4 py-2 text-left hover:bg-[#F0F4F9] dark:hover:bg-slate-700 cursor-pointer"
                                        >
                                            <span className="w-4 flex items-center justify-center shrink-0 mt-0.5">
                                                {generalRole === 'EDITOR' && <Check className="w-4 h-4 text-[#0B57D0]" />}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-[13.5px] text-[#1F1F1F] dark:text-[#E3E3E3]">Người chỉnh sửa</span>
                                                <span className="text-[12px] text-[#444746] dark:text-slate-400">Sắp xếp, thêm và chỉnh sửa tệp</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Footer Google Drive Chuẩn (Chỉ 2 nút: Sao chép liên kết bên trái, Xong bên phải) */}
                <div className="px-6 pt-3 pb-5 flex items-center justify-between border-t border-transparent">
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#0B57D0]/10 dark:hover:bg-blue-950/40 border border-[#747775] dark:border-slate-600 rounded-full px-5 py-2 text-[14px] font-medium transition cursor-pointer shrink-0"
                    >
                        <Link2 className="w-4 h-4 rotate-[-45deg]" />
                        <span>Sao chép đường liên kết</span>
                    </button>

                    <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="px-6 py-2 text-[14px] font-medium bg-[#0B57D0] hover:bg-[#0842A0] text-white rounded-full shadow-none hover:shadow transition disabled:opacity-50 cursor-pointer shrink-0"
                    >
                        {isSaving ? 'Đang lưu...' : 'Xong'}
                    </button>
                </div>
            </div>
        </div>
    );
}
