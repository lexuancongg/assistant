// app/departments/page.tsx
'use client';
import { useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import DepartmentList from '@/components/departments/DepartmentList';
import DepartmentMembersPanel from '@/components/departments/DepartmentMembersPanel';
import { DEPARTMENTS } from '@/lib/fake-data';
import type { DepartmentRole } from '@/lib/types';

export default function DepartmentsPage() {
    usePageBreadcrumb(['Quản lý phòng ban']);
    const [departments, setDepartments] = useState(DEPARTMENTS);
    const [selectedId, setSelectedId] = useState(departments[0]?.id ?? '');

    const selectedDept = departments.find((d) => d.id === selectedId) ?? departments[0];

    function handleAddMember(query: string) {
        // TODO: gọi API tìm user theo query rồi POST /api/departments/{id}/members
        console.log('Thêm', query, 'vào', selectedId);
    }

    function handleRemoveMember(userId: string) {
        setDepartments((prev) =>
            prev.map((d) => (d.id === selectedId ? { ...d, members: d.members.filter((m) => m.userId !== userId) } : d))
        );
        // TODO: DELETE /api/departments/{id}/members/{userId}
    }

    function handleChangeRole(userId: string, role: DepartmentRole) {
        setDepartments((prev) =>
            prev.map((d) =>
                d.id === selectedId
                    ? { ...d, members: d.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
                    : d
            )
        );
        // TODO: PATCH /api/departments/{id}/members/{userId} { role }
    }

    function handleCreateDepartment() {
        // TODO: mở modal tạo phòng ban mới, POST /api/departments
        console.log('Tạo phòng ban mới');
    }

    return (
        <div className="px-6 pt-5 pb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Quản lý phòng ban</h1>
            <div className="flex gap-4 items-start">
                <DepartmentList
                    departments={departments}
                    selectedId={selectedDept?.id ?? ''}
                    onSelect={setSelectedId}
                    onCreate={handleCreateDepartment}
                />
                {selectedDept && (
                    <DepartmentMembersPanel
                        department={selectedDept}
                        onAddMember={handleAddMember}
                        onRemoveMember={handleRemoveMember}
                        onChangeRole={handleChangeRole}
                    />
                )}
            </div>
        </div>
    );
}