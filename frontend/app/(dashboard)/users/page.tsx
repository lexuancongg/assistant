'use client';
import { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, X, Loader2, RefreshCw } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import userService, { UserDto } from '@/services/user/userService';
import toast from 'react-hot-toast';
import LoadingOverlay from '@/components/common/LoadingOverlay';

export default function UsersPage() {
    usePageBreadcrumb(['Quản lý người dùng']);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [query, setQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('Đang xử lý...');

    const loadUsers = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (err) {
            console.warn('Cannot fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filtered = users.filter(
        (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
    );

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim() || isCreating) return;

        setIsCreating(true);
        setIsProcessing(true);
        setProcessingText('Đang tạo tài khoản người dùng...');
        const tId = toast.loading('Đang tạo người dùng...');
        try {
            await userService.createUser({
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                role
            });
            toast.success('Tạo người dùng thành công!', { id: tId });
            setShowCreateModal(false);
            setName('');
            setEmail('');
            setPassword('');
            await loadUsers(true);
        } catch (err: any) {
            toast.error('Tạo người dùng thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setIsCreating(false);
            setIsProcessing(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        setTogglingId(id);
        setIsProcessing(true);
        setProcessingText('Đang cập nhật trạng thái người dùng...');
        const tId = toast.loading('Đang cập nhật trạng thái...');
        try {
            await userService.updateStatus(id, nextStatus);
            toast.success('Đã cập nhật trạng thái người dùng!', { id: tId });
            await loadUsers(true);
        } catch (err: any) {
            toast.error('Cập nhật trạng thái thất bại: ' + (err?.message || err), { id: tId });
        } finally {
            setTogglingId(null);
            setIsProcessing(false);
        }
    };

    return (
        <div className="px-6 pt-5 pb-6 relative">
            <LoadingOverlay isLoading={isProcessing} text={processingText} />
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-gray-900">Quản lý người dùng</h1>
                    <button
                        onClick={() => loadUsers()}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
                        title="Tải lại danh sách"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
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
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <tr key={i} className="animate-pulse border-b border-gray-50">
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-200 rounded w-36"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-44"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
                                    <td className="px-5 py-3"><div className="h-4 bg-gray-100 rounded w-8"></div></td>
                                </tr>
                            ))
                        ) : (
                            filtered.map((user) => (
                                <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">
                                                <span className="text-xs font-bold">{user.avatarInitial || user.name?.charAt(0) || '?'}</span>
                                            </div>
                                            <span className="text-gray-800 font-medium">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-2.5 text-gray-500">{user.email}</td>
                                    <td className="px-5 py-2.5 text-gray-600">{user.role}</td>
                                    <td className="px-5 py-2.5">
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                            disabled={togglingId === user.id}
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                                user.status?.toUpperCase() === 'ACTIVE' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'
                                            }`}
                                            title="Click để đổi trạng thái"
                                        >
                                            {togglingId === user.id ? 'Đang lưu...' : (user.status?.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa')}
                                        </button>
                                    </td>
                                    <td className="px-5 py-2.5">
                                        <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Tùy chọn">
                                            <MoreVertical className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                                    Không tìm thấy người dùng
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">Thêm người dùng mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-gray-600">Họ và tên</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Mật khẩu</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600">Vai trò</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm mt-1 outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="USER">USER</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded-lg text-sm"
                                    disabled={isCreating}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Tạo người dùng
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
