'use client';
import { Bell, ChevronDown, Building2 } from 'lucide-react';

export default function Topbar() {
    return (
        <div className="fixed h-16 bg-white border-b border-gray-100 flex items-center px-8 justify-end sticky top-0 z-10 w-[calc(100%-16rem)]">
            <div className="flex items-center gap-5">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Công ty TNHH ABC</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <div className="relative cursor-pointer hover:scale-110 transition">
                    <Bell className="w-5.5 h-5.5 text-gray-500" size={22} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] flex items-center justify-center rounded-full text-white font-medium">
                        3
                    </div>
                </div>

                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        <span className="text-xs font-semibold text-indigo-600">A</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
    );
}