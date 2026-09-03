const STATUS_MAP: Record<string, { label: string; className: string }> = {
    done: { label: 'Đã trích xuất', className: 'bg-green-50 text-green-700' },
    processing: { label: 'Đang xử lý', className: 'bg-blue-50 text-blue-700' },
    needs_review: { label: 'Cần review', className: 'bg-amber-50 text-amber-700' },
};

interface RecentActivityTableProps {
    data: Array<{
        id: number | string;
        fileName: string;
        uploader: string;
        status: string;
        time: string;
    }>;
}

export default function RecentActivityTable({ data }: RecentActivityTableProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
            <table className="w-full text-sm">
                <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="font-normal pb-2">Tên file</th>
                    <th className="font-normal pb-2">Người upload</th>
                    <th className="font-normal pb-2">Trạng thái</th>
                    <th className="font-normal pb-2 text-right">Thời gian</th>
                </tr>
                </thead>
                <tbody>
                {data.map((item) => {
                    const status = STATUS_MAP[item.status];
                    return (
                        <tr key={item.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-2.5 text-gray-900">{item.fileName}</td>
                            <td className="py-2.5 text-gray-600">{item.uploader}</td>
                            <td className="py-2.5">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.className}`}>
                                        {status.label}
                                    </span>
                            </td>
                            <td className="py-2.5 text-gray-400 text-right">{item.time}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}