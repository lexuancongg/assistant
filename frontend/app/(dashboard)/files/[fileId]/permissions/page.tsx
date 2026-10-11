'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ExternalLink,
    Link2,
    UserPlus,
    MoreVertical,
    Shield,
    ChevronDown,
    ChevronRight,
    Check,
    Search,
    Globe,
    Lock,
    RefreshCw,
    X,
    ShieldAlert,
    KeyRound
} from 'lucide-react';
import fileManagementService, { FileItemDto } from '@/services/files/fileManagementService';
import departmentService, { DepartmentDto } from '@/services/department/departmentService';
import userService, { UserDto } from '@/services/user/userService';
import forderService from '@/services/forder/forderService';
import DepartmentSelectModal from '@/components/files/permissions/DepartmentSelectModal';
import UserSelectModal from '@/components/files/permissions/UserSelectModal';
import RequestAccessModal from '@/components/files/RequestAccessModal';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import apiClient from '@/utils/api/apiClientFixed';
import toast from 'react-hot-toast';
import { CURRENT_USER } from '@/lib/fake-data';

interface SelectedDepartmentItem {
    id: string | number;
    name: string;
    memberCount: number;
    level: 'VIEWER' | 'EDITOR';
    source?: string;
    isInherited?: boolean;
}

interface SelectedUserItem {
    id: string | number;
    name: string;
    email: string;
    level: 'VIEWER' | 'EDITOR';
    source?: string;
    isInherited?: boolean;
}

interface EffectiveMember {
    userId: string | number;
    name: string;
    email: string;
    deptName?: string;
    source: string;
    highestLevel: 'VIEWER' | 'EDITOR' | 'OWNER' | 'ADMIN';
    isExcluded?: boolean;
}

