'use client';
import { useEffect, useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import DepartmentList from '@/components/departments/DepartmentList';
import DepartmentMembersPanel from '@/components/departments/DepartmentMembersPanel';
import { CreateDepartmentModal, AddMemberModal, ConfirmDeleteMemberModal, RenameDepartmentModal, ConfirmDeleteDepartmentModal } from '@/components/departments/DepartmentModals';
import departmentService, { DepartmentDto } from '@/services/department/departmentService';
import userService, { UserDto } from '@/services/user/userService';
import type { DepartmentRole } from '@/lib/types';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
    usePageBreadcrumb(['Quản lý phòng ban']);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | number>('');
    const [allUsers, setAllUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ userId: string | number; name: string } | null>(null);
    const [departmentToRename, setDepartmentToRename] = useState<{ id: string | number; name: string } | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<{ id: string | number; name: string } | null>(null);

    const loadDepartments = async (keepSelection = true) => {
        setLoading(true);
        try {
            const [deptData, userData] = await Promise.allSettled([
                departmentService.getDepartments(),
                userService.getUsers()
            ]);

            if (userData.status === 'fulfilled') {
                setAllUsers(userData.value);
            }

            if (deptData.status === 'fulfilled') {
                const mapped = deptData.value.map(d => ({
                    id: d.id,
                    name: d.name,
                    members: (d.members || []).map(m => ({
                        userId: m.userId,
                        name: m.name,
                        email: m.email,
                        role: m.role as DepartmentRole,
                        avatarInitial: m.name ? m.name.charAt(0).toUpperCase() : '?',
                        avatarColor: 'bg-blue-100 text-blue-700'
                    }))
                }));
                setDepartments(mapped);
                if (mapped.length > 0 && (!keepSelection || !selectedId)) {
                    setSelectedId(mapped[0].id);
                }
            }
        } catch (err) {
            console.warn('Cannot fetch departments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments(false);
    }, []);

    const selectedDept = departments.find((d) => d.id.toString() === selectedId.toString()) ?? departments[0];

    async function handleAddMember(userId: string | number, role: DepartmentRole) {
        if (!selectedId) return;
        try {
            await departmentService.addMember(selectedId, userId);
            toast.success('Đã thêm thành viên vào phòng ban!');
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Thêm thành viên thất bại: ' + (err?.message || err));
            throw err;
        }
    }

    async function handleRemoveMemberConfirm() {
        if (!selectedId || !memberToDelete) return;
        try {
            await departmentService.removeMember(selectedId, memberToDelete.userId);
            toast.success('Đã xóa thành viên khỏi phòng ban!');
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Xóa thành viên thất bại: ' + (err?.message || err));
            throw err;
        } finally {
            setMemberToDelete(null);
        }
    }

    function handleChangeRole(userId: string | number, role: DepartmentRole) {
        setDepartments((prev) =>
            prev.map((d) =>
                d.id.toString() === selectedId.toString()
                    ? { ...d, members: d.members.map((m: any) => (m.userId.toString() === userId.toString() ? { ...m, role } : m)) }
                    : d
            )
        );
        toast.success('Đã cập nhật vai trò thành viên!');
    }

    async function handleCreateDepartment(name: string) {
        try {
            const newDept = await departmentService.createDepartment(name);
            toast.success('Tạo phòng ban thành công!');
            setSelectedId(newDept.id);
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Tạo phòng ban thất bại: ' + (err?.message || err));
            throw err;
        }
    }

    async function handleRenameDepartment(newName: string) {
        if (!departmentToRename) return;
        try {
            await departmentService.updateDepartmentName(departmentToRename.id, newName);
            toast.success('Cập nhật tên phòng ban thành công!');
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Cập nhật tên thất bại: ' + (err?.message || err));
            throw err;
        } finally {
            setDepartmentToRename(null);
        }
    }

    async function handleDeleteDepartmentConfirm() {
        if (!departmentToDelete) return;
        try {
            await departmentService.deleteDepartment(departmentToDelete.id);
            toast.success('Đã xóa phòng ban thành công!');
            const remaining = departments.filter((d) => d.id.toString() !== departmentToDelete.id.toString());
            if (selectedId.toString() === departmentToDelete.id.toString()) {
                setSelectedId(remaining.length > 0 ? remaining[0].id : '');
            }
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Xóa phòng ban thất bại: ' + (err?.message || err));
            throw err;
        } finally {
            setDepartmentToDelete(null);
        }
    }

    return (
        <div className="px-6 pt-3 pb-6 relative min-h-[calc(100vh-64px)] flex flex-col">

            {/* Header chuẩn Google Drive */}
            <div className="flex items-center justify-between pb-3 shrink-0 select-none">
                <h1 className="text-[20px] font-normal text-[#1F1F1F] dark:text-slate-100 tracking-normal">
                    Quản lý phòng ban
                </h1>
            </div>

            {loading && departments.length === 0 ? (
                <div className="flex gap-5 items-start animate-pulse flex-1">
                    <div className="w-80 h-[520px] bg-slate-200/60 rounded-2xl"></div>
                    <div className="flex-1 h-[520px] bg-slate-200/60 rounded-2xl"></div>
                </div>
            ) : (
                <div className="flex gap-5 items-stretch flex-1 min-h-[520px]">
                    <DepartmentList
                        departments={departments}
                        selectedId={selectedDept?.id ?? ''}
                        onSelect={setSelectedId}
                        onCreate={() => setShowCreateModal(true)}
                        onRename={(dept) => setDepartmentToRename({ id: dept.id, name: dept.name })}
                        onDelete={(dept) => setDepartmentToDelete({ id: dept.id, name: dept.name })}
                    />
                    {selectedDept && (
                        <DepartmentMembersPanel
                            department={selectedDept}
                            onOpenAddMember={() => setShowAddMemberModal(true)}
                            onOpenRemoveMember={(member) => setMemberToDelete({ userId: member.userId, name: member.name })}
                            onChangeRole={handleChangeRole}
                            onRename={(dept) => setDepartmentToRename({ id: dept.id, name: dept.name })}
                        />
                    )}
                </div>
            )}

            {/* ── Modals ── */}
            {showCreateModal && (
                <CreateDepartmentModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateDepartment}
                />
            )}

            {departmentToRename && (
                <RenameDepartmentModal
                    department={departmentToRename}
                    onClose={() => setDepartmentToRename(null)}
                    onRename={handleRenameDepartment}
                />
            )}

            {departmentToDelete && (
                <ConfirmDeleteDepartmentModal
                    department={departmentToDelete}
                    onClose={() => setDepartmentToDelete(null)}
                    onConfirm={handleDeleteDepartmentConfirm}
                />
            )}

            {showAddMemberModal && selectedDept && (
                <AddMemberModal
                    departmentName={selectedDept.name}
                    existingMemberIds={(selectedDept.members || []).map((m: any) => m.userId)}
                    allUsers={allUsers}
                    onClose={() => setShowAddMemberModal(false)}
                    onAdd={handleAddMember}
                />
            )}

            {memberToDelete && selectedDept && (
                <ConfirmDeleteMemberModal
                    memberName={memberToDelete.name}
                    departmentName={selectedDept.name}
                    onClose={() => setMemberToDelete(null)}
                    onConfirm={handleRemoveMemberConfirm}
                />
            )}
        </div>
    );
}
