'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Folder,
    Building2,
    User,
    Plus,
    Trash2,
    Lock,
    Globe,
    RefreshCw,
    Search,
    ChevronRight,
    Check,
    X,
    Link2,
    Users,
    Shield,
    CheckCircle2,
    ChevronDown,
} from 'lucide-react';
import departmentService, { DepartmentDto } from '@/services/department/departmentService';
import userService, { UserDto } from '@/services/user/userService';
import forderService, { FolderPermissionDto, FolderPermissionUpdateDto } from '@/services/forder/forderService';
import DepartmentSelectModal from '@/components/files/permissions/DepartmentSelectModal';
import UserSelectModal from '@/components/files/permissions/UserSelectModal';
import toast from 'react-hot-toast';

type AccessScope = 'Riêng tư' | 'Hạn chế' | 'Toàn công ty';

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
    sources: string[];
    highestLevel: 'VIEWER' | 'EDITOR' | 'OWNER';
    isExcluded: boolean;
    isOwner?: boolean;
}

// Google Material style avatar colors
function getAvatarColor(nameOrEmail: string) {
    const colors = [
        'bg-[#c2e7ff] text-[#001d35]',
        'bg-[#e8def8] text-[#1d192b]',
        'bg-[#c4eed0] text-[#072711]',
        'bg-[#fedfc8] text-[#2c1500]',
        'bg-[#fce2ec] text-[#31101e]',
        'bg-[#d0e4ff] text-[#001d36]',
    ];
    let hash = 0;
    for (let i = 0; i < (nameOrEmail || '').length; i++) {
        hash = nameOrEmail.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function PermissionsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const folderId = searchParams.get('folderId') || searchParams.get('id') || '';
    const fileId = searchParams.get('fileId');
    const targetName = searchParams.get('name') || 'Thư mục tài liệu';

    useEffect(() => {
        if (fileId) {
            router.replace(`/files/${fileId}/permissions`);
        }
    }, [fileId, router]);

    const [scope, setScope] = useState<AccessScope>('Hạn chế');
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);

    // Chủ sở hữu thư mục
    const [folderOwner, setFolderOwner] = useState<UserDto | null>(null);
    const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
    const [ownerSearch, setOwnerSearch] = useState('');

    // Thông tin thư mục cha & kế thừa
    const [parentFolder, setParentFolder] = useState<{ id: number; name: string } | null>(null);
    const [isInherited, setIsInherited] = useState<boolean>(true);

    // Quyền kế thừa
    const [inheritedDepts, setInheritedDepts] = useState<SelectedDepartmentItem[]>([]);
    const [inheritedUsers, setInheritedUsers] = useState<SelectedUserItem[]>([]);

    // Quyền cấp riêng
    const [directDepts, setDirectDepts] = useState<SelectedDepartmentItem[]>([]);
    const [directUsers, setDirectUsers] = useState<SelectedUserItem[]>([]);

    // Danh sách loại trừ (DENY)
    const [inheritedExcludedUserIds, setInheritedExcludedUserIds] = useState<(string | number)[]>([]);
    const [directExcludedUserIds, setDirectExcludedUserIds] = useState<(string | number)[]>([]);

    const activeExcludedUserIds = useMemo(() => {
        return isInherited ? inheritedExcludedUserIds : directExcludedUserIds;
    }, [isInherited, inheritedExcludedUserIds, directExcludedUserIds]);

    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [deptsRes, usersRes, treeRes, permsRes, folderDetailRes] = await Promise.allSettled([
                    departmentService.getDepartments(),
                    userService.getUsers(),
                    forderService.getFolderTree(),
                    folderId ? forderService.getFolderPermissions(folderId) : Promise.resolve([]),
                    folderId ? forderService.getFolderById(folderId) : Promise.resolve(null),
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

                // 1. Phân tích Chủ sở hữu
                let initialOwner: UserDto | null = null;
                if (folderDetailRes.status === 'fulfilled' && folderDetailRes.value) {
                    const fInfo = folderDetailRes.value;
                    if (fInfo.ownerId) {
                        initialOwner = loadedUsers.find((u) => String(u.id) === String(fInfo.ownerId)) || null;
                    }
                }

                if (!initialOwner && folderId) {
                    try {
                        const cachedOwner = localStorage.getItem('folder_owner_' + folderId);
                        if (cachedOwner) {
                            const parsed = JSON.parse(cachedOwner);
                            if (parsed && parsed.id) {
                                initialOwner = loadedUsers.find((u) => String(u.id) === String(parsed.id)) || parsed;
                            }
                        }
                    } catch (e) {}
                }

                if (!initialOwner && loadedUsers.length > 0) {
                    const currentStored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
                    if (currentStored) {
                        try {
                            const parsedCurrent = JSON.parse(currentStored);
                            initialOwner = loadedUsers.find((u) => String(u.id) === String(parsedCurrent.id) || u.email === parsedCurrent.email) || null;
                        } catch (e) {}
                    }
                    if (!initialOwner) {
                        initialOwner = loadedUsers[0];
                    }
                }
                setFolderOwner(initialOwner);

                // 2. Phân tích cây thư mục để tìm Thư mục cha
                let parentInfo: { id: number; name: string } | null = null;
                const inheritedDList: SelectedDepartmentItem[] = [];
                const inheritedUList: SelectedUserItem[] = [];

                if (treeRes.status === 'fulfilled' && Array.isArray(treeRes.value)) {
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

                    const result = findAncestors(treeRes.value, folderId);
                    if (result && result.ancestors.length > 0) {
                        const directParent = result.ancestors[result.ancestors.length - 1];
                        parentInfo = { id: directParent.id, name: directParent.name };
                        setParentFolder(parentInfo);

                        for (const ancestor of result.ancestors) {
                            try {
                                const aPerms = await forderService.getFolderPermissions(ancestor.id);
                                if (Array.isArray(aPerms)) {
                                    aPerms.forEach((p: FolderPermissionDto) => {
                                        if (p.level === 'DENY') return;
                                        if (p.subjectType === 'DEPARTMENT') {
                                            if (!inheritedDList.some((d) => String(d.id) === String(p.subjectId))) {
                                                const fDept = loadedDepts.find((d) => String(d.id) === String(p.subjectId));
                                                inheritedDList.push({
                                                    id: p.subjectId,
                                                    name: p.subjectName || fDept?.name || 'Phòng ban',
                                                    memberCount: fDept?.members?.length || 0,
                                                    level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                                                    source: `Kế thừa từ "${ancestor.name}"`,
                                                    isInherited: true,
                                                });
                                            }
                                        } else if (p.subjectType === 'USER') {
                                            if (!inheritedUList.some((u) => String(u.id) === String(p.subjectId))) {
                                                const fUser = loadedUsers.find((u) => String(u.id) === String(p.subjectId));
                                                inheritedUList.push({
                                                    id: p.subjectId,
                                                    name: p.subjectName || fUser?.name || 'Nhân sự',
                                                    email: fUser?.email || p.subjectDetail || '',
                                                    level: p.level === 'EDITOR' ? 'EDITOR' : 'VIEWER',
                                                    source: `Kế thừa từ "${ancestor.name}"`,
                                                    isInherited: true,
                                                });
                                            }
                                        }
                                    });
                                }
                            } catch (e) {
                                console.warn('Lỗi lấy quyền kế thừa:', e);
                            }
                        }
                        setInheritedDepts(inheritedDList);
                        setInheritedUsers(inheritedUList);
                    }
                }

                // 3. Tải quyền cấp trực tiếp
                const directDList: SelectedDepartmentItem[] = [];
                const directUList: SelectedUserItem[] = [];
                const loadedExcludedUserIds: (string | number)[] = [];

                if (permsRes.status === 'fulfilled' && Array.isArray(permsRes.value) && permsRes.value.length > 0) {
                    permsRes.value.forEach((p: FolderPermissionDto) => {
                        if (p.subjectType === 'USER' && p.level === 'DENY') {
                            loadedExcludedUserIds.push(p.subjectId);
                            return;
                        }

                        if (p.subjectType === 'DEPARTMENT') {
                            const foundDept = loadedDepts.find((d) => String(d.id) === String(p.subjectId));
                            directDList.push({
                                id: p.subjectId,
                                name: p.subjectName || foundDept?.name || 'Phòng ban',
                                memberCount: foundDept?.members?.length || 0,
                                level: (p.level as any) || 'VIEWER',
                                isInherited: false,
                            });
                        } else if (p.subjectType === 'USER') {
                            const foundUser = loadedUsers.find((u) => String(u.id) === String(p.subjectId));
                            directUList.push({
                                id: p.subjectId,
                                name: p.subjectName || foundUser?.name || 'Nhân sự',
                                email: foundUser?.email || p.subjectDetail || '',
                                level: (p.level as any) || 'VIEWER',
                                isInherited: false,
                            });
                        }
                    });
                }

                // 4. Khôi phục trạng thái kế thừa
                let initialInherit = parentInfo !== null;
                try {
                    const saved = localStorage.getItem('folder_inherit_' + folderId);
                    if (saved !== null) {
                        initialInherit = JSON.parse(saved);
                    }
                } catch (e) {}
                setIsInherited(initialInherit);

                let initialInheritedExcluded: (string | number)[] = [];
                let initialDirectExcluded: (string | number)[] = [];

                try {
                    const cachedInherited = localStorage.getItem('folder_inherited_excluded_' + folderId);
                    if (cachedInherited) {
                        const parsed = JSON.parse(cachedInherited);
                        if (Array.isArray(parsed)) initialInheritedExcluded = parsed;
                    }
                    const cachedDirect = localStorage.getItem('folder_direct_excluded_' + folderId);
                    if (cachedDirect) {
                        const parsed = JSON.parse(cachedDirect);
                        if (Array.isArray(parsed)) initialDirectExcluded = parsed;
                    }
                } catch (e) {}

                if (loadedExcludedUserIds.length > 0) {
                    if (initialInherit || (directDList.length === 0 && directUList.length === 0)) {
                        loadedExcludedUserIds.forEach((id) => {
                            if (!initialInheritedExcluded.map(String).includes(String(id))) initialInheritedExcluded.push(id);
                        });
                    } else {
                        loadedExcludedUserIds.forEach((id) => {
                            if (!initialDirectExcluded.map(String).includes(String(id))) initialDirectExcluded.push(id);
                        });
                    }
                }

                setInheritedExcludedUserIds(initialInheritedExcluded);
                setDirectExcludedUserIds(initialDirectExcluded);
                setDirectDepts(directDList);
                setDirectUsers(directUList);

                if (initialInherit) {
                    setDirectDepts([]);
                    setDirectUsers([]);
                }
            } catch (err) {
                console.error('Failed to load permissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [folderId]);

    const displayedDepts = useMemo(() => {
        if (!parentFolder || !isInherited) {
            return directDepts.map((d) => ({ ...d, isInherited: false }));
        }
        return inheritedDepts.map((d) => ({ ...d, isInherited: true }));
    }, [parentFolder, isInherited, directDepts, inheritedDepts]);

    const displayedUsers = useMemo(() => {
        if (!parentFolder || !isInherited) {
            return directUsers.map((u) => ({ ...u, isInherited: false }));
        }
        return inheritedUsers.map((u) => ({ ...u, isInherited: true }));
    }, [parentFolder, isInherited, directUsers, inheritedUsers]);

    const handleToggleInheritance = (newVal: boolean) => {
        setIsInherited(newVal);
        try {
            localStorage.setItem('folder_inherit_' + folderId, JSON.stringify(newVal));
        } catch (e) {}
    };

    const handleConfirmDepartments = (chosenIds: (string | number)[]) => {
        const updated: SelectedDepartmentItem[] = chosenIds.map((id) => {
            const existing = directDepts.find((d) => String(d.id) === String(id));
            if (existing) return existing;
            const deptInfo = departments.find((d) => String(d.id) === String(id));
            return {
                id,
                name: deptInfo?.name || 'Phòng ban',
                memberCount: deptInfo?.members?.length || 0,
                level: 'VIEWER',
                isInherited: false,
            };
        });
        setDirectDepts(updated);
    };

    const handleConfirmUsers = (chosenIds: (string | number)[]) => {
        const updated: SelectedUserItem[] = chosenIds.map((id) => {
            const existing = directUsers.find((u) => String(u.id) === String(id));
            if (existing) return existing;
            const userInfo = users.find((u) => String(u.id) === String(id));
            return {
                id,
                name: userInfo?.name || 'Nhân sự',
                email: userInfo?.email || '',
                level: 'VIEWER',
                isInherited: false,
            };
        });
        setDirectUsers(updated);
    };

    const handleRemoveDepartment = (deptId: string | number) => {
        setDirectDepts((prev) => prev.filter((d) => String(d.id) !== String(deptId)));
    };

    const handleRemoveUser = (userId: string | number) => {
        setDirectUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
    };

    const handleDeptLevelChange = (deptId: string | number, level: 'VIEWER' | 'EDITOR') => {
        setDirectDepts((prev) =>
            prev.map((d) => (String(d.id) === String(deptId) ? { ...d, level } : d))
        );
    };

    const handleUserLevelChange = (userId: string | number, level: 'VIEWER' | 'EDITOR') => {
        setDirectUsers((prev) =>
            prev.map((u) => (String(u.id) === String(userId) ? { ...u, level } : u))
        );
    };

    const handleToggleExcludeUser = (userId: string | number) => {
        if (folderOwner && String(folderOwner.id) === String(userId)) {
            toast.error('Không thể loại trừ Chủ sở hữu của thư mục');
            return;
        }

        const isCurrentlyExcluded = activeExcludedUserIds.map(String).includes(String(userId));
        const willExclude = !isCurrentlyExcluded;

        if (isInherited) {
            setInheritedExcludedUserIds((prev) => {
                const next = willExclude
                    ? [...prev, userId]
                    : prev.filter((id) => String(id) !== String(userId));
                try {
                    localStorage.setItem('folder_inherited_excluded_' + folderId, JSON.stringify(next));
                    localStorage.setItem('folder_excluded_' + folderId, JSON.stringify(next));
                } catch (e) {}
                return next;
            });
        } else {
            setDirectExcludedUserIds((prev) => {
                const next = willExclude
                    ? [...prev, userId]
                    : prev.filter((id) => String(id) !== String(userId));
                try {
                    localStorage.setItem('folder_direct_excluded_' + folderId, JSON.stringify(next));
                    localStorage.setItem('folder_excluded_' + folderId, JSON.stringify(next));
                } catch (e) {}
                return next;
            });
        }

        toast.success(willExclude ? 'Đã chặn quyền truy cập của thành viên' : 'Đã khôi phục quyền truy cập');
    };

    const getUserDept = useCallback(
        (u?: UserDto | null) => {
            if (!u) return '';
            if (u.departmentName) return u.departmentName;
            const found = departments.find((d) =>
                d.members?.some((m) => String(m.userId) === String(u.id))
            );
            return found?.name || '';
        },
        [departments]
    );

    // Tính toán danh sách nhân sự thực tế có quyền
    const effectiveMembers: EffectiveMember[] = useMemo(() => {
        const map = new Map<string, EffectiveMember>();

        // 1. Chủ sở hữu thư mục
        if (folderOwner) {
            map.set(String(folderOwner.id), {
                userId: folderOwner.id,
                name: folderOwner.name,
                email: folderOwner.email,
                deptName: getUserDept(folderOwner) || '',
                sources: ['Chủ sở hữu'],
                highestLevel: 'OWNER',
                isExcluded: false,
                isOwner: true,
            });
        }

        if (scope === 'Riêng tư') {
            return Array.from(map.values());
        }

        if (scope === 'Toàn công ty') {
            users.forEach((u) => {
                if (map.has(String(u.id))) return;
                const foundDept = departments.find((d) =>
                    d.members?.some((m) => String(m.userId) === String(u.id))
                );
                map.set(String(u.id), {
                    userId: u.id,
                    name: u.name,
                    email: u.email,
                    deptName: foundDept?.name || 'Toàn công ty',
                    sources: ['Toàn công ty'],
                    highestLevel: 'VIEWER',
                    isExcluded: activeExcludedUserIds.map(String).includes(String(u.id)),
                    isOwner: false,
                });
            });
            return Array.from(map.values());
        }

        displayedDepts.forEach((deptItem) => {
            const fullDept = departments.find((d) => String(d.id) === String(deptItem.id));
            if (fullDept && fullDept.members) {
                fullDept.members.forEach((m) => {
                    const uId = m.userId;
                    const existing = map.get(String(uId));
                    const sourceText = deptItem.isInherited
                        ? `Kế thừa (${parentFolder?.name || 'Cha'})`
                        : deptItem.name;

                    if (existing) {
                        if (!existing.sources.includes(sourceText)) {
                            existing.sources.push(sourceText);
                        }
                        if (existing.highestLevel !== 'OWNER' && deptItem.level === 'EDITOR') {
                            existing.highestLevel = 'EDITOR';
                        }
                    } else {
                        map.set(String(uId), {
                            userId: uId,
                            name: m.name || m.email,
                            email: m.email,
                            deptName: fullDept.name,
                            sources: [sourceText],
                            highestLevel: deptItem.level,
                            isExcluded: activeExcludedUserIds.map(String).includes(String(uId)),
                            isOwner: false,
                        });
                    }
                });
            }
        });

        displayedUsers.forEach((userItem) => {
            const uId = userItem.id;
            const foundDept = departments.find((d) =>
                d.members?.some((m) => String(m.userId) === String(uId))
            );
            const sourceText = userItem.isInherited
                ? `Kế thừa (${parentFolder?.name || 'Cha'})`
                : 'Cá nhân';

            const existing = map.get(String(uId));
            if (existing) {
                if (!existing.sources.includes(sourceText)) {
                    existing.sources.push(sourceText);
                }
                if (existing.highestLevel !== 'OWNER' && userItem.level === 'EDITOR') {
                    existing.highestLevel = 'EDITOR';
                }
            } else {
                map.set(String(uId), {
                    userId: uId,
                    name: userItem.name,
                    email: userItem.email,
                    deptName: foundDept?.name || '',
                    sources: [sourceText],
                    highestLevel: userItem.level,
                    isExcluded: activeExcludedUserIds.map(String).includes(String(uId)),
                    isOwner: false,
                });
            }
        });

        return Array.from(map.values());
    }, [scope, folderOwner, displayedDepts, displayedUsers, departments, users, activeExcludedUserIds, parentFolder, getUserDept]);

    const excludedMembersCount = useMemo(() => {
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

    const filteredUsersForOwner = useMemo(() => {
        if (!ownerSearch.trim()) return users;
        const q = ownerSearch.toLowerCase();
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                getUserDept(u).toLowerCase().includes(q)
        );
    }, [users, ownerSearch, getUserDept]);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            const link = `${window.location.origin}/files?folderId=${folderId}`;
            navigator.clipboard.writeText(link);
            toast.success('Đã sao chép đường liên kết thư mục');
        }
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        const tId = toast.loading('Đang lưu thay đổi...');
        try {
            if (folderId) {
                try {
                    localStorage.setItem('folder_inherit_' + folderId, JSON.stringify(isInherited));
                    localStorage.setItem('folder_inherited_excluded_' + folderId, JSON.stringify(inheritedExcludedUserIds));
                    localStorage.setItem('folder_direct_excluded_' + folderId, JSON.stringify(directExcludedUserIds));
                    localStorage.setItem('folder_excluded_' + folderId, JSON.stringify(activeExcludedUserIds));
                    if (folderOwner) {
                        localStorage.setItem('folder_owner_' + folderId, JSON.stringify(folderOwner));
                    }
                } catch (e) {}

                const activeDirectDepts = !isInherited
                    ? directDepts.map((d) => ({
                          subjectType: 'DEPARTMENT' as const,
                          subjectId: d.id,
                          level: d.level,
                      }))
                    : [];

                const activeDirectUsers = !isInherited
                    ? directUsers
                          .filter((u) => !activeExcludedUserIds.includes(u.id))
                          .map((u) => ({
                              subjectType: 'USER' as const,
                              subjectId: u.id,
                              level: u.level,
                          }))
                    : [];

                const deniedUserPerms = activeExcludedUserIds.map((uId) => ({
                    subjectType: 'USER' as const,
                    subjectId: uId,
                    level: 'DENY' as const,
                }));

                const permissionsToSave =
                    scope === 'Toàn công ty'
                        ? deniedUserPerms
                        : [...activeDirectDepts, ...activeDirectUsers, ...deniedUserPerms];

                const payload: FolderPermissionUpdateDto = {
                    accessScope:
                        scope === 'Riêng tư'
                            ? 'PRIVATE'
                            : scope === 'Toàn công ty'
                            ? 'COMPANY_WIDE'
                            : isInherited
                            ? 'INHERIT'
                            : 'RESTRICTED',
                    ownerId: folderOwner ? folderOwner.id : undefined,
                    permissions: permissionsToSave,
                };

                await forderService.updateFolderPermissions(folderId, payload);
                toast.success('Đã lưu cấu hình phân quyền thành công!', { id: tId });
            }
        } catch (err: any) {
            console.error('Lỗi lưu phân quyền:', err);
            toast.error(err?.message || 'Có lỗi xảy ra khi lưu phân quyền', { id: tId });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 h-full w-full flex flex-col items-center justify-center p-12 text-[#444746] dark:text-slate-400">
                <div className="w-8 h-8 border-3 border-[#0B57D0] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-[13px] font-normal">Đang tải phân quyền...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full overflow-y-auto bg-white dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] scrollbar-thin">
            {/* GIỮ NGUYÊN CHIỀU RỘNG TRANG - MAX-W-NONE HOẶC 1360PX */}
            <div className="w-full max-w-[1360px] mx-auto px-6 py-4 space-y-4 pb-20">
                {/* ── 1. TOPBAR & ACTIONS (Google Drive Style) ── */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E0E2EC] dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.push('/files')}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                            title="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                            {/* Breadcrumb Google Drive */}
                            <div className="flex items-center gap-1.5 text-[12px] text-[#444746] dark:text-slate-400 mb-0.5 min-w-0 flex-wrap">
                                <span
                                    className="hover:underline cursor-pointer"
                                    onClick={() => router.push('/files')}
                                >
                                    Drive của tôi
                                </span>
                                <ChevronRight className="w-3 h-3 text-[#747775] shrink-0" />
                                {parentFolder && (
                                    <>
                                        <span
                                            className="truncate hover:underline cursor-pointer"
                                            onClick={() => router.push(`/files?folderId=${parentFolder.id}`)}
                                        >
                                            {parentFolder.name}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-[#747775] shrink-0" />
                                    </>
                                )}
                                <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1 truncate">
                                    <Folder className="w-3.5 h-3.5 text-[#5F6368] dark:text-slate-400 shrink-0" />
                                    {targetName}
                                </span>
                            </div>
                            <h1 className="text-[20px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-normal select-none">
                                Chia sẻ &ldquo;{targetName}&rdquo;
                            </h1>
                        </div>
                    </div>

                    {/* Action Buttons: Google Drive Material 3 Pill Shapes */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#747775] dark:border-slate-700 text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#0B57D0]/10 text-[13px] font-medium transition cursor-pointer"
                            title="Sao chép đường liên kết thư mục"
                        >
                            <Link2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Sao chép liên kết</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/files')}
                            disabled={saving}
                            className="px-5 py-2 rounded-full text-[13px] font-medium text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSavePermissions}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#001D35] text-[13px] font-medium transition cursor-pointer disabled:opacity-50"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                            )}
                            <span>Lưu thay đổi</span>
                        </button>
                    </div>
                </div>

                {/* ── 2. CARD: NHỮNG NGƯỜI CÓ QUYỀN TRUY CẬP (PEOPLE WITH ACCESS) ── */}
                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-5 space-y-4">
                    {/* Header bar: Title + Action buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#F1F3F4] dark:border-slate-800">
                        <div>
                            <h2 className="text-[15px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                Những người có quyền truy cập
                            </h2>
                            <p className="text-[12px] text-[#444746] dark:text-slate-400 mt-0.5">
                                Quản lý chủ sở hữu, phòng ban và cá nhân được cấp quyền trực tiếp hoặc kế thừa
                            </p>
                        </div>

                        {/* Add buttons Google Drive Style */}
                        {(!parentFolder || !isInherited) && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#747775] dark:border-slate-700 text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#0B57D0]/10 text-[12.5px] font-medium transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Thêm phòng ban</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#747775] dark:border-slate-700 text-[#0B57D0] dark:text-[#A8C7FA] hover:bg-[#0B57D0]/10 text-[12.5px] font-medium transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Thêm cá nhân</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kế thừa quyền từ thư mục cha (Google Drive Style Banner) */}
                    {parentFolder && (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F0F4F9] dark:bg-slate-800/50 border border-[#E0E2EC] dark:border-slate-700/60 flex-wrap gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[#444746] dark:text-slate-300 shadow-2xs shrink-0">
                                    <Folder className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                            {isInherited
                                                ? `Đang kế thừa quyền từ "${parentFolder.name}"`
                                                : `Đã ngắt kế thừa quyền từ "${parentFolder.name}"`}
                                        </span>
                                        <span
                                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                isInherited
                                                    ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-blue-900/60 dark:text-blue-200'
                                                    : 'bg-[#F1F3F4] text-[#444746] dark:bg-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {isInherited ? 'Tự động đồng bộ' : 'Tùy chỉnh riêng'}
                                        </span>
                                    </div>
                                    <p className="text-[11.5px] text-[#444746] dark:text-slate-400 mt-0.5 truncate">
                                        {isInherited
                                            ? 'Thành viên và phòng ban trong thư mục cha tự động được cấp quyền truy cập vào thư mục này'
                                            : 'Bạn có thể tự do thêm hoặc bớt phòng ban và thành viên cho riêng thư mục này'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleToggleInheritance(!isInherited)}
                                className="px-4 py-1.5 rounded-full text-[12.5px] font-medium border border-[#747775] dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-[#1F1F1F] dark:text-[#E3E3E3] transition cursor-pointer shrink-0"
                            >
                                {isInherited ? 'Ngắt kế thừa' : 'Áp dụng lại kế thừa'}
                            </button>
                        </div>
                    )}

                    {/* Danh sách người có quyền truy cập (List in Google Drive Style) */}
                    <div className="divide-y divide-[#F1F3F4] dark:divide-slate-800">
                        {/* 1. Chủ sở hữu (Owner) */}
                        {folderOwner && (
                            <div className="flex items-center justify-between py-3 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-[13px] shrink-0 ${getAvatarColor(
                                            folderOwner.name || folderOwner.email
                                        )}`}
                                    >
                                        {(folderOwner.name || folderOwner.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                {folderOwner.name}
                                            </span>
                                            <span className="text-[11px] text-[#444746] dark:text-slate-400 font-normal">
                                                (bạn)
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-[#444746] dark:text-slate-400 truncate">
                                            {folderOwner.email} {getUserDept(folderOwner) ? `• ${getUserDept(folderOwner)}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[12.5px] text-[#444746] dark:text-slate-400 font-normal px-2 py-1">
                                        Chủ sở hữu
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOwnerSearch('');
                                            setIsOwnerModalOpen(true);
                                        }}
                                        className="text-[12px] text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-medium px-2 py-1 transition cursor-pointer"
                                    >
                                        Chuyển quyền
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 2. Các phòng ban */}
                        {displayedDepts.map((dept) => (
                            <div key={dept.id} className="flex items-center justify-between py-3 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-[#F0F4F9] dark:bg-slate-800 flex items-center justify-center text-[#444746] dark:text-slate-300 shrink-0">
                                        <Building2 className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                {dept.name}
                                            </span>
                                            {dept.isInherited ? (
                                                <span className="text-[11px] text-[#444746] dark:text-slate-400 bg-[#F1F3F4] dark:bg-slate-800 px-2 py-0.5 rounded-full font-normal">
                                                    Kế thừa
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[#0B57D0] dark:text-[#A8C7FA] bg-[#C2E7FF]/60 dark:bg-blue-950/60 px-2 py-0.5 rounded-full font-normal">
                                                    Cấp riêng
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-[#444746] dark:text-slate-400 truncate">
                                            Phòng ban • {dept.memberCount} thành viên
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {dept.isInherited ? (
                                        <span className="text-[12.5px] text-[#444746] dark:text-slate-400 px-3 py-1.5 font-normal">
                                            {dept.level === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}
                                        </span>
                                    ) : (
                                        <>
                                            <select
                                                value={dept.level}
                                                onChange={(e) =>
                                                    handleDeptLevelChange(dept.id, e.target.value as any)
                                                }
                                                className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#F0F4F9] hover:bg-[#E0E2EC] dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer transition"
                                            >
                                                <option value="VIEWER">Người xem</option>
                                                <option value="EDITOR">Người chỉnh sửa</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDepartment(dept.id)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#444746] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 transition cursor-pointer"
                                                title="Xóa quyền truy cập"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* 3. Các cá nhân */}
                        {displayedUsers.map((user) => (
                            <div key={user.id} className="flex items-center justify-between py-3 gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-[13px] shrink-0 ${getAvatarColor(
                                            user.name || user.email
                                        )}`}
                                    >
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                {user.name}
                                            </span>
                                            {user.isInherited ? (
                                                <span className="text-[11px] text-[#444746] dark:text-slate-400 bg-[#F1F3F4] dark:bg-slate-800 px-2 py-0.5 rounded-full font-normal">
                                                    Kế thừa
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-[#0B57D0] dark:text-[#A8C7FA] bg-[#C2E7FF]/60 dark:bg-blue-950/60 px-2 py-0.5 rounded-full font-normal">
                                                    Cấp riêng
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-[#444746] dark:text-slate-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {user.isInherited ? (
                                        <span className="text-[12.5px] text-[#444746] dark:text-slate-400 px-3 py-1.5 font-normal">
                                            {user.level === 'EDITOR' ? 'Người chỉnh sửa' : 'Người xem'}
                                        </span>
                                    ) : (
                                        <>
                                            <select
                                                value={user.level}
                                                onChange={(e) =>
                                                    handleUserLevelChange(user.id, e.target.value as any)
                                                }
                                                className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#F0F4F9] hover:bg-[#E0E2EC] dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer transition"
                                            >
                                                <option value="VIEWER">Người xem</option>
                                                <option value="EDITOR">Người chỉnh sửa</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveUser(user.id)}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#444746] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 transition cursor-pointer"
                                                title="Xóa quyền truy cập"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {displayedDepts.length === 0 && displayedUsers.length === 0 && (
                            <div className="py-6 text-center text-[12.5px] text-[#444746] dark:text-slate-400">
                                Chưa có phòng ban hoặc cá nhân nào khác được thêm vào thư mục này.
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 3. CARD: QUYỀN TRUY CẬP CHUNG (GENERAL ACCESS - GOOGLE DRIVE STYLE) ── */}
                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3.5 min-w-0">
                            {/* General Access Icon Container */}
                            <div className="w-10 h-10 rounded-full bg-[#F0F4F9] dark:bg-slate-800 flex items-center justify-center text-[#444746] dark:text-slate-300 shrink-0 mt-0.5">
                                {scope === 'Toàn công ty' ? (
                                    <Building2 className="w-5 h-5 text-[#0B57D0] dark:text-[#A8C7FA]" />
                                ) : scope === 'Riêng tư' ? (
                                    <User className="w-5 h-5" />
                                ) : (
                                    <Lock className="w-5 h-5 text-[#444746] dark:text-slate-300" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-[14.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                    Quyền truy cập chung
                                </h2>

                                {/* Scope selector dropdown */}
                                <div className="mt-1 flex items-center gap-2">
                                    <select
                                        value={scope}
                                        onChange={(e) => setScope(e.target.value as AccessScope)}
                                        className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#F0F4F9] hover:bg-[#E0E2EC] dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer transition"
                                    >
                                        <option value="Hạn chế">Bị hạn chế</option>
                                        <option value="Toàn công ty">Toàn công ty</option>
                                        <option value="Riêng tư">Riêng tư</option>
                                    </select>
                                </div>

                                <p className="text-[12px] text-[#444746] dark:text-slate-400 mt-1">
                                    {scope === 'Hạn chế' &&
                                        'Chỉ những người được thêm ở trên mới có thể truy cập bằng đường liên kết này'}
                                    {scope === 'Toàn công ty' &&
                                        'Bất kỳ ai trong công ty đều có thể truy cập tài liệu trong thư mục này'}
                                    {scope === 'Riêng tư' &&
                                        'Chỉ chủ sở hữu mới có quyền truy cập vào thư mục này'}
                                </p>
                            </div>
                        </div>

                        {scope === 'Toàn công ty' && (
                            <div className="flex items-center gap-2 shrink-0 pt-1">
                                <span className="text-[12.5px] text-[#444746] dark:text-slate-400">
                                    Quyền mặc định:
                                </span>
                                <span className="text-[12.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#F0F4F9] dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                    Người xem
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 4. CARD: DANH SÁCH THÀNH VIÊN ÁP DỤNG (EFFECTIVE MEMBERS TABLE) ── */}
                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-5 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-[14.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                    Danh sách thành viên áp dụng ({effectiveMembers.length})
                                </h2>
                                {excludedMembersCount > 0 && (
                                    <span className="text-[11px] font-medium bg-[#FCE2EC] text-[#B3261E] dark:bg-red-950/60 dark:text-red-300 px-2.5 py-0.5 rounded-full">
                                        Đã chặn {excludedMembersCount} người
                                    </span>
                                )}
                            </div>
                            <p className="text-[12px] text-[#444746] dark:text-slate-400 mt-0.5">
                                Tổng hợp tất cả nhân sự có quyền truy cập. Bạn có thể bấm Loại trừ để chặn quyền của một cá nhân cụ thể.
                            </p>
                        </div>

                        {/* Search Bar Capsule Google Drive Style */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-[#747775] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Tìm kiếm thành viên..."
                                className="w-full bg-[#F0F4F9] dark:bg-slate-800 border-0 rounded-full pl-9 pr-3 py-1.5 text-[12.5px] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] outline-none focus:ring-1 focus:ring-[#0B57D0] focus:bg-white dark:focus:bg-slate-900 transition"
                            />
                        </div>
                    </div>

                    <div className="border border-[#E0E2EC] dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[#E0E2EC] dark:border-slate-800 text-[12px] font-medium text-[#444746] dark:text-slate-400 select-none h-10 bg-[#F8FAFD] dark:bg-slate-800/40">
                                    <th className="py-2.5 px-4 font-medium">Thành viên</th>
                                    <th className="py-2.5 px-4 font-medium">Phòng ban</th>
                                    <th className="py-2.5 px-4 font-medium">Nguồn cấp quyền</th>
                                    <th className="py-2.5 px-4 font-medium">Quyền hạn</th>
                                    <th className="py-2.5 px-4 font-medium">Trạng thái</th>
                                    <th className="py-2.5 pr-4 text-right font-medium">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F3F4] dark:divide-slate-800/60 text-[12.5px]">
                                {filteredEffectiveMembers.length > 0 ? (
                                    filteredEffectiveMembers.map((member) => {
                                        const initial = member.name ? member.name.charAt(0).toUpperCase() : 'U';
                                        const isOwner =
                                            member.isOwner ||
                                            (folderOwner && String(folderOwner.id) === String(member.userId));
                                        return (
                                            <tr
                                                key={member.userId}
                                                className={`transition h-12 ${
                                                    member.isExcluded
                                                        ? 'bg-gray-50/50 dark:bg-slate-800/20 text-gray-400 opacity-60'
                                                        : 'hover:bg-[#F8FAFD] dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-medium text-[11px] shrink-0 ${getAvatarColor(
                                                                member.name || member.email
                                                            )}`}
                                                        >
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p
                                                                    className={`font-medium text-[12.5px] ${
                                                                        member.isExcluded
                                                                            ? 'line-through text-gray-400'
                                                                            : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
                                                                    }`}
                                                                >
                                                                    {member.name}
                                                                </p>
                                                                {isOwner && (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EDF2FA] text-[#0B57D0] dark:bg-blue-900/40 dark:text-blue-200 font-medium">
                                                                        Chủ sở hữu
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-[#444746] dark:text-slate-400 truncate">
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-[#444746] dark:text-slate-400">
                                                    {member.deptName || '—'}
                                                </td>
                                                <td className="py-2 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {member.sources.map((s, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-[11px] font-normal text-[#444746] dark:text-slate-300 bg-[#F1F3F4] dark:bg-slate-800 px-2 py-0.5 rounded-full"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                    {isOwner
                                                        ? 'Toàn quyền quản trị'
                                                        : member.highestLevel === 'EDITOR'
                                                        ? 'Người chỉnh sửa'
                                                        : 'Người xem'}
                                                </td>
                                                <td className="py-2 px-4">
                                                    {member.isExcluded ? (
                                                        <span className="text-[11px] font-medium text-[#B3261E] dark:text-red-400">
                                                            Đã loại trừ
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-normal text-[#137333] dark:text-emerald-400">
                                                            Đang áp dụng
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-4 text-right">
                                                    {isOwner ? (
                                                        <span className="text-[11.5px] text-[#747775] italic select-none">
                                                            Không thể chặn
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleExcludeUser(member.userId)}
                                                            className={`text-[12px] font-medium hover:underline transition cursor-pointer ${
                                                                member.isExcluded
                                                                    ? 'text-[#0B57D0] dark:text-[#A8C7FA]'
                                                                    : 'text-[#B3261E] dark:text-red-400'
                                                            }`}
                                                        >
                                                            {member.isExcluded ? 'Khôi phục' : 'Loại trừ'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-xs text-[#747775]">
                                            Không tìm thấy thành viên nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL: CHUYỂN QUYỀN SỞ HỮU (Google Drive Material Style) ── */}
            {isOwnerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs px-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-[#1E1F20] rounded-2xl w-full max-w-lg p-5 shadow-2xl border border-[#E0E2EC] dark:border-slate-800 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F4] dark:border-slate-800">
                            <h3 className="text-[16px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                                Chuyển quyền sở hữu thư mục
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOwnerModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#444746] hover:bg-[#F0F4F9] dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-[12px] text-[#444746] dark:text-slate-400 mt-2 mb-3">
                            Chọn nhân sự sẽ trở thành chủ sở hữu thư mục này. Người này sẽ có toàn quyền quản trị và phê duyệt các yêu cầu truy cập.
                        </p>

                        {/* Search Input */}
                        <div className="relative mb-3">
                            <Search className="w-4 h-4 text-[#747775] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                autoFocus
                                value={ownerSearch}
                                onChange={(e) => setOwnerSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc email..."
                                className="w-full bg-[#F0F4F9] dark:bg-slate-800 border-0 rounded-full pl-10 pr-4 py-2 text-[12.5px] text-[#1F1F1F] dark:text-[#E3E3E3] outline-none focus:ring-1 focus:ring-[#0B57D0] focus:bg-white dark:focus:bg-slate-900 transition"
                            />
                        </div>

                        {/* List of Users */}
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 border border-[#E0E2EC] dark:border-slate-800 rounded-xl divide-y divide-[#F1F3F4] dark:divide-slate-800/60 max-h-72">
                            {filteredUsersForOwner.map((u) => {
                                const isCurrent = folderOwner && String(folderOwner.id) === String(u.id);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => {
                                            setFolderOwner(u);
                                            setIsOwnerModalOpen(false);
                                            toast.success(`Đã chọn ${u.name} làm Chủ sở hữu thư mục`);
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
                                            isCurrent
                                                ? 'bg-[#C2E7FF]/30 dark:bg-blue-950/60'
                                                : 'hover:bg-[#F8FAFD] dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs shrink-0 ${getAvatarColor(
                                                    u.name || u.email
                                                )}`}
                                            >
                                                {(u.name || u.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                    {u.name}
                                                </p>
                                                <p className="text-[11px] text-[#444746] dark:text-slate-400 truncate">
                                                    {u.email} {getUserDept(u) ? `• ${getUserDept(u)}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isCurrent ? (
                                                <span className="text-[11px] font-medium text-[#0B57D0] dark:text-[#A8C7FA] bg-[#C2E7FF] dark:bg-blue-900/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Chủ sở hữu hiện tại
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-medium">
                                                    Chọn
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredUsersForOwner.length === 0 && (
                                <div className="py-8 text-center text-xs text-[#747775]">
                                    Không tìm thấy nhân viên phù hợp.
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2.5 pt-4 mt-1 border-t border-[#F1F3F4] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsOwnerModalOpen(false)}
                                className="px-5 py-2 text-[13px] font-medium text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            <DepartmentSelectModal
                isOpen={isDeptModalOpen}
                departments={departments}
                selectedDeptIds={directDepts.map((d) => d.id)}
                onClose={() => setIsDeptModalOpen(false)}
                onConfirm={handleConfirmDepartments}
            />

            {/* User Modal */}
            <UserSelectModal
                isOpen={isUserModalOpen}
                users={users}
                selectedUserIds={directUsers.map((u) => u.id)}
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
                <div className="flex-1 h-full w-full flex items-center justify-center p-12 text-[#444746]">
                    <div className="w-8 h-8 border-3 border-[#0B57D0] border-t-transparent rounded-full animate-spin mb-3" />
                </div>
            }
        >
            <PermissionsPageContent />
        </Suspense>
    );
}