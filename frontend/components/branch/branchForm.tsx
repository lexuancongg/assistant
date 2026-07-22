'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

import OptionSelect from '../item/optionSelect';
import { BranchField, Branch } from '@/models/branch/branch';
import countryService from '@/services/country/countryService';
import provinceService from '@/services/province/provinceService';
import districtService from '@/services/district/districtService';

type Option = {
  id: number;
  name: string;
};

type Props = {
  onSubmit: (data: BranchField) => void;
  defaultValues: Branch | null;
  loading?: boolean;
};

export default function BranchForm({ onSubmit, defaultValues, loading }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BranchField>();

  const [countries, setCountries] = useState<Option[]>([]);
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);

  const countryId = watch('address.countryId');
  const provinceId = watch('address.provinceId');

  const isEdit = !!defaultValues;

  useEffect(() => {
    const fetchCountries = async () => {
      const res = await countryService.getCountries();
      setCountries(res);
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      if (!countryId) {
        setProvinces([]);
        return;
      }

      const res = await provinceService.getProvinces(0, '', countryId);
      setProvinces(res.data);
    };

    fetchProvinces();
  }, [countryId]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!provinceId) {
        setDistricts([]);
        return;
      }

      const res = await districtService.getDistricts('', 0, countryId, provinceId);
      setDistricts(res.data);
    };

    fetchDistricts();
  }, [provinceId]);

  useEffect(() => {
  if (defaultValues) {
    reset({
      name: defaultValues.name,
      code: defaultValues.code,
      description: defaultValues.description,
      status: defaultValues.status,
      address: {
        specificAddress: defaultValues.address?.specificAddress ?? '',
        countryId: defaultValues.address?.countryId,
        provinceId: defaultValues.address?.provinceId,
        districtId: defaultValues.address?.districtId,
      },
    });
  } else {
    reset({
      name: '',
      code: '',
      description: '',
      address: {
        specificAddress: '',
        countryId: undefined,
        provinceId: undefined,
        districtId: undefined,
      },
    });
  }
}, [defaultValues, reset]);

  return (
    <div className="  mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {isEdit ? 'Update Branch' : 'Create Branch'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Edit existing branch information' : 'Add a new branch to the system'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General info card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <BuildingOffice2Icon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">General Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Branch name is required' })}
                placeholder="Enter branch name..."
                className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Branch Code <span className="text-red-500">*</span>
              </label>
              <input
                {...register('code', { required: 'Branch code is required' })}
                placeholder="Enter branch code..."
                className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea
              {...register('description')}
              placeholder="Enter branch description..."
              rows={3}
              className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition resize-none"
            />
          </div>

          <div className="sm:w-1/2 sm:pr-2.5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register('status', { required: 'Status is required' })}
              className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>



        {/* Address card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <MapPinIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Address</h2>
          </div>

          {/* Row 1: Country - Province */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <OptionSelect
                register={register}
                fieldName="address.countryId"
                labelText="Country"
                options={countries}
                 registerOptions={{ required: 'Country is required' }}
              />
               {errors.address?.countryId && (
                <p className="text-red-500 text-xs mt-1">{errors.address?.countryId.message}</p>
              )}
            </div>

            <div>
              <OptionSelect
                register={register}
                fieldName="address.provinceId"
                labelText="Province"
                options={provinces}
                disabled={!countryId}
                 registerOptions={{ required: 'Province is required' }}
              />
               {errors.address?.provinceId && (
                <p className="text-red-500 text-xs mt-1">{errors.address?.provinceId.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: District - Specific Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <OptionSelect
                register={register}
                fieldName="address.districtId"
                labelText="District"
                options={districts}
                registerOptions={{ required: 'District is required' }}
                disabled={!provinceId}
              />
              {errors.address?.districtId && (
                <p className="text-red-500 text-xs mt-1">{errors.address?.districtId.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Specific Address <span className="text-red-500">*</span>
              </label>
              <input
                {...register('address.specificAddress', { required: 'Specific address is required' })}
                placeholder="House number, street name..."
                className="w-full border border-gray-200 px-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
              {errors.address?.specificAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.address?.specificAddress.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              'Update Branch'
            ) : (
              'Create Branch'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
