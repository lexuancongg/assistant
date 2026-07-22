'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, CheckIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { EmployeeResponse } from '@/models/employee/employee';
import employeeService from '@/services/employee/employeeService';
import salaryService from '@/services/salary/salaryService';
import { SalaryCreateRequest } from '@/models/salary/salary';

export default function CreateSalaryPage() {
    const router = useRouter();

    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<EmployeeResponse[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const [form, setForm] = useState<Omit<SalaryCreateRequest, 'employeeId'>>({
        baseSalary: 0,
        allowance: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        note: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof SalaryCreateRequest, string>>>({});

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced employee search
    const handleSearchChange = useCallback((value: string) => {
        setSearchKeyword(value);
        setShowDropdown(true);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!value.trim()) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await employeeService.getEmployeeBySearch(value);
                setSearchResults(res);
            } catch (e) {
                console.error(e);
            } finally {
                setSearching(false);
            }
        }, 400);
    }, []);

    const handleSelectEmployee = (emp: EmployeeResponse) => {
        setSelectedEmployee(emp);
        setSearchKeyword(emp.name);
        setShowDropdown(false);
        setErrors(prev => ({ ...prev, employeeId: undefined }));
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setSearchKeyword('');
        setSearchResults([]);
    };

    const handleChange = (field: keyof typeof form, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: typeof errors = {};
        if (!selectedEmployee) newErrors.employeeId = 'Please select an employee';
        if (!form.baseSalary || form.baseSalary <= 0) newErrors.baseSalary = 'Base salary must be greater than 0';
        if (!form.effectiveDate) newErrors.effectiveDate = 'Effective date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload: SalaryCreateRequest = {
                ...form,
                employeeId: selectedEmployee!.id,
            };
            await salaryService.createSalary(payload);
            router.push('/dashboard/salaries');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const base = Number(form.baseSalary) || 0;
    const social = base * 0.08;
    const health = base * 0.015;
    const unemployment = base * 0.01;

    const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    const inputClass = (field?: string) =>
        `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition
        ${errors[field as keyof typeof errors]
            ? 'border-red-400 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400'}`;

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1 transition"
                >
                    ← Back
                </button>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add Salary Config</h1>
                <p className="text-gray-500 text-sm mt-1">Set up base salary for an employee</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

                {/* ── Employee Search ── */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Employee <span className="text-red-400">*</span>
                    </label>
                    <div ref={searchRef} className="relative">
                        <div className={`flex items-center border rounded-xl px-3 transition
                            ${errors.employeeId ? 'border-red-400' : 'border-gray-200 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-400'}`}>
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                                placeholder="Search employee by name..."
                                value={searchKeyword}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => searchKeyword && setShowDropdown(true)}
                            />
                            {selectedEmployee && (
                                <button onClick={handleClearEmployee} className="text-gray-400 hover:text-gray-600 transition">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown */}
                        {showDropdown && (
                            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                                {searching ? (
                                    <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                        Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-400">No employees found</div>
                                ) : (
                                    searchResults.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleSelectEmployee(emp)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 transition text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                <UserIcon className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{emp.employeeCode} · {emp.positionName}</p>
                                            </div>
                                            {selectedEmployee?.id === emp.id && (
                                                <CheckIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}

                    {selectedEmployee && (
                        <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-indigo-700" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-900">{selectedEmployee.name}</p>
                                <p className="text-xs text-indigo-500">{selectedEmployee.employeeCode} · {selectedEmployee.departmentName}</p>
                            </div>
                            <span className="ml-auto text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                Selected
                            </span>
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* ── Salary Fields ── */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Base Salary */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Base Salary (VND) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min={0}
                            className={inputClass('baseSalary')}
                            placeholder="e.g. 15000000"
                            value={form.baseSalary || ''}
                            onChange={(e) => handleChange('baseSalary', Number(e.target.value))}
                        />
                        {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary}</p>}
                    </div>

                    {/* Allowance */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Allowance (VND)
                        </label>
                        <input
                            type="number"
                            min={0}
                            className={inputClass('allowance')}
                            placeholder="e.g. 500000"
                            value={form.allowance || ''}
                            onChange={(e) => handleChange('allowance', Number(e.target.value))}
                        />
                    </div>

                    {/* Effective Date */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Effective Date <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            className={inputClass('effectiveDate')}
                            value={form.effectiveDate}
                            onChange={(e) => handleChange('effectiveDate', e.target.value)}
                        />
                        {errors.effectiveDate && <p className="text-xs text-red-500 mt-1">{errors.effectiveDate}</p>}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Note
                        </label>
                        <input
                            type="text"
                            className={inputClass()}
                            placeholder="e.g. Initial salary setup"
                            value={form.note}
                            onChange={(e) => handleChange('note', e.target.value)}
                        />
                    </div>
                </div>

                {base > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                            Auto-calculated Deductions
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Social Insurance', value: social, rate: '8%' },
                                { label: 'Health Insurance', value: health, rate: '1.5%' },
                                { label: 'Unemployment', value: unemployment, rate: '1%' },
                            ].map(item => (
                                <div key={item.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 text-center">
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                                    <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(item.value)}</p>
                                    <p className="text-[10px] text-indigo-400">{item.rate} of base</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2"
                >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {submitting ? 'Saving...' : 'Save Salary Config'}
                </button>
            </div>
        </div>
    );
}