'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Sparkles,
    LayoutDashboard,
    MessageSquare,
    Folder,
    Building2,
    Users,
    Trash2,
    Activity,
    Settings,
    LogOut,
    Database
} from 'lucide-react';
import authenticationService from '@/services/auth/authenticationService';
import toast from 'react-hot-toast';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const links = [
        { href: '/ai', label: 'Hỏi Gemini', icon: Sparkles },
        { href: '/files', label: 'Quản lý file', icon: Folder },
        { href: '/ai/my-documents', label: 'Tài liệu của tôi', icon: Database },
        { href: '/departments', label: 'Phòng ban', icon: Building2 },
        { href: '/users', label: 'Người dùng', icon: Users },
        { href: '/trash', label: 'Thùng rác', icon: Trash2 },
        { href: '/activity', label: 'Nhật ký hoạt động', icon: Activity },
        { href: '/settings', label: 'Cài đặt', icon: Settings },
    ];

    const handleLogout = async () => {
        try {
            await authenticationService.logout();
            toast.success('Đã đăng xuất');
            router.push('/login');
        } catch (e) {
            router.push('/login');
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-20">
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-100 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div className="leading-tight min-w-0">
                    <h1 className="text-sm font-bold text-gray-900 truncate">Enterprise AI</h1>
                    <p className="text-[10px] text-gray-400 font-medium">Assistant Hub</p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout button */}
            <div className="p-3 border-t border-gray-100 shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}