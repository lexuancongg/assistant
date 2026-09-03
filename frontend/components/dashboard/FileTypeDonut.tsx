'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FILE_TYPE_BREAKDOWN } from '@/lib/fake-data';

export default function FileTypeDonut() {
    const total = FILE_TYPE_BREAKDOWN.reduce((sum, d) => sum + d.value, 0) * 12.48; // fake total files match dashboard stat

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Phân loại tài liệu</h3>
            <div className="flex items-center gap-4">
                <div className="relative w-36 h-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={FILE_TYPE_BREAKDOWN}
                                dataKey="value"
                                nameKey="label"
                                innerRadius={38}
                                outerRadius={60}
                                paddingAngle={2}
                                stroke="none"
                            >
                                {FILE_TYPE_BREAKDOWN.map((entry) => (
                                    <Cell key={entry.label} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-900">{Math.round(total).toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    {FILE_TYPE_BREAKDOWN.map((entry) => (
                        <div key={entry.label} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-gray-600">{entry.label}</span>
                            </div>
                            <span className="text-gray-400">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
