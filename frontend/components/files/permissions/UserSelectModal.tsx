'use client';

import { useState, useMemo } from 'react';
import { X, Search, User, Check, Mail } from 'lucide-react';
import { UserDto } from '@/services/user/userService';

interface UserSelectModalProps {
    isOpen: boolean;
    users: UserDto[];
    selectedUserIds: string[];
    onClose: () => void;
    onConfirm: (selectedIds: string[]) => void;
}

export default function UserSelectModal({
    isOpen,
    users,
    selectedUserIds,
    onClose,
    onConfirm,
}: UserSelectModalProps) {
    const [search, setSearch] = useState('');
    const [tempSelected, setTempSelected] = useState<string[]>(selectedUserIds);

    const filtered = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.toLowerCase();
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
        );
    }, [users, search]);

    if (!isOpen) return null;

    const toggleSelect = (id: string) => {
        setTempSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (tempSelected.length === filtered.length) {
            setTempSelected([]);
        } else {
            setTempSelected(filtered.map((u) => u.id));
        }
    };

    const handleConfirm = () => {
        onConfirm(tempSelected);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
            <div className="bg-white rounded-xl w-full max-w-xl p-4 shadow-xl border border-gray-200 flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Chọn cá nhân</h2>
                            <p className="text-[11px] text-gray-400">Cấp quyền riêng biệt cho từng thành viên</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search & Actions */}
                <div className="py-2.5 space-y-2">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-200 transition"
                        />
                    </div>

                    <div className="flex items-center justify-between px-0.5 text-xs text-gray-500">
                        <span>
                            Đã chọn <strong className="text-blue-700 font-semibold">{tempSelected.length}</strong> / {users.length}
                        </span>
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                            {tempSelected.length === filtered.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {filtered.length > 0 ? (
                        filtered.map((user) => {
                            const isChecked = tempSelected.includes(user.id);
                            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => toggleSelect(user.id)}
                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                                        isChecked ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                                            isChecked ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {initial}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                                                {user.role && (
                                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded">
                                                        {user.role}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 truncate mt-0.2">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center text-xs text-gray-400">
                            Không tìm thấy nhân sự nào.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 pt-2.5 mt-1 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                        Xác nhận ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>
    );
}