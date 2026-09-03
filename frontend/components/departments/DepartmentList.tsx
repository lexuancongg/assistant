'use client';
import { Building2, Plus, Users } from 'lucide-react';
import type { Department } from '@/lib/types';

export default function DepartmentList({
    departments,
    selectedId,
    onSelect,
    onCreate,
}: {
    departments: Department[];
    selectedId: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
}) {
    return (
        <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh sách phòng ban</p>
                <button
                    onClick={onCreate}
                    aria-label="Tạo phòng ban"
                    title="Tạo phòng ban mới"
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition"
                >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-240px)]">
                {departments.map((dept) => {
                    const isSelected = selectedId === dept.id;
                    return (
                        <button
                            key={dept.id}
                            onClick={() => onSelect(dept.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left ${
                                isSelected
                                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={2} />
                            <span className="flex-1 truncate">{dept.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {dept.members.length}
                            </span>
                        </button>
                    );
                })}
                {departments.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-400">
                        Chưa có phòng ban nào
                    </div>
                )}
            </div>

            <button
                onClick={onCreate}
                className="mt-3 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-xl transition"
            >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Tạo phòng ban mới
            </button>
        </div>
    );
}