'use client';
import { useEffect, useState, useRef } from 'react';
import { Search, Plus, MoreHorizontal, X, Loader2, Check } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import userService, { UserDto } from '@/services/user/userService';
import toast from 'react-hot-toast';
import UserAvatar from '@/components/common/UserAvatar';

export default function UsersPage() {
    usePageBreadcrumb(['Bảo mật & Quản trị', 'Quản lý nhân viên']);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [query, setQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [togglingId, setTogglingId] = useState<string | number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

    useEffect(() => {
        const handleClose = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-user-menu]')) {
                setOpenMenuId(null);
            }
        };
        window.addEventListener('mousedown', handleClose);
        return () => window.removeEventListener('mousedown', handleClose);
    }, []);

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
        try {
            await userService.createUser({
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                role
            });
            toast.success('Tạo nhân viên thành công!');
            setShowCreateModal(false);
            setName('');
            setEmail('');
            setPassword('');
            await loadUsers(true);
        } catch (err: any) {
            toast.error('Tạo nhân viên thất bại: ' + (err?.message || err));
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleStatus = async (id: string | number, currentStatus: string) => {
        const nextStatus = currentStatus.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        setTogglingId(id);
        try {
            await userService.updateStatus(id, nextStatus);
            toast.success(nextStatus === 'ACTIVE' ? 'Đã kích hoạt tài khoản!' : 'Đã tạm khóa tài khoản!');
            await loadUsers(true);
        } catch (err: any) {
            toast.error('Cập nhật trạng thái thất bại: ' + (err?.message || err));
        } finally {
            setTogglingId(null);
        }
    };

    const formatRole = (r?: string) => {
        if (r === 'ADMIN') return 'Quản trị viên';
        if (r === 'MANAGER') return 'Quản lý';
        return 'Nhân viên';
    };

    return (
        <div className="px-6 pt-3 pb-6 relative min-h-[calc(100vh-64px)] flex flex-col font-sans select-none">
            {/* Header đồng bộ chuẩn Google Drive */}
            <div className="flex items-center justify-between pb-3 shrink-0">
                <h1 className="text-[20px] font-normal text-[#1F1F1F] dark:text-[#E3E3E3] tracking-normal">
                    Quản lý nhân viên
                </h1>
                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="h-[36px] px-4 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-none"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm nhân viên</span>
                </button>
            </div>

            {/* Main Card */}
            <div className="flex-1 bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E0E0] dark:border-neutral-800 p-6 flex flex-col justify-between shadow-xs">
                <div>
                    {/* Search Box chuẩn Google Drive */}
                    <div className="relative w-72 mb-4">
                        <Search className="w-4 h-4 text-[#747775] absolute left-3 top-2.5 pointer-events-none" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm kiếm nhân viên..."
                            className="w-full pl-9 pr-4 py-1.5 text-[13px] rounded-full bg-[#EDF2FC] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] border-0 focus:bg-white dark:focus:bg-[#1E1F20] focus:outline-none focus:ring-1 focus:ring-[#0B57D0] transition"
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-[#E0E0E0] dark:border-neutral-800 text-[13px] font-normal text-[#444746] dark:text-neutral-400 h-11">
                                    <th className="py-2 px-3 font-normal w-[32%]">Họ và tên</th>
                                    <th className="py-2 px-3 font-normal w-[32%]">Email</th>
                                    <th className="py-2 px-3 font-normal w-[18%]">Vai trò</th>
                                    <th className="py-2 px-3 font-normal w-[12%]">Trạng thái</th>
                                    <th className="py-2 px-3 font-normal w-16 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F0] dark:divide-neutral-800/60">
                                {loading ? (
                                    [1, 2, 3, 4].map((i) => (
                                        <tr key={i} className="h-12 animate-pulse">
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-neutral-800 shrink-0" />
                                                    <div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-28" />
                                                </div>
                                            </td>
                                            <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-44" /></td>
                                            <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-20" /></td>
                                            <td className="py-2 px-3"><div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-20" /></td>
                                            <td className="py-2 px-3 text-center"><div className="h-3.5 bg-slate-200 dark:bg-neutral-800 rounded w-6 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    filtered.map((user) => {
                                        const initial = (user.avatarInitial || user.name?.charAt(0) || '?').toUpperCase();
                                        const isActionOpen = openMenuId === user.id;

                                        return (
                                            <tr
                                                key={user.id}
                                                className="h-12 hover:bg-[#F8FAFD] dark:hover:bg-neutral-800/40 text-[13px] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
                                            >
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <UserAvatar
                                                            name={user.name}
                                                            email={user.email}
                                                            avatarUrl={user.avatarUrl}
                                                            size="base"
                                                        />
                                                        <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                                            {user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-[#747775] truncate">
                                                    {user.email}
                                                </td>
                                                <td className="py-2 px-3 text-[#1F1F1F] dark:text-[#E3E3E3]">
                                                    {formatRole(user.role)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`w-2 h-2 rounded-full shrink-0 inline-block ${
                                                                user.status?.toUpperCase() === 'ACTIVE'
                                                                    ? 'bg-[#137333]'
                                                                    : 'bg-[#D93025]'
                                                            }`}
                                                        />
                                                        <span className="text-[13px] text-[#444746] dark:text-neutral-400">
                                                            {user.status?.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <div className="relative inline-block" data-user-menu>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(isActionOpen ? null : user.id);
                                                            }}
                                                            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-neutral-400 hover:text-[#1F1F1F] dark:hover:text-white inline-flex items-center justify-center transition cursor-pointer"
                                                            title="Thao tác"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>

                                                        {isActionOpen && (
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="absolute right-0 top-full mt-1 bg-white dark:bg-[#282A2C] rounded-[4px] shadow-[0_2px_8px_rgba(60,64,67,0.2)] border border-gray-100 dark:border-neutral-700 py-1.5 z-50 w-44 animate-in fade-in duration-100 text-left"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        handleToggleStatus(user.id, user.status);
                                                                    }}
                                                                    className="w-full flex items-center justify-between px-3.5 py-2 text-left text-[13px] hover:bg-[#F0F4F9] dark:hover:bg-neutral-700 text-[#1F1F1F] dark:text-[#E3E3E3] cursor-pointer transition-colors"
                                                                >
                                                                    <span>
                                                                        {user.status?.toUpperCase() === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-[13px] text-[#747775]">
                                            Không tìm thấy nhân viên nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Pagination chuẩn Google Drive */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E0E0E0] dark:border-neutral-800 mt-6 text-[12.5px] text-[#747775]">
                    <span>
                        Hiển thị 1–{filtered.length} trong {filtered.length} kết quả
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#0B57D0] text-white text-[12px] font-medium flex items-center justify-center">
                        1
                    </span>
                </div>
            </div>

            {/* Modal Thêm người dùng chuẩn Material 3 */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4">
                    <div className="bg-white dark:bg-[#282A2C] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[18px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Thêm nhân viên mới</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
                            <div>
                                <label className="text-[12px] font-medium text-[#444746] dark:text-neutral-400">Họ và tên</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập họ và tên..."
                                    className="w-full px-3.5 py-2 border border-[#DADCE0] dark:border-neutral-700 rounded-lg text-[13px] mt-1 outline-none focus:border-[#0B57D0] transition bg-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-[#444746] dark:text-neutral-400">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@enterprise.ai"
                                    className="w-full px-3.5 py-2 border border-[#DADCE0] dark:border-neutral-700 rounded-lg text-[13px] mt-1 outline-none focus:border-[#0B57D0] transition bg-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-[#444746] dark:text-neutral-400">Mật khẩu</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2 border border-[#DADCE0] dark:border-neutral-700 rounded-lg text-[13px] mt-1 outline-none focus:border-[#0B57D0] transition bg-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[12px] font-medium text-[#444746] dark:text-neutral-400">Vai trò</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-3.5 py-2 border border-[#DADCE0] dark:border-neutral-700 rounded-lg text-[13px] mt-1 outline-none focus:border-[#0B57D0] transition bg-transparent"
                                >
                                    <option value="USER" className="dark:bg-[#1E1F20]">Nhân viên</option>
                                    <option value="MANAGER" className="dark:bg-[#1E1F20]">Quản lý</option>
                                    <option value="ADMIN" className="dark:bg-[#1E1F20]">Quản trị viên</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2.5 mt-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="h-[36px] px-4 rounded-full border border-[#747775]/40 hover:border-[#1F1F1F] dark:border-neutral-600 dark:hover:border-neutral-400 text-[13px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-neutral-800 transition cursor-pointer"
                                    disabled={isCreating}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="h-[36px] px-5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-none disabled:opacity-50"
                                >
                                    {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Tạo nhân viên</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
