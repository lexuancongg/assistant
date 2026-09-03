import { FileText, FileSpreadsheet, FileImage, File as FileIcon, LucideIcon } from 'lucide-react';
import type { FileType } from '@/lib/types';

const FILE_ICON_MAP: Record<FileType, { icon: LucideIcon; className: string }> = {
    pdf: { icon: FileText, className: 'text-red-500' },
    xlsx: { icon: FileSpreadsheet, className: 'text-green-600' },
    docx: { icon: FileText, className: 'text-blue-600' },
    pptx: { icon: FileImage, className: 'text-orange-500' },
    txt: { icon: FileIcon, className: 'text-gray-400' },
    image: { icon: FileImage, className: 'text-purple-500' },
};

export default function FileTypeIcon({ type, className = 'w-4 h-4' }: { type: FileType; className?: string }) {
    const entry = FILE_ICON_MAP[type] ?? FILE_ICON_MAP.txt;
    const Icon = entry.icon;
    return <Icon className={`shrink-0 ${entry.className} ${className}`} strokeWidth={2} />;
}
