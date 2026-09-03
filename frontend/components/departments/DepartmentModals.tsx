'use client';
import { useState, useMemo } from 'react';
import { X, Users, UserPlus, Trash2, Search, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { UserDto } from '@/services/user/userService';
import type { DepartmentRole } from '@/lib/types';

// ── Modal Tạo phòng ban ──
interface CreateDepartmentModalProps {
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
}

export function CreateDepartmentModal({ onClose, onCreate }: CreateDepartmentModalProps) {
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || submitting) return;
        setSubmitting(true);
        try {
            await onCreate(name.trim());
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Tạo phòng ban mới</h3>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1.5">
                            Tên phòng ban <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Phòng Kỹ thuật, Phòng Nhân sự..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || submitting}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? 'Đang tạo...' : 'Tạo phòng ban'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Thêm thành viên vào phòng ban ──
interface AddMemberModalProps {
    departmentName: string;
    existingMemberIds: string[];
    allUsers: UserDto[];
    onClose: () => void;
    onAdd: (userId: string, role: DepartmentRole) => Promise<void>;
}

export function AddMemberModal({
    departmentName,
    existingMemberIds,
    allUsers,
    onClose,
    onAdd
}: AddMemberModalProps) {
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<DepartmentRole>('Thành viên');
    const [submitting, setSubmitting] = useState(false);

    const availableUsers = useMemo(() => {
        return allUsers.filter(u => !existingMemberIds.includes(u.id));
    }, [allUsers, existingMemberIds]);

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return availableUsers;
        const q = search.toLowerCase().trim();
        return availableUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    }, [availableUsers, search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || submitting) return;
        setSubmitting(true);
        try {
            await onAdd(selectedUserId, selectedRole);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Thêm thành viên</h3>
                            <p className="text-xs text-gray-400">Vào phòng ban <span className="font-medium text-gray-700">{departmentName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="p-6 flex flex-col gap-4 flex-1 overflow-hidden">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc email người dùng..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-xl">
                            <span className="text-xs font-semibold text-gray-700">Vai trò trong phòng ban:</span>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as DepartmentRole)}
                                className="bg-white border border-gray-200 rounded-lg text-xs font-medium px-3 py-1.5 text-gray-700 outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Thành viên">Thành viên</option>
                                <option value="Trưởng phòng">Trưởng phòng</option>
                            </select>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 min-h-[180px] max-h-[260px]">
                            {filteredUsers.map((u) => {
                                const isSelected = selectedUserId === u.id;
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => setSelectedUserId(u.id)}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                                            isSelected ? 'bg-blue-50/80' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {u.avatarInitial || u.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{u.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center text-xs text-gray-400">
                                    {availableUsers.length === 0 ? 'Tất cả người dùng đã thuộc phòng ban này' : 'Không tìm thấy người dùng phù hợp'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedUserId || submitting}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? 'Đang thêm...' : 'Thêm vào phòng ban'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Modal Xác nhận Xóa thành viên ──
interface ConfirmDeleteMemberModalProps {
    memberName: string;
    departmentName: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export function ConfirmDeleteMemberModal({
    memberName,
    departmentName,
    onClose,
    onConfirm
}: ConfirmDeleteMemberModalProps) {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Xóa thành viên?</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Bạn có chắc chắn muốn xóa <span className="font-semibold text-gray-800">{memberName}</span> khỏi phòng ban <span className="font-semibold text-gray-800">{departmentName}</span>?
                </p>
                <div className="flex items-center gap-2.5 w-full">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition shadow-sm disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}
