import { FileText } from 'lucide-react';
import type { UploadingFile } from '@/lib/types';

export default function UploadProgressRow({ file }: { file: UploadingFile }) {
    const isDone = file.status === 'done';

    return (
        <div className="flex items-center gap-3 py-2.5">
            <div
                className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${
                    isDone ? 'bg-green-50' : 'bg-red-50'
                }`}
            >
                <FileText className={`w-4 h-4 ${isDone ? 'text-green-600' : 'text-red-500'}`} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{file.name}</p>
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${file.progress}%` }}
                    />
                </div>
            </div>
            <span className="text-xs text-gray-400 w-9 text-right shrink-0">{file.progress}%</span>
            <span className="text-xs text-gray-400 w-16 text-right shrink-0">{file.size}</span>
        </div>
    );
}
