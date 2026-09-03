'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { UPLOAD_TREND } from '@/lib/fake-data';

export default function UploadTrendChart() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">File upload theo thời gian</h3>
            {mounted ? (
                <div style={{ width: '100%', height: 220, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={UPLOAD_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                labelStyle={{ color: '#374151' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[220px] flex items-center justify-center bg-gray-50 rounded-lg text-xs text-gray-400">
                    Đang tải biểu đồ...
                </div>
            )}
        </div>
    );
}
