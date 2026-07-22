'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import salaryService from '@/services/salary/salaryService';
import { SalaryDetailResponse, SalaryCreateRequest } from '@/models/salary/salary';

export default function SalaryRevisePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [salary, setSalary] = useState<SalaryDetailResponse | null>(null);

  const [form, setForm] = useState<Omit<SalaryCreateRequest, 'employeeId'>>({
    baseSalary: 0,
    allowance: 0,
    effectiveDate: '',
    note: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SalaryCreateRequest, string>>>({});

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await salaryService.getById(Number(id));
        setSalary(res);
        setForm({
          baseSalary: res.baseSalary,
          allowance: res.allowance,
          effectiveDate: new Date().toISOString().split('T')[0],
          note: '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.baseSalary || form.baseSalary <= 0) newErrors.baseSalary = 'Base salary must be greater than 0';
    if (!form.effectiveDate) newErrors.effectiveDate = 'Effective date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!salary || !validate()) return;
    setSubmitting(true);
    try {
      const payload: SalaryCreateRequest = {
        ...form,
        employeeId: salary.employeeId,
      };
      await salaryService.createSalary(payload);
      router.push('/dashboard/salaries');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const base = Number(form.baseSalary) || 0;
  const social = base * 0.08;
  const health = base * 0.015;
  const unemployment = base * 0.01;

  const inputClass = (field?: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition
    ${errors[field as keyof typeof errors]
      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400'}`;

  if (loading || !salary) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Revise Salary</h1>
        <p className="text-gray-500 text-sm mt-1">Update salary configuration for this employee</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

        {/* Employee Info Card */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Employee
          </label>
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-bold text-sm">
                {salary.employeeName?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">{salary.employeeName}</p>
              <p className="text-xs text-indigo-500">
                {salary.email} · {salary.positionName} · {salary.departmentName}
              </p>
            </div>
            <span className="ml-auto text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Selected
            </span>
          </div>
        </div>

        {/* Current Salary Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircleIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Current salary:{' '}
            <span className="font-bold">{fmt(salary.baseSalary)}</span>
            {' '}· Allowance:{' '}
            <span className="font-bold">{fmt(salary.allowance)}</span>
          </p>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Salary Fields */}
        <div className="grid grid-cols-2 gap-4">
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
            {errors.baseSalary && (
              <p className="text-xs text-red-500 mt-1">{errors.baseSalary}</p>
            )}
          </div>

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
            {errors.effectiveDate && (
              <p className="text-xs text-red-500 mt-1">{errors.effectiveDate}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Note
            </label>
            <input
              type="text"
              className={inputClass()}
              placeholder="e.g. Annual raise"
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
            />
          </div>
        </div>

        {/* Insurance Preview */}
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
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-lg border border-gray-200 px-3 py-2.5 text-center"
                >
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(item.value)}</p>
                  <p className="text-[10px] text-indigo-400">{item.rate} of base</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
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
          {submitting && (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {submitting ? 'Saving...' : 'Save New Salary'}
        </button>
      </div>
    </div>
  );
}