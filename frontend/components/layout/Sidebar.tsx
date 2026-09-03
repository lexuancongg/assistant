'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    FolderOpen,
    MessageCircle,
    BarChart3,
    GitCompare,
    UploadCloud,
    Users,
    Building2,
    ShieldCheck,
    Trash2,
    ClipboardList,
    Settings,
    Menu,
    LucideIcon,
} from 'lucide-react';

interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
}

const links: NavLink[] = [
    { href: '/', label: 'Tổng quan', icon: Home },
    { href: '/files', label: 'Quản lý file', icon: FolderOpen },
    { href: '/assistant', label: 'Trợ lý AI', icon: MessageCircle },
    { href: '/analytics', label: 'Phân tích & Dự báo', icon: BarChart3 },
    { href: '/compare', label: 'So sánh tài liệu', icon: GitCompare },
    { href: '/users', label: 'Người dùng', icon: Users },
    { href: '/departments', label: 'Phòng ban', icon: Building2 },
    { href: '/trash', label: 'Thùng rác', icon: Trash2 },
    { href: '/activity', label: 'Nhật ký hoạt động', icon: ClipboardList },
    { href: '/settings', label: 'Cài đặt', icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean | ((v: boolean) => boolean)) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-20 transition-all duration-300 ease-in-out ${
                isOpen ? 'w-56' : 'w-16'
            }`}
        >
            <div className="h-14 flex items-center gap-2.5 px-3 border-b border-gray-100 shrink-0">
                <button
                    onClick={() => setIsOpen((v) => !v)}
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Thu gọn/mở rộng"
                >
                    <Menu className="w-4 h-4" strokeWidth={2.2} />
                </button>
                <div
                    className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                >
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        Rikai Technology
                    </span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 flex flex-col gap-0.5">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={!isOpen ? label : undefined}
                            className={`flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isOpen ? 'px-2.5' : 'px-0 justify-center'
                            } ${
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                            <span
                                className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                                    isOpen ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
                                }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}