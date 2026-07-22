'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import {
  BriefcaseIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Position, PositionCreateRequest, PositionField, PositionStatus } from '@/models/positions/position';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PositionField) => void;
  defaultValues?: Position;
  loading?: boolean;
};

export default function PositionFormModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
  loading,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionField>();

  const isEdit = !!defaultValues;

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset({
          code: defaultValues.code,
          name: defaultValues.name,
          description: defaultValues.description,
          levelOrder: defaultValues.level,
          status: defaultValues.status,
        });
      } else {
        reset({
          code: '',
          name: '',
          description: '',
          levelOrder: undefined,
          status:PositionStatus.ACTIVE,
        });
      }
    }
  }, [open, defaultValues, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
           
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Update Position' : 'Create Position'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                {...register('code', { required: 'Code is required' })}
                placeholder="e.g. POS001"
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Level Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register('levelOrder', {
                  required: 'Level order is required',
                  valueAsNumber: true,
                })}
                placeholder="e.g. 1"
                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
              {errors.levelOrder && (
                <p className="text-red-500 text-xs mt-1">{errors.levelOrder.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Position Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter position name..."
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              placeholder="Enter description..."
              rows={3}
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status', { required: 'Status is required' })}
              className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}