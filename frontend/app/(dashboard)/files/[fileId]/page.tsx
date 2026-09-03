'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import FileTypeIcon from '@/components/files/FileTypeIcon';
import { FILES } from '@/lib/fake-data';

const TABS = ['Thông tin', 'Nội dung', 'AI Summary', 'Lịch sử', 'Quyền truy cập'] as const;
type Tab = (typeof TABS)[number];

export default function FileDetailPage() {
    const params = useParams<{ fileId: string }>();
    const file = FILES.find((f) => f.id === params.fileId) ?? FILES[0];
    usePageBreadcrumb(['Tất cả file', file.name]);
    const [activeTab, setActiveTab] = useState<Tab>('Thông tin');

    return (
        <div className="px-6 pt-5 pb-6">
            <Link href="/files" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                Tất cả file
            </Link>

            <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                    <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <FileTypeIcon type={file.type} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-semibold text-gray-900 truncate">{file.name}</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {file.size} · {file.type.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                            Upload bởi {file.uploadedByName} · {file.updatedAt}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 px-5 border-b border-gray-100">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {activeTab === 'Thông tin' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <dl className="flex flex-col gap-3 text-sm">
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Tên file</dt>
                                        <dd className="text-gray-800">{file.name}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Loại file</dt>
                                        <dd className="text-gray-800 uppercase">{file.type}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Kích thước</dt>
                                        <dd className="text-gray-800">{file.size}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Đường dẫn</dt>
                                        <dd className="text-gray-800 truncate">{file.path ?? '/'}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Tags</dt>
                                        <dd className="flex flex-wrap gap-1.5">
                                            {(file.tags ?? []).map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                        </dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-28 text-gray-400 shrink-0">Mô tả</dt>
                                        <dd className="text-gray-800">Hợp đồng lao động ký ngày 01/06/2024</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 mb-2">
                                    <Sparkles className="w-4 h-4 text-blue-500" strokeWidth={2} />
                                    AI Summary
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Hợp đồng lao động không xác định thời hạn giữa Công ty Rikai Technology và ông Trần Văn Nam ở vị trí Kỹ sư phần mềm, mức lương 25,000,000 VNĐ/tháng...
                                </p>
                                <button
                                    onClick={() => setActiveTab('AI Summary')}
                                    className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Nội dung' && (
                        <p className="text-sm text-gray-500">Xem trước nội dung file — tích hợp trình xem PDF/Office ở đây.</p>
                    )}

                    {activeTab === 'AI Summary' && (
                        <div className="max-w-2xl">
                            <p className="text-sm text-gray-800 font-medium mb-2">Tóm tắt hợp đồng lao động với {file.uploadedByName}:</p>
                            <ul className="flex flex-col gap-1.5 text-sm text-gray-600">
                                <li>• Loại hợp đồng: Hợp đồng lao động không xác định thời hạn</li>
                                <li>• Chức danh: Kỹ sư phần mềm</li>
                                <li>• Ngày bắt đầu: 01/06/2024</li>
                                <li>• Mức lương: 25,000,000 VNĐ/tháng</li>
                                <li>• Thời gian thử việc: 02 tháng</li>
                            </ul>
                        </div>
                    )}

                    {activeTab === 'Lịch sử' && (
                        <p className="text-sm text-gray-500">Lịch sử phiên bản và chỉnh sửa của file sẽ hiển thị ở đây.</p>
                    )}

                    {activeTab === 'Quyền truy cập' && (
                        <div className="text-sm text-gray-500">
                            Xem chi tiết tại{' '}
                            <Link href={`/files/${file.id}/permissions`} className="text-blue-600 hover:underline">
                                trang Phân quyền
                            </Link>
                            .
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
