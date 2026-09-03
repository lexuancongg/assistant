'use client';
import { Bell, ChevronDown, Building2 } from 'lucide-react';
import { CURRENT_USER } from '@/lib/fake-data';

interface TopbarProps {
    breadcrumb?: string[];
}

export default function Topbar({ breadcrumb = [] }: TopbarProps) {
    return (
        <div className="sticky top-0 right-0 h-14 bg-white z-10 border-b border-gray-100">
            <div className="h-full flex items-center justify-between gap-4 px-6">
                <div className="flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
                    {breadcrumb.map((item, i) => (
                        <span key={item} className="flex items-center gap-1.5 min-w-0">
                            {i > 0 && <span className="text-gray-300">/</span>}
                            <span
                                className={`truncate ${
                                    i === breadcrumb.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-400'
                                }`}
                            >
                                {item}
                            </span>
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full border border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/80 transition-all duration-200">
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-blue-600" strokeWidth={2.2} />
                        </div>
                        <span className="text-xs font-medium text-gray-800 tracking-tight">
                            {CURRENT_USER.company}
                        </span>
                        <ChevronDown className="w-3 h-3 text-gray-400" strokeWidth={2.2} />
                    </button>

                    <div className="w-px h-5 bg-gray-200" />

                    <button className="relative p-1.5 rounded-full hover:bg-gray-50 transition-colors duration-200 group" aria-label="Thông báo">
                        <Bell className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" strokeWidth={2} />
                        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 ring-2 ring-white text-[8px] flex items-center justify-center rounded-full text-white font-semibold leading-none">
                            3
                        </span>
                    </button>

                    <div className="w-px h-5 bg-gray-200" />

                    <div className="flex items-center gap-2 pr-1">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-white">
                                {CURRENT_USER.name.split(' ').slice(-1)[0][0]}
                            </span>
                        </div>
                        <div className="leading-tight hidden sm:block">
                            <p className="text-xs font-semibold text-gray-800 whitespace-nowrap">{CURRENT_USER.name}</p>
                            <p className="text-[11px] text-gray-400 whitespace-nowrap">{CURRENT_USER.role}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
