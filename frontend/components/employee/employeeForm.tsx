'use client';

import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import {
    Bars3BottomLeftIcon,
    PhoneIcon,
    BuildingOffice2Icon,
    MapPinIcon,
    UserCircleIcon,
    ArrowUpTrayIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';

import OptionSelect from '../item/optionSelect';
import { EmployeeField, EmployeeDetail, EmployeeStatus } from '@/models/employee/employee';

import countryService from '@/services/country/countryService';
import provinceService from '@/services/province/provinceService';
import districtService from '@/services/district/districtService';
import departmentService from '@/services/department/departmentService';
import positionService from '@/services/positions/positionService';
import branchService from '@/services/branch/branchService';
import jobTitleService from '@/services/jobtitle/jobTitleService';
import imageService from '@/services/auth/image/imageService';
import levelService from '@/services/level/levelService';
import roleService from '@/services/role/roleService';

type Option = {
    id: number;
    name: string;
};

type Props = {
    defaultValue?: EmployeeDetail | null;
    onSubmit: (data: EmployeeField) => void;
    loading?: boolean;
};

const statusDotColor: Record<EmployeeStatus, string> = {
    ACTIVE: 'bg-green-500',
    ONLEAVE: 'bg-orange-500',
    PENDING: 'bg-purple-500',
};

const EmployeeForm: FC<Props> = ({ defaultValue, onSubmit, loading }) => {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<EmployeeField>();

    const [countries, setCountries] = useState<Option[]>([]);
    const [provinces, setProvinces] = useState<Option[]>([]);
    const [districts, setDistricts] = useState<Option[]>([]);
    const [departments, setDepartments] = useState<Option[]>([]);
    const [branchs, setBranchs] = useState<Option[]>([]);
    const [positions, setPositions] = useState<Option[]>([]);
    const [jobTitles, setJobTitles] = useState<Option[]>([]);
    const [levels, setLevels] = useState<Option[]>([]);
    const [roles, setRoles] = useState<Option[]>([]);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const countryId = watch('address.countryId');
    const provinceId = watch('address.provinceId');
    const status = watch('status');
    const branchId = watch("branch.id")
    const departmentId = watch("department.id")

    const isEdit = !!defaultValue;

    const params = useParams();
    const id = params.id;





    // ---------------- Fetch base lists ----------------
    useEffect(() => {
        countryService.getCountries()
            .then(setCountries)
            .catch(console.error);

    }, []);

    // useEffect(()=>{
    //     if(defaultValue){
    //         provinceService.getProvinceByCountry(defaultValue.address.countryId)
    //         .then(setProvinces)
    //         districtService.getDistrictByProvince(defaultValue.address.provinceId)
    //         .then(setDistricts)
    //     }
    // },[id])



    useEffect(() => {
        branchService.getAllBranch()
            .then(setBranchs)
        positionService.getPositionAlls()
            .then(setPositions)
        levelService.getAllLevels()
            .then(setLevels)
        roleService.getAllRoles()
        .then(setRoles)
        
    }, [])




    useEffect(() => {
        if (!countryId) {
            setProvinces([]);
            return;
        }
        provinceService.getProvinces(0, '', countryId).then((res) => setProvinces(res.data)).catch(console.error);
    }, [countryId]);

    useEffect(() => {
        if (!provinceId) {
            setDistricts([]);
            return;
        }
        districtService
            .getDistricts('', 0, countryId, provinceId)
            .then((res) => setDistricts(res.data))
            .catch(console.error);
    }, [provinceId]);

    useEffect(() => {
        if (branchId) {
            departmentService.getDepartmentByBranch(branchId)
                .then(setDepartments)
        }
    }, [branchId])

    useEffect(() => {
        if (departmentId) {
            jobTitleService.getJobtitleByDepartment(departmentId)
                .then(setJobTitles)
        }
    }, [departmentId])






    // ---------------- Populate defaults ----------------
    useEffect(() => {
        if (defaultValue) {
            reset({
                code: defaultValue.code,
                name: defaultValue.name,
                gender: defaultValue.gender,
                birthday: defaultValue.birthday,
                cccd: defaultValue.cccd,
                email: defaultValue.email,
                phone: defaultValue.phone,
                status: defaultValue.status,
                department: { id: defaultValue.department?.id },
                position: { id: defaultValue.position?.id },
                jobTitle: { id: defaultValue.jobTitle?.id },
                level: { id: defaultValue.level?.id },
                hireDate: defaultValue.hireDate,
                address: {
                    countryId: defaultValue.address?.countryId,
                    provinceId: defaultValue.address?.provinceId,
                    districtId: defaultValue.address?.districtId,
                    specificAdress: defaultValue.address?.specificAdress ?? '',
                },
                account: {
                    username: defaultValue.account?.username ?? '',
                    password: '',
                    confirmPassword: '',
                    roleId: defaultValue.account?.roleId,
                },
                branch:{
                    id:defaultValue.branch?.id
                }
            });
            setAvatarPreview(defaultValue.avatarUrl ?? null);
        } else {
            reset({
                code: '',
                name: '',
                gender: '',
                cccd: '',
                email: '',
                phone: '',
                status: 'ACTIVE',
                department: { id: undefined },
                position: { id: undefined },
                jobTitle: { id: undefined },
                level: { id: undefined },
                address: {
                    countryId: undefined,
                    provinceId: undefined,
                    districtId: undefined,
                    specificAdress: '',
                },
                account: {
                    username: '',
                    password: '',
                    confirmPassword: '',
                    roleId: undefined,
                },
            });
            setAvatarPreview(null);
        }
    }, [defaultValue, reset]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append("file", file);

        const response = await imageService.uploadImageToS3(formData)
        setValue("avatarId", response.id)



    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            {/* <div className="text-sm text-gray-400">
        Dashboard <span className="mx-1">›</span>
        Employees <span className="mx-1">›</span>
        <span className="text-gray-700 font-medium">{isEdit ? 'Edit Employee' : 'New Employee'}</span>
      </div> */}

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {isEdit ? 'Update Employee' : 'Create Employee'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isEdit ? 'Edit employee information and organizational details' : 'Add new employee information and organizational details'}
                    </p>
                </div>

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowUpTrayIcon className="w-4 h-4" />
                        )}
                        Save Employee
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Row: Personal Information + Contact Information */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                    {/* 1. Personal Information */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <Bars3BottomLeftIcon className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-semibold text-gray-900">1. Personal Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5">
                            {/* Avatar */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Avatar</label>
                                <label className="flex flex-col items-center justify-center gap-1.5 w-full h-[120px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition overflow-hidden bg-gray-50">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ArrowUpTrayIcon className="w-5 h-5 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-600">Upload Image</span>
                                            <span className="text-[10px] text-gray-400">JPG, PNG (max. 2MB)</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleAvatarChange} />
                                </label>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                            Employee Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('code', { required: 'Code is required' })}
                                            placeholder="e.g. NV0006"
                                            className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                        />
                                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            {...register('name', { required: 'Name is required' })}
                                            placeholder="full name"
                                            className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
                                        <select
                                            {...register('gender', { required: 'gender is required' })}
                                            defaultValue=""
                                            className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                        >
                                            <option value="" disabled>
                                                Select gender
                                            </option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}

                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Birthday</label>
                                        <input
                                            type="date"
                                            {...register('birthday', { required: 'birthday is required' })}
                                            className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                        />
                                        {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday.message}</p>}

                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">CCCD</label>
                                        <input
                                            {...register('cccd', { required: "cccd is required" })}
                                            placeholder="Enter CCCD"
                                            className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                        />
                                        {errors.cccd && <p className="text-red-500 text-xs mt-1">{errors.cccd.message}</p>}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Contact Information */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <PhoneIcon className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-semibold text-gray-900">2. Contact Information</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    {...register('email', { required: 'Email is required' })}
                                    placeholder="example@gmail.com"
                                    className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                                <input
                                    {...register('phone', { required: 'phone is required' })}
                                    placeholder="e.g. 0912345678"
                                    className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}

                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                            <div className="relative">
                                <span
                                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusDotColor[status as EmployeeStatus] ?? 'bg-gray-300'}`}
                                />
                                <select
                                    {...register('status')}
                                    className="w-full border border-gray-200 pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="ONLEAVE">On Leave</option>
                                    <option value="PENDING">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Organization Information */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2">
                        <BuildingOffice2Icon className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">3. Organization Information</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="branch.id"
                                labelText="Branchs"
                                placeholder="Select Branch"
                                options={branchs}
                                registerOptions={{ required: 'Branch is required' }}
                            />
                            {errors.branch?.id && (
                                <p className="text-red-500 text-xs mt-1">{errors.branch.id.message}</p>
                            )}
                        </div>
                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="department.id"
                                labelText="Department"
                                placeholder="Select department"
                                options={departments}
                                registerOptions={{ required: 'Department is required' }}
                            />
                            {errors.department?.id && (
                                <p className="text-red-500 text-xs mt-1">{errors.department.id.message}</p>
                            )}
                        </div>

                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="position.id"
                                labelText="Position"
                                placeholder="Select position"
                                options={positions}
                                registerOptions={{ required: 'Position is required' }}
                            />
                            {errors.position?.id && (
                                <p className="text-red-500 text-xs mt-1">{errors.position.id.message}</p>
                            )}
                        </div>

                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="jobTitle.id"
                                labelText="Job Title"
                                placeholder="Select job title"
                                options={jobTitles}
                                registerOptions={{
                                    required: "job title is required"
                                }}
                                error={errors.jobTitle?.id?.message}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="level.id"
                                labelText="Level"
                                placeholder="Select level"
                                options={levels}
                                registerOptions={{
                                    required: 'level is required'
                                }}
                                error={errors.level?.id?.message}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Hire Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                {...register('hireDate', { required: 'Hire date is required' })}
                                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                            />
                            {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate.message}</p>}
                        </div>
                    </div>
                </div>

                {/* 4. Address */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">4. Address</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="address.countryId"
                                labelText="Country"
                                placeholder="Select country"
                                options={countries}
                                registerOptions={{
                                    required: 'country is required'
                                }}
                                error={errors.address?.countryId?.message}
                            />
                        </div>

                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="address.provinceId"
                                labelText="Province"
                                placeholder="Select province"
                                options={provinces}
                                disabled={!countryId}
                                registerOptions={{
                                    required: 'province is required'
                                }}
                                error={errors.address?.provinceId?.message}
                            />
                            {!countryId && <p className="text-gray-400 text-xs mt-1">Select country first</p>}
                        </div>

                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="address.districtId"
                                labelText="District"
                                placeholder="Select district"
                                options={districts}
                                disabled={!provinceId}
                                registerOptions={{
                                    required: 'district is required'
                                }}
                                error={errors.address?.districtId?.message}
                            />
                            {!provinceId && <p className="text-gray-400 text-xs mt-1">Select province</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Specific Address</label>
                            <input
                                {...register('address.specificAdress')}
                                placeholder="Enter specific address"
                                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Account Information */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                    <div className="flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-semibold text-gray-900">
                            5. Account Information <span className="text-gray-400 font-normal">(Optional)</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
                            <input
                                {...register('account.username', {
                                    required: 'username is required'
                                })}
                                placeholder="Enter username"
                                className="w-full border border-gray-200 px-3.5 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                            />
                            {errors.account?.username && <p className="text-red-500 text-xs mt-1">{errors.account.username.message}</p>}

                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('account.password', {
                                        required: 'password is required'
                                    })}
                                    placeholder="Enter password"
                                    className="w-full border border-gray-200 pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                />
                                {errors.account?.password && <p className="text-red-500 text-xs mt-1">{errors.account.password.message}</p>}

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    {...register('account.confirmPassword', {
                                        required: 'confirm password is require',
                                        validate: (value) =>
                                            value === watch('account.password') || 'Passwords do not match'

                                    })}
                                    placeholder="Confirm password"
                                    className="w-full border border-gray-200 pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
                                />
                                {errors.account?.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.account.confirmPassword.message}</p>}

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <OptionSelect
                                register={register}
                                fieldName="account.roleId"
                                labelText="Role"
                                placeholder="Employee"
                                options={roles}
                                registerOptions={{
                                    required:'role is required'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowUpTrayIcon className="w-4 h-4" />
                        )}
                        Save Employee
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeForm;