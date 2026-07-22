type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data:ProvinceCreateRequest) => void;
    defaultValues?: ProvinceResponse;
    loading?: boolean;
    countries:CountryResponse[]
};

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import OptionSelect from '../item/optionSelect';
import { CountryResponse } from '@/models/country/countryResponse';

export default function ProvinceFormModal({
    open,
    onClose,
    onSubmit,
    defaultValues,
    loading,
    countries
}: Props) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProvinceCreateRequest>({
        defaultValues,
    });

    useEffect(() => {
        if (open) {
            reset(defaultValues || { name: '' });
        }
    }, [open, defaultValues, reset]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[400px] rounded-2xl p-6 space-y-4 shadow-lg">
                <h2 className="text-xl font-semibold">
                    {defaultValues ? 'Update Position' : 'Create Position'}
                </h2>

                <input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Enter province name..."
                    className="w-full border px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                />
               

                {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
                 <OptionSelect
                    register={register}
                    fieldName='countryId'
                    labelText='country'
                    options={countries}
                    defaultValue={defaultValues?.countryId}

                >

                </OptionSelect>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-xl"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit(onSubmit)}
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