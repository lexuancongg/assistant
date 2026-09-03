'use client';
import { Users, UserPlus, Trash2, ShieldCheck, Mail } from 'lucide-react';
import type { Department, DepartmentRole } from '@/lib/types';

interface MemberItem {
    userId: string;
    name: string;
    email: string;
    role: DepartmentRole;
    avatarInitial?: string;
    avatarColor?: string;
}

export default function DepartmentMembersPanel({
    department,
    onOpenAddMember,
    onOpenRemoveMember,
    onChangeRole,
}: {
    department: Department;
    onOpenAddMember: () => void;
    onOpenRemoveMember: (member: MemberItem) => void;
    onChangeRole: (userId: string, role: DepartmentRole) => void;
}) {
    return (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 min-w-0 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{department.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {department.members.length} thành viên đang hoạt động
                        </p>
                    </div>
                </div>

                <button
                    onClick={onOpenAddMember}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                    <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
                    Thêm thành viên
                </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {department.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3.5 px-4 py-3 hover:bg-gray-50/70 transition">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${member.avatarColor || 'bg-blue-100 text-blue-700'}`}>
                            {member.avatarInitial || member.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 truncate">
                                <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{member.email}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={member.role}
                                onChange={(e) => onChangeRole(member.userId, e.target.value as DepartmentRole)}
                                className={`text-xs font-medium border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer transition ${
                                    member.role === 'Trưởng phòng'
                                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                            >
                                <option value="Trưởng phòng">Trưởng phòng</option>
                                <option value="Thành viên">Thành viên</option>
                            </select>

                            <button
                                onClick={() => onOpenRemoveMember(member)}
                                title={`Xóa ${member.name} khỏi phòng ban`}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition shrink-0"
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                            </button>
                        </div>
                    </div>
                ))}
                {department.members.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <Users className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-500">Chưa có thành viên nào trong phòng ban</p>
                        <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm thành viên" để thêm nhân sự vào phòng ban này</p>
                    </div>
                )}
            </div>
        </div>
    );
}