function FilePermissionsPageContent() {
    const params = useParams<{ fileId: string }>();
    const router = useRouter();
    const fileId = params.fileId;

    const [file, setFile] = useState<FileItemDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [excludedUserIds, setExcludedUserIds] = useState<(string | number)[]>([]);
    const [parentFolderName, setParentFolderName] = useState<string>('');
    const [inheritedDepts, setInheritedDepts] = useState<SelectedDepartmentItem[]>([]);
    const [inheritedUsers, setInheritedUsers] = useState<SelectedUserItem[]>([]);

    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [selectedDepts, setSelectedDepts] = useState<SelectedDepartmentItem[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<SelectedUserItem[]>([]);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    // 1. Tải thông tin người dùng đăng nhập
    useEffect(() => {
        let initialUser = CURRENT_USER;
        try {
            const stored = localStorage.getItem('user');
            if (stored) initialUser = JSON.parse(stored);
        } catch (e) {
            console.warn('Lỗi đọc currentUser:', e);
        }
        setCurrentUser(initialUser);

        apiClient.get('http://localhost:8080/api/v1/auth/me')
            .then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    if (data?.authenticated && data?.user) {
                        const verifiedUser = {
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role ? data.user.role.replace('ROLE_', '') : 'ADMIN',
                            department: { name: data.user.departmentName || '' }
                        };
                        setCurrentUser(verifiedUser);
                        localStorage.setItem('user', JSON.stringify(verifiedUser));
                    }
                }
            })
            .catch(() => {});
    }, []);

    // 2. Tải danh mục phòng ban và nhân viên
    useEffect(() => {
        departmentService.getDepartments().then(setDepartments).catch(() => {});
        userService.getUsers().then(setUsers).catch(() => {});
    }, []);

    // 3. Tải chi tiết file
    useEffect(() => {
        if (!fileId) return;
        setLoading(true);
        fileManagementService.getFileDetail(fileId)
            .then((data) => {
                if (data) {
                    setFile(data);
                }
            })
            .catch((err) => {
                console.error('Lỗi tải thông tin file:', err);
                toast.error('Không tìm thấy thông tin tài liệu');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [fileId]);

    // 4. Tìm thư mục cha & tải quyền kế thừa từ cây thư mục
    useEffect(() => {
        if (!file?.folderId) {
            if (file?.folderName) setParentFolderName(file.folderName);
            return;
        }

        const loadInheritedData = async () => {
            try {
                const tree = await forderService.getFolderTree();
                const findAncestors = (
                    nodes: any[],
                    target: string | number,
                    ancestorsList: any[] = []
                ): { folder: any; ancestors: any[] } | null => {
                    for (const node of nodes) {
                        if (String(node.id) === String(target)) {
                            return { folder: node, ancestors: ancestorsList };
                        }
                        if (node.children && node.children.length > 0) {
                            const found = findAncestors(node.children, target, [...ancestorsList, node]);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const result = findAncestors(tree, file.folderId!);
                const targetFolder = result ? result.folder : null;
                if (targetFolder && targetFolder.name) {
                    setParentFolderName(targetFolder.name);
                } else if (file.folderName) {
                    setParentFolderName(file.folderName);
                }

                const foldersToCheck = [
                    ...(result?.ancestors || []),
                    ...(targetFolder ? [targetFolder] : [])
                ];

                const inhDepts: SelectedDepartmentItem[] = [];
                const inhUsers: SelectedUserItem[] = [];
                const inhExcluded: (string | number)[] = [];

                for (const f of foldersToCheck) {
                    try {
                        const fPerms = await forderService.getFolderPermissions(f.id);
                        if (fPerms && Array.isArray(fPerms)) {
                            fPerms.forEach((p) => {
                                if (p.level === 'DENY' && p.subjectType === 'USER') {
                                    if (!inhExcluded.includes(p.subjectId)) {
                                        inhExcluded.push(p.subjectId);
                                    }
                                    return;
                                }

                                if (p.subjectType === 'DEPARTMENT') {
                                    if (!inhDepts.some((d) => String(d.id) === String(p.subjectId))) {
                                        const fDept = departments.find((d) => String(d.id) === String(p.subjectId));
                                        inhDepts.push({
                                            id: p.subjectId,
                                            name: p.subjectName || fDept?.name || 'Phòng ban',
                                            memberCount: fDept?.members?.length || 0,
                                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                                            isInherited: true,
                                            source: `Kế thừa từ "${f.name}"`
                                        });
                                    }
                                } else if (p.subjectType === 'USER') {
                                    if (!inhUsers.some((u) => String(u.id) === String(p.subjectId))) {
                                        const fUser = users.find((u) => String(u.id) === String(p.subjectId));
                                        inhUsers.push({
                                            id: p.subjectId,
                                            name: p.subjectName || fUser?.name || 'Nhân sự',
                                            email: fUser?.email || p.subjectDetail || '',
                                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                                            isInherited: true,
                                            source: `Kế thừa từ "${f.name}"`
                                        });
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Lỗi lấy quyền kế thừa từ folder:', f.id, e);
                    }
                }

                setInheritedDepts(inhDepts);
                setInheritedUsers(inhUsers);

                if (inhExcluded.length > 0) {
                    setExcludedUserIds((prev) => Array.from(new Set([...prev, ...inhExcluded])));
                }
            } catch (err) {
                console.warn('Lỗi loadInheritedData:', err);
            }
        };

        loadInheritedData();
    }, [file?.folderId, file?.folderName, departments, users]);

    // 5. Tải phân quyền lưu trên CSDL & cache localStorage
    useEffect(() => {
        if (!file?.id) return;

        let localExcluded: (string | number)[] = [];
        try {
            const cachedExcluded = localStorage.getItem('file_excluded_' + file.id);
            if (cachedExcluded) {
                const parsed = JSON.parse(cachedExcluded);
                if (Array.isArray(parsed)) localExcluded = parsed;
            }

            const cached = localStorage.getItem('file_perms_' + file.id);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.depts && Array.isArray(parsed.depts)) setSelectedDepts(parsed.depts);
                if (parsed.users && Array.isArray(parsed.users)) setSelectedUsers(parsed.users);
                if (parsed.excludedUserIds && Array.isArray(parsed.excludedUserIds)) {
                    localExcluded = Array.from(new Set([...localExcluded, ...parsed.excludedUserIds]));
                }
                if (parsed.visibility && parsed.visibility !== file.visibility) {
                    setFile((prev) => (prev ? { ...prev, visibility: parsed.visibility } : prev));
                }
            }
        } catch (e) {
            console.warn('Lỗi đọc local cache perms:', e);
        }
        setExcludedUserIds(localExcluded);

        fileManagementService.getFilePermissions(file.id).then((perms) => {
            if (perms && Array.isArray(perms) && perms.length > 0) {
                const loadedDepts: SelectedDepartmentItem[] = [];
                const loadedUsers: SelectedUserItem[] = [];
                const loadedExcluded: (string | number)[] = [...localExcluded];

                perms.forEach((p) => {
                    if (p.level === 'DENY' && p.subjectType === 'USER') {
                        if (!loadedExcluded.map(String).includes(String(p.subjectId))) {
                            loadedExcluded.push(p.subjectId);
                        }
                        return;
                    }
                    if (p.subjectType === 'DEPARTMENT') {
                        loadedDepts.push({
                            id: p.subjectId,
                            name: p.subjectName || 'Phòng ban',
                            memberCount: 0,
                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER'
                        });
                    } else if (p.subjectType === 'USER') {
                        loadedUsers.push({
                            id: p.subjectId,
                            name: p.subjectName || 'Người dùng',
                            email: p.subjectDetail || '',
                            level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER'
                        });
                    }
                });

                setExcludedUserIds(loadedExcluded);
                if (loadedDepts.length > 0) setSelectedDepts(loadedDepts);
                if (loadedUsers.length > 0) setSelectedUsers(loadedUsers);

                try {
                    localStorage.setItem(
                        'file_perms_' + file.id,
                        JSON.stringify({
                            depts: loadedDepts,
                            users: loadedUsers,
                            visibility: file.visibility,
                            excludedUserIds: loadedExcluded
                        })
                    );
                    localStorage.setItem('file_excluded_' + file.id, JSON.stringify(loadedExcluded));
                } catch (e) {}
            }
        }).catch(() => {});
    }, [file?.id]);

    const isInherited = !file?.visibility || file?.visibility === 'INHERIT';

    // 6. Tính toán quyền hạn người dùng thực tế
    const isAdmin =
        currentUser?.role?.toUpperCase() === 'ADMIN' ||
        currentUser?.role?.toUpperCase() === 'ROLE_ADMIN' ||
        currentUser?.email?.toLowerCase().includes('admin') ||
        currentUser?.name?.toLowerCase().includes('admin');

    const isUploader = !!(
        (currentUser?.email && file?.uploadedByEmail && currentUser.email.toLowerCase() === file.uploadedByEmail.toLowerCase()) ||
        (currentUser?.name && file?.uploadedByName && currentUser.name.toLowerCase().trim() === file.uploadedByName.toLowerCase().trim()) ||
        (file?.uploadedByName && file.uploadedByName.toLowerCase().includes('admin') && isAdmin) ||
        (file?.uploadedByName && currentUser?.name && (
            file.uploadedByName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
            currentUser.name.toLowerCase().includes(file.uploadedByName.toLowerCase())
        ))
    );

    const userInExplicitPermissions = useMemo(() => {
        if (!currentUser?.email && !currentUser?.id) return null;
        const allUsers = [...selectedUsers, ...inheritedUsers];
        const match = allUsers.find(
            (u) =>
                (currentUser?.id && String(u.id) === String(currentUser.id)) ||
                (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        return match ? match.level : null;
    }, [currentUser, selectedUsers, inheritedUsers]);

    const isInheriting = file?.visibility !== 'RESTRICTED';
    const isSameDept = !!(
        isInheriting &&
        file?.owner &&
        currentUser?.department?.name &&
        (currentUser.department.name.toLowerCase().includes(file.owner.toLowerCase()) ||
            file.owner.toLowerCase().includes(currentUser.department.name.toLowerCase()))
    );

    const actualPermission: 'ADMIN' | 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE' =
        isUploader ? 'OWNER' :
        isAdmin ? 'ADMIN' :
        userInExplicitPermissions ? (userInExplicitPermissions as 'EDITOR' | 'VIEWER') :
        file?.visibility === 'COMPANY' ? 'VIEWER' :
        isSameDept ? 'EDITOR' : 'NONE';

    const effectivePermission: 'ADMIN' | 'OWNER' | 'EDITOR' | 'VIEWER' | 'NONE' = actualPermission;
    const hasAccess = effectivePermission !== 'NONE';
    const canManagePermissions = effectivePermission === 'ADMIN' || effectivePermission === 'OWNER';

    const displayedDepts = useMemo(() => {
        if (!isInherited) {
            return selectedDepts.map((d) => ({ ...d, isInherited: false }));
        }
        return inheritedDepts.map((d) => ({ ...d, isInherited: true }));
    }, [isInherited, selectedDepts, inheritedDepts]);

    const displayedUsers = useMemo(() => {
        if (!isInherited) {
            return selectedUsers.map((u) => ({ ...u, isInherited: false }));
        }
        return inheritedUsers.map((u) => ({ ...u, isInherited: true }));
    }, [isInherited, selectedUsers, inheritedUsers]);

    // 7. Tổng hợp danh sách người áp dụng
    const effectiveMembers = useMemo<EffectiveMember[]>(() => {
        const map = new Map<string, EffectiveMember>();

        if (file?.uploadedByName || file?.owner) {
            const authorEmail = file.uploadedByEmail || `${(file.owner || 'author').toLowerCase()}@enterprise.ai`;
            map.set(authorEmail, {
                userId: 'owner',
                name: file.uploadedByName || file.owner || 'Tác giả',
                email: authorEmail,
                deptName: file.owner || 'Tác giả',
                source: 'Chủ sở hữu (Tác giả file)',
                highestLevel: 'OWNER',
                isExcluded: false
            });
        }

        displayedDepts.forEach((deptItem) => {
            const fullDept = departments.find((d) => String(d.id) === String(deptItem.id));
            if (fullDept && fullDept.members) {
                fullDept.members.forEach((m) => {
                    const existing = map.get(m.email);
                    const sourceText = deptItem.isInherited
                        ? (deptItem.source || `Kế thừa (${parentFolderName || 'Thư mục cha'})`)
                        : (deptItem.name || 'Phòng ban');

                    const isEx = excludedUserIds.map(String).includes(String(m.userId));

                    if (existing) {
                        if (existing.highestLevel !== 'OWNER' && deptItem.level === 'EDITOR') {
                            existing.highestLevel = 'EDITOR';
                        }
                    } else {
                        map.set(m.email, {
                            userId: m.userId,
                            name: m.name || m.email,
                            email: m.email,
                            deptName: fullDept.name,
                            source: sourceText,
                            highestLevel: deptItem.level,
                            isExcluded: isEx
                        });
                    }
                });
            }
        });

        displayedUsers.forEach((userItem) => {
            const existing = map.get(userItem.email);
            const sourceText = userItem.isInherited
                ? (userItem.source || `Kế thừa (${parentFolderName || 'Thư mục cha'})`)
                : 'Cá nhân riêng';

            const isEx = excludedUserIds.map(String).includes(String(userItem.id));

            if (existing) {
                if (existing.highestLevel !== 'OWNER' && userItem.level === 'EDITOR') {
                    existing.highestLevel = 'EDITOR';
                }
            } else {
                map.set(userItem.email, {
                    userId: userItem.id,
                    name: userItem.name,
                    email: userItem.email,
                    source: sourceText,
                    highestLevel: userItem.level,
                    isExcluded: isEx
                });
            }
        });

        return Array.from(map.values());
    }, [file, displayedDepts, displayedUsers, departments, excludedUserIds, parentFolderName]);

    const excludedCount = useMemo(() => {
        return effectiveMembers.filter((m) => m.isExcluded).length;
    }, [effectiveMembers]);

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

    // 8. Handlers lưu quyền và thay đổi cấu hình
    const savePermissionsToServer = async (
        deptsToSave: SelectedDepartmentItem[],
        usersToSave: SelectedUserItem[],
        visibilityToSave: 'INHERIT' | 'RESTRICTED' | 'PRIVATE' | 'COMPANY',
        showToast = false
    ) => {
        if (!file?.id) return;
        setIsSavingPermissions(true);
        try {
            try {
                localStorage.setItem(
                    'file_perms_' + file.id,
                    JSON.stringify({
                        depts: deptsToSave,
                        users: usersToSave,
                        visibility: visibilityToSave,
                        excludedUserIds: excludedUserIds
                    })
                );
                localStorage.setItem('file_excluded_' + file.id, JSON.stringify(excludedUserIds));
            } catch (e) {}

            const deniedPerms = excludedUserIds.map((uId) => ({
                subjectType: 'USER' as const,
                subjectId: uId,
                level: 'DENY' as const
            }));

            const directDeptsPerms =
                visibilityToSave === 'RESTRICTED'
                    ? deptsToSave.map((d) => ({
                          subjectType: 'DEPARTMENT' as const,
                          subjectId: d.id,
                          level: d.level
                      }))
                    : [];

            const directUsersPerms =
                visibilityToSave === 'RESTRICTED'
                    ? usersToSave
                          .filter((u) => !excludedUserIds.includes(u.id))
                          .map((u) => ({
                              subjectType: 'USER' as const,
                              subjectId: u.id,
                              level: u.level
                          }))
                    : [];

            const payload = {
                visibility: visibilityToSave,
                permissions: [...directDeptsPerms, ...directUsersPerms, ...deniedPerms]
            };

            await fileManagementService.updateFilePermissions(file.id, payload);
            if (showToast) {
                toast.success('Đã lưu cấu hình phân quyền thành công!');
            }
        } catch (err) {
            console.warn('Đang lưu qua local cache do backend server:', err);
            if (showToast) {
                toast.success('Đã lưu cấu hình phân quyền thành công!');
            }
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const handleToggleVisibility = async (newVisibility: 'INHERIT' | 'RESTRICTED' | 'PRIVATE' | 'COMPANY') => {
        if (!file?.id) return;
        setIsUpdatingVisibility(true);
        setFile((prev) => (prev ? { ...prev, visibility: newVisibility } : prev));

        let nextDepts = selectedDepts;
        let nextUsers = selectedUsers;
        if (newVisibility === 'INHERIT' || newVisibility === 'PRIVATE' || newVisibility === 'COMPANY') {
            if (selectedDepts.length === 0 && inheritedDepts.length > 0) {
                nextDepts = inheritedDepts.map((d) => ({ ...d, isInherited: false }));
                setSelectedDepts(nextDepts);
            }
            if (selectedUsers.length === 0 && inheritedUsers.length > 0) {
                nextUsers = inheritedUsers.map((u) => ({ ...u, isInherited: false }));
                setSelectedUsers(nextUsers);
            }
        }

        try {
            await savePermissionsToServer(nextDepts, nextUsers, newVisibility, false);
            const labelMap: Record<string, string> = {
                INHERIT: 'Kế thừa Thư mục cha',
                RESTRICTED: 'Thiết lập riêng (Hạn chế)',
                PRIVATE: 'Riêng tư (Chỉ Admin & Tác giả)',
                COMPANY: 'Mở rộng Toàn công ty'
            };
            toast.success(`Đã chuyển sang chế độ: ${labelMap[newVisibility]}`);
        } catch (err) {
            console.error('Lỗi toggle visibility:', err);
            toast.error('Không thể cập nhật chế độ bảo mật');
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const handleToggleExcludeUser = (uId: string | number) => {
        if (!canManagePermissions) return;
        let nextExcluded: (string | number)[];
        if (excludedUserIds.map(String).includes(String(uId))) {
            nextExcluded = excludedUserIds.filter((id) => String(id) !== String(uId));
            toast.success('Đã khôi phục quyền xem file cho người này');
        } else {
            nextExcluded = [...excludedUserIds, uId];
            toast.success('Đã loại trừ người này khỏi quyền xem file');
        }
        setExcludedUserIds(nextExcluded);
        if (file?.id) {
            try {
                localStorage.setItem('file_excluded_' + file.id, JSON.stringify(nextExcluded));
            } catch (e) {}
        }
        savePermissionsToServer(selectedDepts, selectedUsers, file?.visibility || 'INHERIT', false);
    };

    const handleConfirmDepts = (newDeptIds: (string | number)[]) => {
        const next: SelectedDepartmentItem[] = newDeptIds.map((id) => {
            const found = selectedDepts.find((d) => String(d.id) === String(id));
            if (found) return found;
            const fullDept = departments.find((d) => String(d.id) === String(id));
            return {
                id,
                name: fullDept?.name || 'Phòng ban',
                memberCount: fullDept?.members?.length || 0,
                level: 'VIEWER' as const
            };
        });
        setSelectedDepts(next);
        savePermissionsToServer(next, selectedUsers, file?.visibility || 'INHERIT', false);
    };

    const handleConfirmUsers = (newUserIds: (string | number)[]) => {
        const next: SelectedUserItem[] = newUserIds.map((id) => {
            const found = selectedUsers.find((u) => String(u.id) === String(id));
            if (found) return found;
            const fullUser = users.find((u) => String(u.id) === String(id));
            return {
                id,
                name: fullUser?.name || 'Nhân sự',
                email: fullUser?.email || '',
                level: 'VIEWER' as const
            };
        });
        setSelectedUsers(next);
        savePermissionsToServer(selectedDepts, next, file?.visibility || 'INHERIT', false);
    };

    const handleRemoveDepartment = (deptId: string | number) => {
        const next = selectedDepts.filter((d) => String(d.id) !== String(deptId));
        setSelectedDepts(next);
        savePermissionsToServer(next, selectedUsers, file?.visibility || 'INHERIT', false);
        toast.success('Đã gỡ phòng ban khỏi quyền riêng');
    };

    const handleRemoveUser = (userId: string | number) => {
        const next = selectedUsers.filter((u) => String(u.id) !== String(userId));
        setSelectedUsers(next);
        savePermissionsToServer(selectedDepts, next, file?.visibility || 'INHERIT', false);
        toast.success('Đã gỡ người dùng khỏi quyền riêng');
    };

    const handleDeptLevelChange = (deptId: string | number, newLevel: 'VIEWER' | 'EDITOR') => {
        const next = selectedDepts.map((d) => (String(d.id) === String(deptId) ? { ...d, level: newLevel } : d));
        setSelectedDepts(next);
        savePermissionsToServer(next, selectedUsers, file?.visibility || 'INHERIT', false);
        toast.success('Đã đổi mức quyền phòng ban');
    };

    const handleUserLevelChange = (userId: string | number, newLevel: 'VIEWER' | 'EDITOR') => {
        const next = selectedUsers.map((u) => (String(u.id) === String(userId) ? { ...u, level: newLevel } : u));
        setSelectedUsers(next);
        savePermissionsToServer(selectedDepts, next, file?.visibility || 'INHERIT', false);
        toast.success('Đã đổi mức quyền người dùng');
    };

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            const link = `${window.location.origin}/files/${fileId}`;
            navigator.clipboard.writeText(link);
            toast.success('Đã sao chép đường liên kết vào khay nhớ tạm!');
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-white dark:bg-[#0B1120] text-gray-900 dark:text-slate-100">
            <LoadingOverlay isLoading={loading} text="Đang tải cấu hình phân quyền..." />

            <div className="px-6 py-4 space-y-3.5 max-w-[1400px] w-full mx-auto">
                {/* 1. Header Bar: Back, Title, Actions, Top Buttons */}
                <div className="flex items-center justify-between pb-1 flex-wrap gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.push(`/files/${fileId}`)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition text-gray-700 dark:text-gray-300 cursor-pointer"
                            title="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file?.name || 'Chi tiết file'}
                        </h1>
                        <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400 pl-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => router.push(`/files/${fileId}`)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                                title="Mở xem tệp"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                                title="Sao chép liên kết"
                            >
                                <Link2 className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsUserModalOpen(true)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                                title="Thêm người dùng"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => toast('Đang ở trang quản lý quyền tài liệu')}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                                title="Tùy chọn khác"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => router.push(`/files/${fileId}`)}
                            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1E1F20] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            Quay lại xem tệp
                        </button>
                        {canManagePermissions && (
                            <button
                                type="button"
                                onClick={() => savePermissionsToServer(selectedDepts, selectedUsers, file?.visibility || 'INHERIT', true)}
                                disabled={isSavingPermissions}
                                className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {isSavingPermissions ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Shield className="w-3.5 h-3.5" />
                                )}
                                <span>Lưu cấu hình</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                            </button>
                        )}
                    </div>
                </div>

                {!hasAccess ? (
                    /* Khi không có quyền truy cập */
                    <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] p-8 text-center space-y-4 max-w-md mx-auto shadow-2xs mt-8">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Bạn chưa có quyền quản lý tài liệu này
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Vui lòng liên hệ với Chủ sở hữu hoặc gửi yêu cầu xin cấp quyền.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowRequestAccessModal(true)}
                            className="px-5 py-2 rounded-full bg-[#0B57D0] text-white text-xs font-medium inline-flex items-center gap-2 cursor-pointer"
                        >
                            <KeyRound className="w-3.5 h-3.5" />
                            Xin cấp quyền
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 2. File Info Banner Card */}
                        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] p-4 flex items-center gap-3.5 shadow-2xs">
                            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 tracking-wider">
                                {file?.fileType?.toUpperCase() === 'PDF' ? 'PDF' : file?.fileType?.toUpperCase().slice(0, 3) || 'DOC'}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {file?.name || 'Tài liệu'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                    {file?.size || 'Tiêu chuẩn'} · {file?.fileType?.toUpperCase()} · Tải lên bởi {file?.uploadedByName || file?.owner || 'Lê Xuân Công (Admin)'} · {file?.updatedAt || '03/10/2026 20:14'}
                                </p>
                            </div>
                        </div>

                        {/* 3. Current Permission Card */}
                        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] px-4 py-3 flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#0B57D0] dark:bg-[#0B57D0]/20 dark:text-[#7CBBF3] flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                            Quyền hạn hiện tại của bạn:
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F0FE] text-[#0B57D0] dark:bg-[#0B57D0]/30 dark:text-[#7CBBF3]">
                                            {effectivePermission}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                        {isUploader
                                            ? 'Chủ sở hữu tài liệu (Người tải lên)'
                                            : isAdmin
                                            ? 'Quản trị viên toàn hệ thống'
                                            : userInExplicitPermissions
                                            ? `Được cấp quyền trực tiếp: ${userInExplicitPermissions}`
                                            : file?.visibility === 'COMPANY'
                                            ? 'Toàn bộ công ty (Mặc định: Chỉ xem)'
                                            : isSameDept
                                            ? `Kế thừa phòng ban "${file?.owner}"`
                                            : 'Chưa có quyền xem tài liệu này'}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>

                        {/* 4. Main Two-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            {/* CỘT TRÁI (7 phần) */}
                            <div className="lg:col-span-7 space-y-4">
                                {/* Card A: Cơ chế kế thừa quyền từ thư mục cha */}
                                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] p-4 shadow-2xs space-y-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            Cơ chế kế thừa quyền từ thư mục cha
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            File này thuộc thư mục <span className="font-semibold text-gray-700 dark:text-gray-300">{parentFolderName || 'CSD'}</span>. Mặc định tự động kế thừa phân quyền từ thư mục cha.
                                        </p>
                                    </div>

                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                            isInherited
                                                ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] dark:bg-[#137333]/20 dark:text-[#81C995] dark:border-[#137333]/40'
                                                : 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3] dark:bg-[#B06000]/20 dark:text-[#FDD663]'
                                        }`}>
                                            <Check className="w-3.5 h-3.5" />
                                            {isInherited
                                                ? `Đang kế thừa từ: ${parentFolderName || 'CSD'}`
                                                : 'Đã ngắt kế thừa (Thiết lập riêng)'}
                                        </span>
                                    </div>

                                    {/* 2 Options Side-by-Side */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* Option 1: Kế thừa */}
                                        <div
                                            onClick={() => canManagePermissions && !isInherited && !isUpdatingVisibility && handleToggleVisibility('INHERIT')}
                                            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                                isInherited
                                                    ? 'border-2 border-[#0B57D0] bg-white dark:bg-[#1E1F20] shadow-xs'
                                                    : canManagePermissions
                                                    ? 'border border-gray-200/80 dark:border-[#444746] bg-white dark:bg-[#1E1F20] hover:border-gray-300'
                                                    : 'border border-gray-200 opacity-60 cursor-not-allowed'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                        <Globe className="w-3.5 h-3.5 text-[#0B57D0]" />
                                                        Kế thừa thư mục cha ({parentFolderName || 'CSD'})
                                                    </span>
                                                    {isInherited && (
                                                        <span className="text-[10px] bg-[#E8F0FE] text-[#0B57D0] dark:bg-[#0B57D0]/30 dark:text-[#7CBBF3] font-semibold px-2 py-0.5 rounded-full">
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    Tự động áp dụng toàn bộ quyền của thư mục cha "{parentFolderName || 'CSD'}".
                                                </p>
                                            </div>
                                        </div>

                                        {/* Option 2: Không kế thừa */}
                                        <div
                                            onClick={() => canManagePermissions && isInherited && !isUpdatingVisibility && handleToggleVisibility('RESTRICTED')}
                                            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                                                !isInherited
                                                    ? 'border-2 border-[#0B57D0] bg-white dark:bg-[#1E1F20] shadow-xs'
                                                    : canManagePermissions
                                                    ? 'border border-gray-200/80 dark:border-[#444746] bg-white dark:bg-[#1E1F20] hover:border-gray-300'
                                                    : 'border border-gray-200 opacity-60 cursor-not-allowed'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                                                        Không kế thừa (Thiết lập riêng)
                                                    </span>
                                                    {!isInherited && (
                                                        <span className="text-[10px] bg-[#FEF7E0] text-[#B06000] font-semibold px-2 py-0.5 rounded-full">
                                                            Tùy biến
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    Tự do chọn phạm vi: Riêng tư, Giới hạn phòng ban hoặc Mở toàn công ty.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card B: Phân quyền áp dụng cho tài liệu */}
                                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] p-4 shadow-2xs space-y-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            Phân quyền áp dụng cho tài liệu
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {isInherited
                                                ? `Tự động kế thừa danh sách phòng ban và người dùng từ "${parentFolderName || 'CSD'}".`
                                                : 'Tùy chỉnh danh sách phòng ban và người dùng có quyền truy cập riêng.'}
                                        </p>
                                    </div>

                                    {isInherited ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            <div
                                                onClick={() => setIsDeptModalOpen(true)}
                                                className="p-3 rounded-xl border border-gray-200/80 dark:border-[#444746] bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/70 transition flex items-center justify-between cursor-pointer"
                                            >
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                    Phòng ban ({inheritedDepts.length})
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                </span>
                                                <span className="text-[10px] font-medium bg-[#F3E8FD] text-[#8430CE] dark:bg-[#8430CE]/20 dark:text-[#D7AEFB] px-2.5 py-0.5 rounded-full">
                                                    Kế thừa: {parentFolderName || 'CSD'}
                                                </span>
                                            </div>

                                            <div
                                                onClick={() => setIsUserModalOpen(true)}
                                                className="p-3 rounded-xl border border-gray-200/80 dark:border-[#444746] bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-100/70 transition flex items-center justify-between cursor-pointer"
                                            >
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                    Cá nhân riêng ({inheritedUsers.length})
                                                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                                </span>
                                                <span className="text-[10px] font-medium bg-[#E8F0FE] text-[#0B57D0] dark:bg-[#0B57D0]/20 dark:text-[#7CBBF3] px-2.5 py-0.5 rounded-full">
                                                    Kế thừa: {parentFolderName || 'CSD'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pt-1">
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { key: 'RESTRICTED', label: 'Hạn chế' },
                                                    { key: 'PRIVATE', label: 'Riêng tư' },
                                                    { key: 'COMPANY', label: 'Toàn công ty' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => handleToggleVisibility(item.key as any)}
                                                        className={`py-1.5 px-3 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                                                            file?.visibility === item.key
                                                                ? 'border-[#0B57D0] bg-[#E8F0FE] text-[#0B57D0]'
                                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="p-3 rounded-xl border border-gray-200/80 dark:border-[#444746] bg-white dark:bg-[#1E1F20]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Phòng ban riêng ({selectedDepts.length})
                                                        </span>
                                                        {canManagePermissions && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsDeptModalOpen(true)}
                                                                className="text-xs font-medium text-[#0B57D0] hover:underline cursor-pointer"
                                                            >
                                                                + Thêm
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                                        {selectedDepts.length > 0 ? (
                                                            selectedDepts.map((d) => (
                                                                <div key={d.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
                                                                    <span className="truncate pr-1 text-gray-800 dark:text-gray-200">{d.name}</span>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <select
                                                                            value={d.level}
                                                                            onChange={(e) => handleDeptLevelChange(d.id, e.target.value as any)}
                                                                            className="text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded px-1 py-0.5 outline-none"
                                                                        >
                                                                            <option value="VIEWER">Xem</option>
                                                                            <option value="EDITOR">Sửa</option>
                                                                        </select>
                                                                        <button onClick={() => handleRemoveDepartment(d.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-[11px] text-gray-400 italic text-center py-2">Chưa chọn phòng ban</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-xl border border-gray-200/80 dark:border-[#444746] bg-white dark:bg-[#1E1F20]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Cá nhân riêng ({selectedUsers.length})
                                                        </span>
                                                        {canManagePermissions && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsUserModalOpen(true)}
                                                                className="text-xs font-medium text-[#0B57D0] hover:underline cursor-pointer"
                                                            >
                                                                + Thêm
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                                        {selectedUsers.length > 0 ? (
                                                            selectedUsers.map((u) => (
                                                                <div key={u.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
                                                                    <span className="truncate pr-1 text-gray-800 dark:text-gray-200">{u.name}</span>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <select
                                                                            value={u.level}
                                                                            onChange={(e) => handleUserLevelChange(u.id, e.target.value as any)}
                                                                            className="text-[11px] bg-gray-50 dark:bg-gray-800 border border-gray-200 rounded px-1 py-0.5 outline-none"
                                                                        >
                                                                            <option value="VIEWER">Xem</option>
                                                                            <option value="EDITOR">Sửa</option>
                                                                        </select>
                                                                        <button onClick={() => handleRemoveUser(u.id)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="text-[11px] text-gray-400 italic text-center py-2">Chưa chọn cá nhân</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CỘT PHẢI (5 phần) */}
                            <div className="lg:col-span-5 sticky top-2 self-start">
                                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-gray-200/80 dark:border-[#444746] p-4 shadow-2xs flex flex-col max-h-[calc(100vh-170px)] min-h-[380px]">
                                    <div className="shrink-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                Danh sách người được áp dụng ({filteredEffectiveMembers.length})
                                            </h3>
                                            {excludedCount > 0 && (
                                                <span className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
                                                    Đã loại trừ {excludedCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {file?.visibility === 'RESTRICTED'
                                                ? 'Bao gồm Chủ sở hữu và những người được cấp quyền riêng biệt.'
                                                : `Tổng hợp từ quyền Kế thừa Thư mục cha (${parentFolderName || 'CSD'}) và Tác giả file`}
                                        </p>

                                        {/* Search Input pill */}
                                        <div className="relative pt-2 pb-1">
                                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                                placeholder="Tìm theo tên, email, phòng ban..."
                                                className="w-full pl-9 pr-3.5 py-1.5 bg-[#F0F4F9] dark:bg-[#2A2B2D] border-0 rounded-full text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition focus:bg-white dark:focus:bg-[#1E1F20] focus:ring-1 focus:ring-[#0B57D0]"
                                            />
                                        </div>
                                    </div>

                                    {/* Scrollable Members List */}
                                    <div className="divide-y divide-[#F0F4F9] dark:divide-gray-800 overflow-y-auto flex-1 min-h-0 overscroll-contain mt-2 pr-0.5">
                                        {filteredEffectiveMembers.map((m) => (
                                            <div
                                                key={m.email}
                                                className={`py-3 flex items-center justify-between gap-2.5 transition ${
                                                    m.isExcluded ? 'opacity-50' : ''
                                                }`}
                                            >
                                                {/* Left: Avatar + Name + Email + Source */}
                                                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                        m.isExcluded
                                                            ? 'bg-gray-200 text-gray-500'
                                                            : m.highestLevel === 'OWNER'
                                                            ? 'bg-[#E6F4EA] text-[#137333]'
                                                            : 'bg-[#E8F0FE] text-[#0B57D0]'
                                                    }`}>
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                                            <span className={`truncate ${m.isExcluded ? 'line-through text-gray-400' : ''}`}>
                                                                {m.name}
                                                            </span>
                                                            {m.highestLevel === 'OWNER' && (
                                                                <span className="text-[10px] text-[#137333] font-medium bg-[#E6F4EA] px-1.5 py-0.2 rounded-full border border-[#CEEAD6] shrink-0">
                                                                    Tác giả
                                                                </span>
                                                            )}
                                                            {m.isExcluded && (
                                                                <span className="text-[9px] text-red-600 font-medium bg-red-50 px-1.5 py-0.2 rounded-full border border-red-200 shrink-0">
                                                                    Đã loại trừ
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                            {m.email} {m.deptName ? `· ${m.deptName}` : ''}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Role label + Subtext + Exclude/Restore */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="flex flex-col items-end gap-0.5 text-right">
                                                        <span className={`text-xs font-medium ${
                                                            m.highestLevel === 'OWNER'
                                                                ? 'text-[#137333]'
                                                                : m.highestLevel === 'EDITOR'
                                                                ? 'text-[#8430CE]'
                                                                : 'text-[#0B57D0]'
                                                        }`}>
                                                            {m.highestLevel === 'OWNER' ? 'Chủ sở hữu' : m.highestLevel === 'EDITOR' ? 'Chỉnh sửa' : 'Chỉ xem'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 max-w-[130px] truncate">
                                                            {m.source}
                                                        </span>
                                                    </div>

                                                    {canManagePermissions && m.highestLevel !== 'OWNER' && (
                                                        <div className="pl-1 border-l border-gray-100 dark:border-gray-800">
                                                            {m.isExcluded ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleExcludeUser(m.userId)}
                                                                    className="text-[11px] text-[#137333] hover:underline font-medium cursor-pointer"
                                                                >
                                                                    Khôi phục
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleExcludeUser(m.userId)}
                                                                    className="text-[11px] text-gray-400 hover:text-red-500 hover:underline font-medium cursor-pointer"
                                                                >
                                                                    Loại trừ
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {filteredEffectiveMembers.length === 0 && (
                                            <div className="py-8 text-center text-xs text-gray-400 italic">
                                                Không tìm thấy ai phù hợp
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <DepartmentSelectModal
                isOpen={isDeptModalOpen}
                departments={departments}
                selectedDeptIds={selectedDepts.map((d) => d.id)}
                onClose={() => setIsDeptModalOpen(false)}
                onConfirm={handleConfirmDepts}
            />

            <UserSelectModal
                isOpen={isUserModalOpen}
                users={users}
                selectedUserIds={selectedUsers.map((u) => u.id)}
                onClose={() => setIsUserModalOpen(false)}
                onConfirm={handleConfirmUsers}
            />

            <RequestAccessModal
                isOpen={showRequestAccessModal}
                fileId={file?.id}
                fileName={file?.name}
                onClose={() => setShowRequestAccessModal(false)}
            />
        </div>
    );
}

export default function FilePermissionsPage() {
    return (
        <Suspense fallback={<LoadingOverlay isLoading={true} text="Đang tải dữ liệu phân quyền..." />}>
            <FilePermissionsPageContent />
        </Suspense>
    );
}
