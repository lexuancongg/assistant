'use client';

import { useState, useMemo } from 'react';
import {
    Search,
    X,
    Check,
    Folder,
    Building2,
    HardDrive,
    Sparkles
} from 'lucide-react';
import { FileItemDto } from '@/services/files/fileManagementService';
import FileTypeIcon from '@/components/files/FileTypeIcon';

interface FilePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFile: (file: FileItemDto) => void;
    title: string;
    currentSelectedId?: number | string;
    files: FileItemDto[];
}

export default function FilePickerModal({
    isOpen,
    onClose,
    onSelectFile,
    title,
    currentSelectedId,
    files
}: FilePickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState<string>('ALL');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [tempSelectedId, setTempSelectedId] = useState<number | string | undefined>(currentSelectedId);

    // Danh sách phòng ban duy nhất
    const departmentList = useMemo(() => {
        const depts = new Set<string>();
        files.forEach(f => {
            if (f.ownerDepartmentName && f.ownerDepartmentName.trim()) {
                depts.add(f.ownerDepartmentName.trim());
            }
        });
        return Array.from(depts);
    }, [files]);

    // Lọc danh sách file
    const filteredFiles = useMemo(() => {
        return files.filter(file => {
            const matchesQuery = searchQuery.trim() === '' ||
                file.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                (file.uploadedByName && file.uploadedByName.toLowerCase().includes(searchQuery.toLowerCase().trim()));

            const matchesDept = selectedDept === 'ALL' ||
                (file.ownerDepartmentName && file.ownerDepartmentName.toLowerCase() === selectedDept.toLowerCase());

            const fileExt = (file.fileType || '').toLowerCase();
            const matchesType = selectedType === 'ALL' ||
                (selectedType === 'pdf' && fileExt === 'pdf') ||
                (selectedType === 'docx' && (fileExt === 'docx' || fileExt === 'doc')) ||
                (selectedType === 'xlsx' && (fileExt === 'xlsx' || fileExt === 'xls'));

            return matchesQuery && matchesDept && matchesType;
        });
    }, [files, searchQuery, selectedDept, selectedType]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const target = files.find(f => f.id === tempSelectedId);
        if (target) {
            onSelectFile(target);
        }
        onClose();
    };

    const handleItemClick = (file: FileItemDto) => {
        setTempSelectedId(file.id);
    };

    const handleItemDoubleClick = (file: FileItemDto) => {
        onSelectFile(file);
        onClose();
    };

    const selectedFileObj = files.find(f => f.id === tempSelectedId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div
                className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header thanh mảnh, không chật chội */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-slate-500" />
                        <div>
                            <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
                            <p className="text-[11px] text-slate-400">Chọn tài liệu từ kho lưu trữ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Toolbar gọn gàng, chữ vừa vặn */}
                <div className="p-3.5 border-b border-slate-100 bg-white space-y-2.5 shrink-0">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm theo tên tài liệu hoặc người tải..."
                            className="w-full text-xs font-normal pl-8 pr-7 py-2 bg-slate-50/70 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-slate-700 transition"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Bộ lọc tinh giản */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Phòng:
                            </span>
                            <button
                                onClick={() => setSelectedDept('ALL')}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
                                    selectedDept === 'ALL'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Tất cả
                            </button>
                            {departmentList.map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => setSelectedDept(dept)}
                                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
                                        selectedDept === dept
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {dept}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-1">
                            {['ALL', 'pdf', 'docx', 'xlsx'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded transition ${
                                        selectedType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Danh sách tài liệu: các thẻ riêng biệt có khoảng cách, không bị dính border */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[260px] max-h-[400px]">
                    {filteredFiles.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                            Không tìm thấy tài liệu phù hợp
                        </div>
                    ) : (
                        filteredFiles.map(file => {
                            const isSelected = file.id === tempSelectedId;
                            return (
                                <div
                                    key={file.id}
                                    onClick={() => handleItemClick(file)}
                                    onDoubleClick={() => handleItemDoubleClick(file)}
                                    className={`px-3 py-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                                        isSelected
                                            ? 'bg-blue-50/60 border-blue-400 shadow-2xs'
                                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            <FileTypeIcon type={file.fileType} className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-medium text-slate-700 truncate max-w-md">
                                                    {file.name}
                                                </p>
                                                {file.aiIndexed && (
                                                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-normal shrink-0">
                                                        AI
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-normal mt-0.5">
                                                {file.ownerDepartmentName && (
                                                    <span>{file.ownerDepartmentName}</span>
                                                )}
                                                {file.size && <span>• {file.size}</span>}
                                                {file.updatedAt && <span>• {file.updatedAt}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-slate-300 bg-white'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer gọn gàng */}
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs shrink-0">
                    <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                        {selectedFileObj ? `Đã chọn: ${selectedFileObj.name}` : 'Chưa chọn file'}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 font-normal text-xs transition"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!tempSelectedId}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
