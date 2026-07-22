'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sparkles,
    Home,
    MessageSquare,
    FileText,
    Receipt,
    Mail,
    FileSignature,
    Database,
    BarChart3,
    Settings,
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Trang chủ', icon: Home },
        { href: '/dashboard/chat', label: 'Chat với AI', icon: MessageSquare },
        { href: '/dashboard/documents', label: 'Tài liệu', icon: FileText },
        { href: '/dashboard/invoices', label: 'Hóa đơn', icon: Receipt },
        { href: '/dashboard/email', label: 'Email', icon: Mail },
        { href: '/dashboard/contracts', label: 'Hợp đồng', icon: FileSignature },
        { href: '/ai/my-documents', label: 'Dữ liệu đã lưu', icon: Database },
        { href: '/dashboard/reports', label: 'Báo cáo', icon: BarChart3 },
        { href: '/dashboard/settings', label: 'Cài đặt', icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col">
            {/* Logo */}
            <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                    <h1 className="text-base font-bold text-gray-900">AI Assistant</h1>
                    <p className="text-xs text-gray-400">for Business</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive =
                        pathname === href ||
                        (href !== '/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="w-[18px] h-[18px]" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Upgrade card */}
            <div className="p-3">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 p-4 text-white relative overflow-hidden">
                    <Sparkles className="w-5 h-5 mb-2" />
                    <p className="text-sm font-semibold leading-tight">Trải nghiệm AI mạnh mẽ hơn</p>
                    <p className="text-xs text-white/80 mt-1 leading-snug">
                        Nâng cấp gói để sử dụng không giới hạn &amp; nhiều tính năng
                    </p>
                    <button className="mt-3 w-full bg-white text-blue-600 text-xs font-semibold py-2 rounded-lg hover:bg-white/90 transition-colors">
                        Nâng cấp ngay
                    </button>
                </div>
            </div>
        </aside>
    );
}