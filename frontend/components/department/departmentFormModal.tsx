'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import OptionSelect from '../item/optionSelect';
import { Branch } from '@/models/branch/branch';
import { DepartmentCreateRequest, Department } from '@/models/department/department';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentCreateRequest) => void;
  defaultValues?: Department;
  loading?: boolean;
  branchs: Branch[];
};

export default function DepartmentFormModal({
                                              open,
                                              onClose,
                                              onSubmit,
                                              defaultValues,
                                              loading,
                                              branchs,
                                            }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentCreateRequest>();

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset({
          code: defaultValues.code,
          name: defaultValues.name,
          branchId: defaultValues.branch.id,
          status: defaultValues.status,
          description: defaultValues.description,
        });
      } else {
        reset({
          code: '',
          name: '',
          branchId: undefined,
          status: 'ACTIVE',
          description: '',
        });
      }
    }
  }, [open, defaultValues, reset]);

  if (!open) return null;

  return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {defaultValues ? 'Update Department' : 'Create Department'}
            </h2>
            <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Department Code
              </label>
              <input
                  {...register('code', { required: 'Department code is required' })}
                  placeholder="e.g. IT, HR, FIN..."
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              {errors.code && (
                  <p className="text-red-500 text-xs">{errors.code.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Department Name
              </label>
              <input
                  {...register('name', { required: 'Department name is required' })}
                  placeholder="Enter department name..."
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>

            {/* Branch */}
            <OptionSelect
                register={register}
                fieldName="branchId"
                labelText="Branch"
                placeholder="Select branch..."
                options={branchs}
                registerOptions={{
                  required: "Branch is required",
                }}
                error={errors.branchId?.message}
            />

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select
                  {...register('status', { required: true })}
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">
                Description
              </label>
              <textarea
                  {...register('description')}
                  placeholder="Short description of this department..."
                  rows={3}
                  className="w-full border border-gray-200 px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : defaultValues ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
  );
}