'use client';
import { useState } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import toast from 'react-hot-toast';

const SETTINGS_TABS = ['Thông tin chung', 'Lưu trữ', 'Bảo mật', 'AI & Xử lý', 'Email thông báo', 'Tích hợp', 'Sao lưu'] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

export default function SettingsPage() {
    usePageBreadcrumb(['Cài đặt hệ thống']);
    const [activeTab, setActiveTab] = useState<SettingsTab>('Thông tin chung');

    const [companyName, setCompanyName] = useState('Rikai Technology');
    const [email, setEmail] = useState('contact@rikai.com');
    const [phone, setPhone] = useState('0123 456 789');
    const [address, setAddress] = useState('123 Đường ABC, Quận 1, TP.HCM');

    return (
        <div className="px-6 pt-5 pb-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Cài đặt hệ thống</h1>

            <div className="flex gap-4">
                <div className="w-52 shrink-0 bg-white rounded-xl border border-gray-200 p-2 flex flex-col gap-0.5 h-fit">
                    {SETTINGS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                activeTab === tab ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5">
                    {activeTab === 'Thông tin chung' ? (
                        <div className="max-w-md flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-gray-600">Tên công ty</label>
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Email liên hệ</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Số điện thoại</label>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Địa chỉ</label>
                                <input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="mt-1.5 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    toast.success('Đã lưu thông tin cài đặt!');
                                }}
                                className="self-end px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Mục cài đặt "{activeTab}" sẽ được bổ sung sau.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
