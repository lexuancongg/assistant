'use client';

import { useState } from 'react';
import {
    PlusIcon, EyeIcon, CheckCircleIcon,
    ClockIcon, BanknotesIcon, ChevronRightIcon,
    CalendarDaysIcon, UsersIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

// ── Types ──────────────────────────────────────────────────
type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

interface Payroll {
    id: number;
    month: number;
    year: number;
    status: PayrollStatus;
    paymentDate: string | null;
    totalEmployees: number;
    totalNet: number;
    note: string;
    createdAt: string;
}

// ── Demo Data ──────────────────────────────────────────────
const DEMO_PAYROLLS: Payroll[] = [
    {
        id: 1, month: 3, year: 2025, status: 'PAID',
        paymentDate: '2025-03-30', totalEmployees: 128,
        totalNet: 2_340_000_000, note: 'Tháng 3/2025',
        createdAt: '2025-03-01',
    },
    {
        id: 2, month: 2, year: 2025, status: 'PAID',
        paymentDate: '2025-02-28', totalEmployees: 125,
        totalNet: 2_290_000_000, note: 'Tháng 2/2025',
        createdAt: '2025-02-01',
    },
    {
        id: 3, month: 1, year: 2025, status: 'APPROVED',
        paymentDate: null, totalEmployees: 122,
        totalNet: 2_210_000_000, note: '',
        createdAt: '2025-01-01',
    },
    {
        id: 4, month: 12, year: 2024, status: 'DRAFT',
        paymentDate: null, totalEmployees: 120,
        totalNet: 2_160_000_000, note: 'Đang soạn thảo',
        createdAt: '2024-12-01',
    },
];

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<PayrollStatus, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
    DRAFT: {
        label: 'Draft',
        dot: 'bg-gray-400',
        badge: 'bg-gray-100 text-gray-600',
        icon: <DocumentTextIcon className="w-3.5 h-3.5" />,
    },
    APPROVED: {
        label: 'Approved',
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
    },
    PAID: {
        label: 'Paid',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700',
        icon: <BanknotesIcon className="w-3.5 h-3.5" />,
    },
};

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
    label: string; value: string; sub: string;
    icon: React.ReactNode; color: string;
}) {
    return (
        <div className={`rounded-2xl p-5 ${color} flex items-start gap-4`}>
            <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold mt-0.5">{value}</p>
                <p className="text-xs opacity-70 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

// ── Payroll Row Card ───────────────────────────────────────
function PayrollCard({ p, onView }: { p: Payroll; onView: (p: Payroll) => void }) {
    const cfg = STATUS_CONFIG[p.status];
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-5 flex items-center gap-5">
            {/* Month badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-md shadow-indigo-200">
                <span className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">
                    {MONTH_NAMES[p.month].slice(0, 3)}
                </span>
                <span className="text-2xl font-black leading-tight">{p.month < 10 ? `0${p.month}` : p.month}</span>
                <span className="text-[10px] opacity-70">{p.year}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">
                        Payroll {MONTH_NAMES[p.month]} {p.year}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        {p.totalEmployees} employees
                    </span>
                    {p.paymentDate && (
                        <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            Paid {p.paymentDate}
                        </span>
                    )}
                    {p.note && (
                        <span className="italic text-gray-400 truncate max-w-[160px]">{p.note}</span>
                    )}
                </div>
            </div>

            {/* Net total */}
            <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Total Net</p>
                <p className="text-base font-extrabold text-gray-900">{fmt(p.totalNet)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {p.status === 'DRAFT' && (
                    <button className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition">
                        Edit
                    </button>
                )}
                {p.status === 'APPROVED' && (
                    <button className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1">
                        <BanknotesIcon className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                )}
                <button
                    onClick={() => onView(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition"
                >
                    <EyeIcon className="w-4 h-4 text-indigo-600" />
                </button>
                <ChevronRightIcon className="w-4 h-4 text-gray-300" />
            </div>
        </div>
    );
}

// ── Detail Modal ───────────────────────────────────────────
const DEMO_ITEMS = [
    { id: 1, name: 'Nguyen Van A', position: 'Engineer',    base: 20_000_000, allowance: 2_000_000, bonus: 1_000_000, overtime: 500_000, social: 1_600_000, health: 300_000, unemployment: 200_000, tax: 800_000, other: 0,       net: 20_600_000 },
    { id: 2, name: 'Tran Thi B',   position: 'Marketing',   base: 15_000_000, allowance: 1_500_000, bonus: 500_000,   overtime: 0,       social: 1_200_000, health: 225_000, unemployment: 150_000, tax: 500_000, other: 0,       net: 14_925_000 },
    { id: 3, name: 'Le Van C',     position: 'Sales',       base: 12_000_000, allowance: 1_000_000, bonus: 2_000_000, overtime: 300_000, social: 960_000,   health: 180_000, unemployment: 120_000, tax: 400_000, other: 100_000, net: 13_540_000 },
    { id: 4, name: 'Pham Thi D',   position: 'HR',          base: 13_000_000, allowance: 1_200_000, bonus: 0,         overtime: 0,       social: 1_040_000, health: 195_000, unemployment: 130_000, tax: 420_000, other: 0,       net: 12_415_000 },
    { id: 5, name: 'Hoang Van E',  position: 'Finance',     base: 18_000_000, allowance: 1_800_000, bonus: 500_000,   overtime: 200_000, social: 1_440_000, health: 270_000, unemployment: 180_000, tax: 700_000, other: 0,       net: 17_910_000 },
];

function DetailModal({ payroll, onClose }: { payroll: Payroll; onClose: () => void }) {
    const cfg = STATUS_CONFIG[payroll.status];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">Payroll Detail</p>
                        <h2 className="text-white text-xl font-extrabold">
                            {MONTH_NAMES[payroll.month]} {payroll.year}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                            {cfg.icon} {cfg.label}
                        </span>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100">
                    {[
                        { label: 'Total Employees', value: `${payroll.totalEmployees}` },
                        { label: 'Total Net Salary', value: fmt(payroll.totalNet) },
                        { label: 'Payment Date', value: payroll.paymentDate ?? '—' },
                    ].map((item) => (
                        <div key={item.label} className="px-6 py-4 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{item.label}</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                                {['#', 'Employee', 'Base', 'Allowance', 'Bonus', 'Overtime',
                                  'Social', 'Health', 'Unemploy.', 'Tax', 'Other', 'Net Salary'].map((h, i) => (
                                    <th key={i} className={`px-4 py-3 font-semibold ${i === 0 ? 'text-left' : i <= 2 ? 'text-left' : 'text-right'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {DEMO_ITEMS.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-400">{item.position}</p>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-700">{fmt(item.base)}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{fmt(item.allowance)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt(item.bonus)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">{fmt(item.overtime)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">{fmt(item.social)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">{fmt(item.health)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">{fmt(item.unemployment)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">{fmt(item.tax)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">{fmt(item.other)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-extrabold text-indigo-700">{fmt(item.net)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
                    <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
                        Close
                    </button>
                    {payroll.status === 'DRAFT' && (
                        <button className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" /> Approve Payroll
                        </button>
                    )}
                    {payroll.status === 'APPROVED' && (
                        <button className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2">
                            <BanknotesIcon className="w-4 h-4" /> Mark as Paid
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────
export default function PayrollPage() {
    const [filter, setFilter] = useState<PayrollStatus | 'ALL'>('ALL');
    const [selected, setSelected] = useState<Payroll | null>(null);

    const filtered = filter === 'ALL'
        ? DEMO_PAYROLLS
        : DEMO_PAYROLLS.filter(p => p.status === filter);

    const totalPaid     = DEMO_PAYROLLS.filter(p => p.status === 'PAID').reduce((s, p) => s + p.totalNet, 0);
    const totalApproved = DEMO_PAYROLLS.filter(p => p.status === 'APPROVED').length;
    const totalDraft    = DEMO_PAYROLLS.filter(p => p.status === 'DRAFT').length;

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payroll</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage monthly payroll for all employees</p>
                </div>
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold">
                    <PlusIcon className="w-4 h-4" />
                    Generate Payroll
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Total Paid This Year"
                    value={fmt(totalPaid)}
                    sub={`${DEMO_PAYROLLS.filter(p => p.status === 'PAID').length} payrolls completed`}
                    icon={<BanknotesIcon className="w-5 h-5 text-emerald-700" />}
                    color="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                />
                <StatCard
                    label="Awaiting Payment"
                    value={`${totalApproved} payroll${totalApproved !== 1 ? 's' : ''}`}
                    sub="Approved, pending transfer"
                    icon={<ClockIcon className="w-5 h-5 text-blue-700" />}
                    color="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                />
                <StatCard
                    label="In Draft"
                    value={`${totalDraft} payroll${totalDraft !== 1 ? 's' : ''}`}
                    sub="Needs review & approval"
                    icon={<DocumentTextIcon className="w-5 h-5 text-amber-700" />}
                    color="bg-gradient-to-br from-amber-400 to-amber-500 text-white"
                />
            </div>

            {/* Filter tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1 w-fit">
                {(['ALL', 'DRAFT', 'APPROVED', 'PAID'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            filter === s
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {s === 'ALL' ? 'All' : STATUS_CONFIG[s].label}
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                            filter === s ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                            {s === 'ALL' ? DEMO_PAYROLLS.length : DEMO_PAYROLLS.filter(p => p.status === s).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Payroll List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                        <BanknotesIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        No payrolls found
                    </div>
                ) : (
                    filtered.map(p => (
                        <PayrollCard key={p.id} p={p} onView={setSelected} />
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <DetailModal payroll={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}
