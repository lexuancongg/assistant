'use client';
import { useState } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import { USERS } from '@/lib/fake-data';

export default function UsersPage() {
    usePageBreadcrumb(['Quản lý người dùng']);
    const [query, setQuery] = useState('');

    const filtered = USERS.filter(
        (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="px-6 pt-5 pb-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h1>
                <button
                    onClick={() => {
                        // TODO: mở modal / điều hướng tạo user, gọi API POST /api/users
                        console.log('Thêm người dùng');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Thêm người dùng
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 pt-4 pb-3">
                    <div className="relative w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm kiếm người dùng..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                    </div>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                            <th className="font-medium px-5 py-2.5">Họ và tên</th>
                            <th className="font-medium px-5 py-2.5">Email</th>
                            <th className="font-medium px-5 py-2.5">Vai trò</th>
                            <th className="font-medium px-5 py-2.5">Trạng thái</th>
                            <th className="font-medium px-5 py-2.5 w-16">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${user.avatarColor}`}>
                                            <span className="text-xs font-bold">{user.avatarInitial}</span>
                                        </div>
                                        <span className="text-gray-800">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-2.5 text-gray-500">{user.email}</td>
                                <td className="px-5 py-2.5 text-gray-600">{user.role}</td>
                                <td className="px-5 py-2.5">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                        }`}
                                    >
                                        {user.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                                    </span>
                                </td>
                                <td className="px-5 py-2.5">
                                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Tùy chọn">
                                        <MoreVertical className="w-4 h-4" strokeWidth={2} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
