'use client';

import { useState, useMemo } from 'react';
import { X, Search, Building2, Check, Users } from 'lucide-react';
import { DepartmentDto } from '@/services/department/departmentService';

interface DepartmentSelectModalProps {
    isOpen: boolean;
    departments: DepartmentDto[];
    selectedDeptIds: (string | number)[];
    onClose: () => void;
    onConfirm: (selectedIds: (string | number)[]) => void;
}

export default function DepartmentSelectModal({
    isOpen,
    departments,
    selectedDeptIds,
    onClose,
    onConfirm,
}: DepartmentSelectModalProps) {
    const [search, setSearch] = useState('');
    const [tempSelected, setTempSelected] = useState<(string | number)[]>(selectedDeptIds);

    const filtered = useMemo(() => {
        if (!search.trim()) return departments;
        const q = search.toLowerCase();
        return departments.filter((d) => d.name.toLowerCase().includes(q));
    }, [departments, search]);

    if (!isOpen) return null;

    const toggleSelect = (id: string | number) => {
        setTempSelected((prev) =>
            prev.map(String).includes(String(id))
                ? prev.filter((item) => String(item) !== String(id))
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (tempSelected.length === filtered.length) {
            setTempSelected([]);
        } else {
            setTempSelected(filtered.map((d) => d.id));
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
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900">Chọn phòng ban</h2>
                            <p className="text-[11px] text-gray-400">Chọn phòng ban được cấp quyền truy cập</p>
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
                            placeholder="Tìm kiếm phòng ban..."
                            className="w-full bg-gray-50/80 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition"
                        />
                    </div>

                    <div className="flex items-center justify-between px-0.5 text-xs text-gray-500">
                        <span>
                            Đã chọn <strong className="text-purple-700 font-semibold">{tempSelected.length}</strong> / {departments.length}
                        </span>
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-xs text-purple-600 hover:text-purple-800 hover:underline font-medium"
                        >
                            {tempSelected.length === filtered.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>
                </div>

                {/* Department List */}
                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {filtered.length > 0 ? (
                        filtered.map((dept) => {
                            const isChecked = tempSelected.map(String).includes(String(dept.id));
                            return (
                                <div
                                    key={dept.id}
                                    onClick={() => toggleSelect(dept.id)}
                                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                                        isChecked ? 'bg-purple-50/60' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                                            isChecked ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            <Building2 className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">{dept.name}</p>
                                            <p className="text-[11px] text-gray-400">
                                                {dept.members?.length || 0} thành viên
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                        isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center text-xs text-gray-400">
                            Không tìm thấy phòng ban nào.
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
                        className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-xs"
                    >
                        Xác nhận ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>
    );
}