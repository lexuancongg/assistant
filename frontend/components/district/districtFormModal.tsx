'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import OptionSelect from '../item/optionSelect';
import { DistrictCreateRequest, DistrictField, DistrictResponse } from '@/models/district/district';
import countryService from '@/services/country/countryService';
import provinceService from '@/services/province/provinceService';

type Option = {
  id: number;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DistrictCreateRequest) => void;
  defaultValues?: DistrictResponse;
  loading?: boolean;
};

export default function DistrictFormModal({
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
    watch,
    formState: { errors },
  } = useForm<DistrictField>();

  const [countries, setCountries] = useState<Option[]>([]);
  const [provinces, setProvinces] = useState<Option[]>([]);

  const countryId = watch('countryId');

  useEffect(() => {
    if (!open) return;

    const fetchCountries = async () => {
      try {
        const res = await countryService.getCountries();
        setCountries(res);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCountries();
  }, [open]);

  
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!countryId) {
        setProvinces([]);
        return;
      }

      try {
        const res = await provinceService.getProvinces(0, '', countryId);
        setProvinces(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProvinces();
  }, [countryId]);

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset({
          name: defaultValues.name,
          provinceId: defaultValues.provinceId,
          countryId: defaultValues.countryId,
        });
      } else {
        reset({
          name: '',
          provinceId: undefined,
          countryId: undefined,
        });
      }
    }
  }, [open, defaultValues, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[400px] rounded-2xl p-6 space-y-4 shadow-lg">
        <h2 className="text-xl font-semibold">
          {defaultValues ? 'Update District' : 'Create District'}
        </h2>

        {/* Name */}
        <input
          {...register('name', { required: 'District name is required' })}
          placeholder="Enter district name..."
          className="w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}

        {/* Country */}
        <OptionSelect
          register={register}
          fieldName="countryId"
          labelText="Country"
          options={countries}
        />

        {/* Province */}
        <OptionSelect
          register={register}
          fieldName="provinceId"
          labelText="Province"
          options={provinces}
          registerOptions={{ required: 'Province is required' }}
          disabled={!countryId}
        />
        {errors.provinceId && (
          <p className="text-red-500 text-sm">{errors.provinceId.message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit((data) =>
              onSubmit({
                name: data.name,
                provinceId: Number(data.provinceId),
              })
            )}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {defaultValues ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}