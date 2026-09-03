interface StatCardProps {
    label: string;
    value: string;
    delta: string;
}

export default function StatCard({ label, value, delta }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-green-600 mt-1.5">{delta}</p>
        </div>
    );
}
