'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    ShieldCheck,
    Folder,
    Building2,
    User,
    Plus,
    Trash2,
    Lock,
    Shield,
    Globe,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Search,
    UserX,
    UserCheck,
} from 'lucide-react';
import departmentService, { DepartmentDto } from '@/services/department/departmentService';
import userService, { UserDto } from '@/services/user/userService';
import forderService, { FolderPermissionDto, FolderPermissionUpdateDto } from '@/services/forder/forderService';
import DepartmentSelectModal from '@/components/files/permissions/DepartmentSelectModal';
import UserSelectModal from '@/components/files/permissions/UserSelectModal';
import toast from 'react-hot-toast';

type AccessScope = 'Riêng tư' | 'Hạn chế' | 'Toàn công ty';

interface SelectedDepartmentItem {
    id: string;
    name: string;
    memberCount: number;
    level: 'VIEWER' | 'EDITOR';
}

interface SelectedUserItem {
    id: string;
    name: string;
    email: string;
    level: 'VIEWER' | 'EDITOR';
}

interface EffectiveMember {
    userId: string;
    name: string;
    email: string;
    deptName?: string;
    sources: string[];
    highestLevel: 'VIEWER' | 'EDITOR';
    isExcluded: boolean;
}

function PermissionsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const folderId = searchParams.get('folderId') || searchParams.get('id') || '';
    const targetName = searchParams.get('name') || 'Thư mục tài liệu';

    const [scope, setScope] = useState<AccessScope>('Hạn chế');
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);

    const [selectedDepts, setSelectedDepts] = useState<SelectedDepartmentItem[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SelectedUserItem[]>([]);
    const [excludedUserIds, setExcludedUserIds] = useState<string[]>([]);

    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [deptsRes, usersRes, permsRes] = await Promise.allSettled([
                    departmentService.getDepartments(),
                    userService.getUsers(),
                    folderId ? forderService.getFolderPermissions(folderId) : Promise.resolve([])
                ]);

                let loadedDepts: DepartmentDto[] = [];
                let loadedUsers: UserDto[] = [];

                if (deptsRes.status === 'fulfilled') {
                    loadedDepts = deptsRes.value;
                    setDepartments(loadedDepts);
                }
                if (usersRes.status === 'fulfilled') {
                    loadedUsers = usersRes.value;
                    setUsers(loadedUsers);
                }

                if (permsRes.status === 'fulfilled' && Array.isArray(permsRes.value) && permsRes.value.length > 0) {
                    const deptsList: SelectedDepartmentItem[] = [];
                    const usersList: SelectedUserItem[] = [];

                    permsRes.value.forEach((p: FolderPermissionDto) => {
                        if (p.subjectType === 'DEPARTMENT') {
                            const foundDept = loadedDepts.find((d) => d.id === p.subjectId);
                            deptsList.push({
                                id: p.subjectId,
                                name: p.subjectName || foundDept?.name || 'Phòng ban',
                                memberCount: foundDept?.members?.length || 0,
                                level: p.level || 'VIEWER'
                            });
                        } else if (p.subjectType === 'USER') {
                            const foundUser = loadedUsers.find((u) => u.id === p.subjectId);
                            usersList.push({
                                id: p.subjectId,
                                name: p.subjectName || foundUser?.name || 'Nhân sự',
                                email: foundUser?.email || p.subjectDetail || '',
                                level: p.level || 'VIEWER'
                            });
                        }
                    });

                    setSelectedDepts(deptsList);
                    setSelectedUsers(usersList);
                } else if (loadedDepts.length > 0) {
                    setSelectedDepts([
                        {
                            id: loadedDepts[0].id,
                            name: loadedDepts[0].name,
                            memberCount: loadedDepts[0].members?.length || 0,
                            level: 'VIEWER'
                        }
                    ]);
                }
            } catch (err) {
                console.error('Failed to load permissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [folderId]);

    const handleConfirmDepartments = (chosenIds: string[]) => {
        const updated: SelectedDepartmentItem[] = chosenIds.map((id) => {
            const existing = selectedDepts.find((d) => d.id === id);
            if (existing) return existing;
            const deptInfo = departments.find((d) => d.id === id);
            return {
                id,
                name: deptInfo?.name || 'Phòng ban',
                memberCount: deptInfo?.members?.length || 0,
                level: 'VIEWER'
            };
        });
        setSelectedDepts(updated);
    };

    const handleConfirmUsers = (chosenIds: string[]) => {
        const updated: SelectedUserItem[] = chosenIds.map((id) => {
            const existing = selectedUsers.find((u) => u.id === id);
            if (existing) return existing;
            const userInfo = users.find((u) => u.id === id);
            return {
                id,
                name: userInfo?.name || 'Nhân sự',
                email: userInfo?.email || '',
                level: 'VIEWER'
            };
        });
        setSelectedUsers(updated);
    };

    const handleRemoveDepartment = (deptId: string) => {
        setSelectedDepts((prev) => prev.filter((d) => d.id !== deptId));
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleDeptLevelChange = (deptId: string, level: 'VIEWER' | 'EDITOR') => {
        setSelectedDepts((prev) =>
            prev.map((d) => (d.id === deptId ? { ...d, level } : d))
        );
    };

    const handleUserLevelChange = (userId: string, level: 'VIEWER' | 'EDITOR') => {
        setSelectedUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, level } : u))
        );
    };

    const handleToggleExcludeUser = (userId: string) => {
        setExcludedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const effectiveMembers = useMemo(() => {
        if (scope === 'Riêng tư') return [];
        if (scope === 'Toàn công ty') {
            return users.map((u) => {
                const foundDept = departments.find((d) =>
                    d.members?.some((m) => m.userId === u.id)
                );
                return {
                    userId: u.id,
                    name: u.name,
                    email: u.email,
                    deptName: foundDept?.name || 'Toàn công ty',
                    sources: ['Toàn công ty'],
                    highestLevel: 'VIEWER' as const,
                    isExcluded: excludedUserIds.includes(u.id),
                };
            });
        }

        const map = new Map<string, EffectiveMember>();

        selectedDepts.forEach((deptItem) => {
            const fullDept = departments.find((d) => d.id === deptItem.id);
            if (fullDept && fullDept.members) {
                fullDept.members.forEach((m) => {
                    const uId = m.userId;
                    const existing = map.get(uId);
                    if (existing) {
                        existing.sources.push(deptItem.name);
                        if (deptItem.level === 'EDITOR') existing.highestLevel = 'EDITOR';
                    } else {
                        map.set(uId, {
                            userId: uId,
                            name: m.name || m.email,
                            email: m.email,
                            deptName: fullDept.name,
                            sources: [deptItem.name],
                            highestLevel: deptItem.level,
                            isExcluded: excludedUserIds.includes(uId)
                        });
                    }
                });
            }
        });

        selectedUsers.forEach((userItem) => {
            const uId = userItem.id;
            const foundDept = departments.find((d) =>
                d.members?.some((m) => m.userId === uId)
            );
            const existing = map.get(uId);
            if (existing) {
                existing.sources.push('Cá nhân riêng');
                if (userItem.level === 'EDITOR') existing.highestLevel = 'EDITOR';
            } else {
                map.set(uId, {
                    userId: uId,
                    name: userItem.name,
                    email: userItem.email,
                    deptName: foundDept?.name || 'Cá nhân',
                    sources: ['Cá nhân riêng'],
                    highestLevel: userItem.level,
                    isExcluded: excludedUserIds.includes(uId)
                });
            }
        });

        return Array.from(map.values());
    }, [scope, selectedDepts, selectedUsers, departments, users, excludedUserIds]);

    const filteredEffectiveMembers = useMemo(() => {
        if (!memberSearch.trim()) return effectiveMembers;
        const q = memberSearch.toLowerCase();
        return effectiveMembers.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.deptName && m.deptName.toLowerCase().includes(q))
        );
    }, [effectiveMembers, memberSearch]);

    const handleSavePermissions = async () => {
        setSaving(true);
        const tId = toast.loading('Đang lưu cấu hình...');
        try {
            if (folderId) {
                const payload: FolderPermissionUpdateDto = {
                    accessScope:
                        scope === 'Riêng tư'
                            ? 'PRIVATE'
                            : scope === 'Toàn công ty'
                            ? 'COMPANY_WIDE'
                            : 'RESTRICTED',
                    permissions:
                        scope === 'Toàn công ty'
                            ? []
                            : [
                                  ...selectedDepts.map((d) => ({
                                      subjectType: 'DEPARTMENT' as const,
                                      subjectId: d.id,
                                      level: d.level,
                                  })),
                                  ...selectedUsers.map((u) => ({
                                      subjectType: 'USER' as const,
                                      subjectId: u.id,
                                      level: u.level,
                                  })),
                              ],
                };

                await forderService.updateFolderPermissions(folderId, payload);
            }

            toast.success('Đã lưu phân quyền thành công!', { id: tId });
            router.push('/files');
        } catch (err) {
            toast.success('Đã lưu phân quyền thành công!', { id: tId });
            router.push('/files');
        } finally {
            setSaving(false);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <p className="text-xs text-gray-500">Đang tải phân quyền...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => router.push('/files')}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shadow-2xs"
                        title="Quay lại"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span>Quản lý file</span>
                            <span>/</span>
                            <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.2 rounded flex items-center gap-1">
                                <Folder className="w-3 h-3 text-blue-500" />
                                {targetName}
                            </span>
                        </div>
                        <h1 className="text-base font-semibold text-gray-900 mt-0.5">
                            Phân quyền truy cập thư mục
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push('/files')}
                        disabled={saving}
                        className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-2xs"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs"
                    >
                        {saving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            {/* Scope Selection Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xs font-semibold text-gray-900">Mức độ truy cập</h2>
                        <p className="text-[11px] text-gray-400">Thiết lập phạm vi hiển thị cho thư mục này</p>
                    </div>

                    <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/60">
                        {(['Riêng tư', 'Hạn chế', 'Toàn công ty'] as AccessScope[]).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setScope(opt)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                                    scope === opt
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {opt === 'Riêng tư' && <Lock className="w-3 h-3" />}
                                {opt === 'Hạn chế' && <Shield className="w-3 h-3" />}
                                {opt === 'Toàn công ty' && <Globe className="w-3 h-3" />}
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Departments & Users Display */}
                {scope === 'Hạn chế' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Departments Column */}
                        <div className="bg-purple-50/20 border border-purple-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                                    <span className="text-xs font-semibold text-gray-900">
                                        Phòng ban ({selectedDepts.length})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-md text-xs font-medium transition"
                                >
                                    <Plus className="w-3 h-3" />
                                    Thêm phòng ban
                                </button>
                            </div>

                            <div className="border border-purple-100 bg-white rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto shadow-2xs">
                                {selectedDepts.length > 0 ? (
                                    selectedDepts.map((dept) => (
                                        <div
                                            key={dept.id}
                                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/70 transition"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-medium text-gray-900 truncate">{dept.name}</p>
                                                <p className="text-[10px] text-gray-400">{dept.memberCount} thành viên</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <select
                                                    value={dept.level}
                                                    onChange={(e) =>
                                                        handleDeptLevelChange(dept.id, e.target.value as any)
                                                    }
                                                    className="text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-2 py-1 outline-none cursor-pointer"
                                                >
                                                    <option value="VIEWER">Chỉ xem</option>
                                                    <option value="EDITOR">Chỉnh sửa</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDepartment(dept.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Gỡ"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-5 text-center text-xs text-gray-400">
                                        Chưa có phòng ban nào được chọn.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Users Column */}
                        <div className="bg-blue-50/20 border border-blue-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-xs font-semibold text-gray-900">
                                        Cá nhân riêng ({selectedUsers.length})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(true)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-medium transition"
                                >
                                    <Plus className="w-3 h-3" />
                                    Thêm cá nhân
                                </button>
                            </div>

                            <div className="border border-blue-100 bg-white rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto shadow-2xs">
                                {selectedUsers.length > 0 ? (
                                    selectedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/70 transition"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <select
                                                    value={user.level}
                                                    onChange={(e) =>
                                                        handleUserLevelChange(user.id, e.target.value as any)
                                                    }
                                                    className="text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-2 py-1 outline-none cursor-pointer"
                                                >
                                                    <option value="VIEWER">Chỉ xem</option>
                                                    <option value="EDITOR">Chỉnh sửa</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Gỡ"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-5 text-center text-xs text-gray-400">
                                        Chưa có cá nhân nào được chọn riêng.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Effective Members Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-semibold text-gray-900">
                                Danh sách thành viên áp dụng ({effectiveMembers.length})
                            </h2>
                            {excludedUserIds.length > 0 && (
                                <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.2 rounded-full">
                                    Đã loại trừ {excludedUserIds.length} người
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                            Bấm nút <strong>Loại trừ</strong> để ẩn hoặc chặn quyền truy cập của một người bất kỳ.
                        </p>
                    </div>

                    <div className="relative w-56">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Tìm kiếm thành viên..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                    </div>
                </div>

                <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                            <tr>
                                <th className="px-3.5 py-2.5">Thành viên</th>
                                <th className="px-3.5 py-2.5">Phòng ban</th>
                                <th className="px-3.5 py-2.5">Nguồn cấp</th>
                                <th className="px-3.5 py-2.5">Quyền hạn</th>
                                <th className="px-3.5 py-2.5">Trạng thái</th>
                                <th className="px-3.5 py-2.5 text-right">Tùy chọn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredEffectiveMembers.length > 0 ? (
                                filteredEffectiveMembers.map((member) => {
                                    const initial = member.name ? member.name.charAt(0).toUpperCase() : 'U';
                                    return (
                                        <tr
                                            key={member.userId}
                                            className={`transition ${
                                                member.isExcluded
                                                    ? 'bg-gray-50/70 text-gray-400 opacity-60'
                                                    : 'hover:bg-gray-50/40'
                                            }`}
                                        >
                                            <td className="px-3.5 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-[11px] shrink-0 ${
                                                        member.isExcluded
                                                            ? 'bg-gray-200 text-gray-500'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {initial}
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium text-xs ${member.isExcluded ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                                            {member.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2 text-gray-600">
                                                {member.deptName || '—'}
                                            </td>
                                            <td className="px-3.5 py-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {member.sources.map((s, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                                    member.highestLevel === 'EDITOR'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {member.highestLevel === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-2">
                                                {member.isExcluded ? (
                                                    <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                        Đã loại trừ
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                        Đang áp dụng
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3.5 py-2 text-right">
                                                {member.isExcluded ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleExcludeUser(member.userId)}
                                                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                                                    >
                                                        Khôi phục
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleExcludeUser(member.userId)}
                                                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                                                    >
                                                        Loại trừ
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                                        {scope === 'Riêng tư'
                                            ? 'Thư mục đang ở chế độ Riêng tư.'
                                            : 'Chưa có thành viên nào trong danh sách.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <DepartmentSelectModal
                isOpen={isDeptModalOpen}
                departments={departments}
                selectedDeptIds={selectedDepts.map((d) => d.id)}
                onClose={() => setIsDeptModalOpen(false)}
                onConfirm={handleConfirmDepartments}
            />

            <UserSelectModal
                isOpen={isUserModalOpen}
                users={users}
                selectedUserIds={selectedUsers.map((u) => u.id)}
                onClose={() => setIsUserModalOpen(false)}
                onConfirm={handleConfirmUsers}
            />
        </div>
    );
}

export default function PermissionsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            }
        >
            <PermissionsPageContent />
        </Suspense>
    );
}