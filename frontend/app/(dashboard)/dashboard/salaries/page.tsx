'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SalaryDetailResponse } from '@/models/salary/salary';
import { Branch } from '@/models/branch/branch';
import { DepartmentResponse } from '@/models/department/department';
import { Position } from '@/models/positions/position';
import { PageResponse } from '@/models/page/pageResponse';
import branchService from '@/services/branch/branchService';
import departmentService from '@/services/department/departmentService';
import positionService from '@/services/positions/positionService';
import Pagination from '@/components/pagination/pagination';
import Link from 'next/link';
import { PencilIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import salaryService from '@/services/salary/salaryService';

export default function SalaryPage() {
    const [salaries, setSalaries] = useState<SalaryDetailResponse[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    const [keyword, setKeyword] = useState('');
    const [email, setEmail] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>();
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
    const [selectedPosition, setSelectedPosition] = useState<number | undefined>();
    const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchSalaries = useCallback(async () => {
        setLoading(true);
        try {
            const res: PageResponse<SalaryDetailResponse> = await salaryService.getSalaries({
                keyword,
                email,
                branchId: selectedBranch,
                departmentId: selectedDepartment,
                positionId: selectedPosition,
                active: activeFilter,
                page: pageIndex,
                size: pageSize,
            });
            setSalaries(res.data);
            setTotalPages(res.totalPages);
        } catch (err) {
            console.error('Fetch salaries error:', err);
        } finally {
            setLoading(false);
        }
    }, [keyword, email, selectedBranch, selectedDepartment, selectedPosition, activeFilter, pageIndex, pageSize]);

    useEffect(() => { fetchSalaries(); }, [fetchSalaries]);

    useEffect(() => {
        if (!selectedBranch) { setDepartments([]); return; }
        departmentService.getDepartmentByBranch(selectedBranch)
            .then(res => setDepartments(res))
            .catch(console.error);
    }, [selectedBranch]);

    useEffect(() => {
        positionService.getPositionAlls().then(res => setPositions(res)).catch(console.error);
        branchService.getAllBranch().then(res => setBranches(res)).catch(console.error);
    }, []);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const selectClass = "border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none";
    const inputClass = "border border-gray-200 px-3 py-2 rounded-xl text-sm bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none";

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Salary Config</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage base salary configurations per employee</p>
                </div>
                <Link href="/dashboard/salaries/create">
                    <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all text-sm font-medium">
                        <PlusIcon className="w-4 h-4" />
                        Add Salary Config
                    </button>
                </Link>
            </div>

            {/* ── Filters ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Name */}
                    <input
                        placeholder="Search by name..."
                        className={`${inputClass} min-w-[180px] flex-1`}
                        onChange={(e) => {
                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                            const value = e.target.value;
                            searchTimeoutRef.current = setTimeout(() => {
                                setKeyword(value);
                                setPageIndex(0);
                            }, 500);
                        }}
                    />

                    {/* Email */}
                    <input
                        placeholder="Search by email..."
                        className={`${inputClass} min-w-[180px] flex-1`}
                        onChange={(e) => {
                            if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
                            const value = e.target.value;
                            emailTimeoutRef.current = setTimeout(() => {
                                setEmail(value);
                                setPageIndex(0);
                            }, 500);
                        }}
                    />

                    {/* Branch */}
                    <select
                        value={selectedBranch ?? ''}
                        onChange={(e) => {
                            setSelectedBranch(e.target.value ? Number(e.target.value) : undefined);
                            setSelectedDepartment(undefined);
                            setPageIndex(0);
                        }}
                        className={selectClass}
                    >
                        <option value="">All branches</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    {/* Department */}
                    <select
                        value={selectedDepartment ?? ''}
                        onChange={(e) => {
                            setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined);
                            setPageIndex(0);
                        }}
                        className={selectClass}
                        disabled={!selectedBranch}
                    >
                        <option value="">All departments</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    {/* Position */}
                    <select
                        value={selectedPosition ?? ''}
                        onChange={(e) => {
                            setSelectedPosition(e.target.value ? Number(e.target.value) : undefined);
                            setPageIndex(0);
                        }}
                        className={selectClass}
                    >
                        <option value="">All positions</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    {/* Active */}
                    {/* <select
                        value={activeFilter === undefined ? '' : String(activeFilter)}
                        onChange={(e) => {
                            setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true');
                            setPageIndex(0);
                        }}
                        className={selectClass}
                    >
                        <option value="">All status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select> */}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-gray-700">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                            {['STT', 'Employee', 'Position', 'Department', 'Branch',
                                'Base Salary', 'Allowance', 'Effective Date', 'Status', 'Actions'].map((h, i) => (
                                    <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                                ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : salaries.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-10 text-center text-gray-400">No salary configs found</td>
                            </tr>
                        ) : (
                            salaries.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{pageIndex * pageSize + idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{s.employeeName}</div>
                                        <div className="text-xs text-gray-400">{s.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{s.positionName}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.departmentName}</td>
                                    <td className="px-4 py-3 text-gray-600">{s.branchName}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(s.baseSalary)}</td>
                                    <td className="px-4 py-3 text-gray-600">{formatCurrency(s.allowance)}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{s.effectiveDate}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${s.active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {s.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/salaries/${s.id}/edit`}>
                                                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition">
                                                    <PencilIcon className="w-4 h-4 text-indigo-600" />
                                                </button>
                                            </Link>
                                            <Link href={`/dashboard/salaries/employees/${s.employeeId}`}>
                                                <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition">
                                                    <EyeIcon className="w-4 h-4 text-indigo-600" />
                                                </button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ── */}
            <Pagination
                pageIndex={pageIndex}
                totalPages={totalPages}
                onPrev={() => setPageIndex(prev => prev - 1)}
                onNext={() => setPageIndex(prev => prev + 1)}
            />
        </div>
    );
}