export default function ReviewAlertCard({ count }:{count:any}) {
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-amber-800">Documents cần review</p>
                <p className="text-2xl font-semibold text-amber-900 mt-1">{count}</p>
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                Cần xử lý
            </span>
        </div>
    );
}