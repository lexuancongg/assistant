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
import { RefreshCw } from 'lucide-react';
import LoadingOverlay from '@/components/common/LoadingOverlay';

export default function DepartmentsPage() {
    usePageBreadcrumb(['Quản lý phòng ban']);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | number>('');
    const [allUsers, setAllUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');

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

        setIsProcessing(true);
        setProcessingText('Đang thêm thành viên vào phòng ban...');
        const tId = toast.loading('Đang thêm thành viên...');
        try {
            await departmentService.addMember(selectedId, userId);
            toast.success('Đã thêm thành viên vào phòng ban!', { id: tId });
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Thêm thành viên thất bại: ' + (err?.message || err), { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleRemoveMemberConfirm() {
        if (!selectedId || !memberToDelete) return;
        setIsProcessing(true);
        setProcessingText('Đang xóa thành viên khỏi phòng ban...');
        const tId = toast.loading('Đang xóa thành viên...');
        try {
            await departmentService.removeMember(selectedId, memberToDelete.userId);
            toast.success('Đã xóa thành viên khỏi phòng ban!', { id: tId });
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Xóa thành viên thất bại: ' + (err?.message || err), { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
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
        setIsProcessing(true);
        setProcessingText('Đang tạo phòng ban mới...');
        const tId = toast.loading('Đang tạo phòng ban...');
        try {
            const newDept = await departmentService.createDepartment(name);
            toast.success('Tạo phòng ban thành công!', { id: tId });
            setSelectedId(newDept.id);
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Tạo phòng ban thất bại: ' + (err?.message || err), { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleRenameDepartment(newName: string) {
        if (!departmentToRename) return;
        setIsProcessing(true);
        setProcessingText('Đang cập nhật tên phòng ban...');
        const tId = toast.loading('Đang lưu tên phòng ban...');
        try {
            await departmentService.updateDepartmentName(departmentToRename.id, newName);
            toast.success('Cập nhật tên phòng ban thành công!', { id: tId });
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Cập nhật tên thất bại: ' + (err?.message || err), { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
            setDepartmentToRename(null);
        }
    }

    async function handleDeleteDepartmentConfirm() {
        if (!departmentToDelete) return;
        setIsProcessing(true);
        setProcessingText('Đang xóa phòng ban...');
        const tId = toast.loading('Đang xóa phòng ban...');
        try {
            await departmentService.deleteDepartment(departmentToDelete.id);
            toast.success('Đã xóa phòng ban thành công!', { id: tId });
            const remaining = departments.filter((d) => d.id.toString() !== departmentToDelete.id.toString());
            if (selectedId.toString() === departmentToDelete.id.toString()) {
                setSelectedId(remaining.length > 0 ? remaining[0].id : '');
            }
            await loadDepartments(true);
        } catch (err: any) {
            toast.error('Xóa phòng ban thất bại: ' + (err?.message || err), { id: tId });
            throw err;
        } finally {
            setIsProcessing(false);
            setDepartmentToDelete(null);
        }
    }

    return (
        <div className="px-6 pt-5 pb-6 relative min-h-[calc(100vh-64px)] flex flex-col">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý phòng ban</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Tổ chức cơ cấu nhân sự và phân quyền theo từng đơn vị</p>
                </div>
                <button
                    onClick={() => loadDepartments(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    Làm mới
                </button>
            </div>

            {loading && departments.length === 0 ? (
                <div className="flex gap-4 items-start animate-pulse flex-1">
                    <div className="w-64 h-96 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1 h-96 bg-gray-200 rounded-2xl"></div>
                </div>
            ) : (
                <div className="flex gap-5 items-start flex-1 min-h-0">
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
