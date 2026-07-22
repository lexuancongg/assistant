'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import salaryService from '@/services/salary/salaryService';
import { SalaryDetailResponse } from '@/models/salary/salary';

export default function EmployeeSalaryHistoryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [salaries, setSalaries] = useState<SalaryDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const active = salaries.find((s) => s.active);
  const history = salaries.filter((s) => !s.active);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await salaryService.getByEmployeeId(Number(id));
        setSalaries(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const employee = salaries[0];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1 transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Salary History</h1>
        <p className="text-gray-500 text-sm mt-1">Full salary record for this employee</p>
      </div>

      {/* Employee Info */}
      {employee && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 font-bold text-lg">
              {employee.employeeName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{employee.employeeName}</p>
            <p className="text-sm text-gray-500">
              {employee.email} · {employee.positionName} · {employee.departmentName}
            </p>
          </div>
        </div>
      )}

      {/* Active Salary */}
      {active && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Salary</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Base Salary', value: fmt(active.baseSalary) },
                { label: 'Allowance', value: fmt(active.allowance) },
                { label: 'Effective Date', value: active.effectiveDate },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-green-100 px-4 py-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Deductions */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Social Insurance', value: fmt(active.socialInsurance), rate: '8%' },
                { label: 'Health Insurance', value: fmt(active.healthInsurance), rate: '1.5%' },
                { label: 'Unemployment', value: fmt(active.unemploymentInsurance), rate: '1%' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-green-100 px-3 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                  <p className="text-[10px] text-indigo-400">{item.rate} of base</p>
                </div>
              ))}
            </div>

            {active.note && (
              <p className="text-xs text-gray-500 italic">Note: {active.note}</p>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Salary History</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  {['#', 'Base Salary', 'Allowance', 'Social', 'Health', 'Unemployment', 'Effective', 'End Date', 'Note'].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(s.baseSalary)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(s.allowance)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(s.socialInsurance)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(s.healthInsurance)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(s.unemploymentInsurance)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{s.effectiveDate}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{s.endDate ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs italic">{s.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {salaries.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
          <BanknotesIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No salary records found
        </div>
      )}
    </div>
  );
}