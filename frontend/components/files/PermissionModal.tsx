'use client';
import { useState } from 'react';
import { X, FileText, Folder, Users } from 'lucide-react';
import { PERMISSION_ENTRIES } from '@/lib/fake-data';

type AccessScope = 'Riêng tư' | 'Hạn chế' | 'Toàn công ty';

type PermissionTarget = {
    type: 'file' | 'folder';
    id: string;
    name: string;
    // chỉ có ý nghĩa khi type === 'folder'
    childFileCount?: number;
    childFolderCount?: number;
};

export default function PermissionModal({ target, onClose }: { target: PermissionTarget; onClose: () => void }) {
    const [scope, setScope] = useState<AccessScope>('Hạn chế');
    // TODO: thay bằng permission thật theo target.type + target.id khi có API
    const grantees = PERMISSION_ENTRIES.slice(0, 2);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl w-full max-w-md p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        Phân quyền {target.type === 'folder' ? 'thư mục' : 'truy cập'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Đóng">
                        <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                    {target.type === 'folder' ? (
                        <Folder className="w-4 h-4 text-gray-400" strokeWidth={2} />
                    ) : (
                        <FileText className="w-4 h-4 text-gray-400" strokeWidth={2} />
                    )}
                    {target.name}
                </div>
                {target.type === 'folder' && (
                    <p className="text-xs text-gray-400 mb-4">
                        Áp dụng cho {target.childFileCount ?? 0} file, {target.childFolderCount ?? 0} thư mục con
                    </p>
                )}
                {target.type === 'file' && <div className="mb-4" />}

                <p className="text-xs text-gray-400 mb-2">Mức truy cập</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {(['Riêng tư', 'Hạn chế', 'Toàn công ty'] as AccessScope[]).map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setScope(opt)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                scope === opt
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {scope !== 'Toàn công ty' && (
                    <>
                        <p className="text-xs text-gray-400 mb-2">Được truy cập bởi</p>
                        <div className="flex flex-col divide-y divide-gray-50 border border-gray-100 rounded-lg mb-4">
                            {grantees.map((entry) => (
                                <div key={entry.id} className="flex items-center gap-2.5 px-3 py-2.5">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${entry.avatarColor}`}>
                                        {entry.subjectType === 'group' ? (
                                            <Users className="w-3.5 h-3.5" strokeWidth={2} />
                                        ) : (
                                            <span className="text-[11px] font-bold">{entry.avatarInitial}</span>
                                        )}
                                    </div>
                                    <span className="flex-1 text-sm text-gray-800 truncate">{entry.name}</span>
                                    <span className="text-xs text-gray-400 shrink-0">{entry.level === 'Editor' ? 'Chỉnh sửa' : 'Xem & tải'}</span>
                                </div>
                            ))}
                        </div>
                        <input
                            placeholder="Thêm người dùng hoặc phòng ban..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors mb-4"
                        />
                    </>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 mb-5">
                    <span className="text-amber-500 mt-0.5">ⓘ</span>
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Trợ lý AI sẽ chỉ trích dẫn {target.type === 'folder' ? 'các file trong thư mục này' : 'file này'} cho người dùng thuộc danh sách trên
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={() => {
                            // TODO: PATCH /api/{target.type}s/{target.id}/permissions { scope, grantees }
                            onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}