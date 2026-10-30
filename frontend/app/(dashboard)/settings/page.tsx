'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePageBreadcrumb } from '@/lib/breadcrumb-context';
import { 
    User, 
    KeyRound, 
    Building2, 
    Camera, 
    Upload, 
    Trash2, 
    Save, 
    Eye, 
    EyeOff, 
    ShieldCheck, 
    CheckCircle2, 
    Loader2, 
    Mail, 
    Building, 
    Calendar 
} from 'lucide-react';
import userService, { UserDto } from '@/services/user/userService';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'password' | 'system';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Profile state
    const [profile, setProfile] = useState<UserDto | null>(null);
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // System settings state (Admin only)
    const [companyName, setCompanyName] = useState('Enterprise AI Assistant');
    const [contactEmail, setContactEmail] = useState('admin@enterprise.ai');
    const [contactPhone, setContactPhone] = useState('0123 456 789');
    const [companyAddress, setCompanyAddress] = useState('Hà Nội, Việt Nam');

    const fileInputRef = useRef<HTMLInputElement>(null);

    usePageBreadcrumb(['Cài đặt', activeTab === 'profile' ? 'Thông tin cá nhân' : activeTab === 'password' ? 'Đổi mật khẩu' : 'Cài đặt hệ thống']);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getProfile();
            setProfile(data);
            setName(data.name || '');
            setAvatarUrl(data.avatarUrl || '');

            // Sync with localStorage
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : {};
                const updated = {
                    ...parsed,
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    avatarUrl: data.avatarUrl || ''
                };
                window.localStorage.setItem('user', JSON.stringify(updated));
                window.dispatchEvent(new Event('user-profile-updated'));
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Fallback from localStorage
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setProfile({
                            id: parsed.id,
                            name: parsed.name || '',
                            email: parsed.email || '',
                            role: parsed.role || 'USER',
                            status: 'ACTIVE',
                            avatarInitial: (parsed.name || 'U')[0].toUpperCase(),
                            avatarUrl: parsed.avatarUrl || ''
                        });
                        setName(parsed.name || '');
                        setAvatarUrl(parsed.avatarUrl || '');
                    } catch (e) {}
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Họ và tên không được để trống');
            return;
        }

        setIsSavingProfile(true);
        try {
            const updated = await userService.updateProfile({ name: name.trim(), avatarUrl });
            setProfile(updated);
            setName(updated.name);
            setAvatarUrl(updated.avatarUrl || '');

            // Sync with localStorage
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : {};
                const updatedObj = {
                    ...parsed,
                    name: updated.name,
                    avatarUrl: updated.avatarUrl || ''
                };
                window.localStorage.setItem('user', JSON.stringify(updatedObj));
                window.dispatchEvent(new Event('user-profile-updated'));
            }

            toast.success('Cập nhật thông tin cá nhân thành công!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Không thể cập nhật thông tin. Vui lòng thử lại!');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)');
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Dung lượng ảnh tối đa là 5MB');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const res = await userService.uploadAvatar(file);
            setAvatarUrl(res.avatarUrl);

            // Update in localStorage
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : {};
                parsed.avatarUrl = res.avatarUrl;
                window.localStorage.setItem('user', JSON.stringify(parsed));
                window.dispatchEvent(new Event('user-profile-updated'));
            }

            toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            toast.error('Tải ảnh đại diện thất bại. Vui lòng thử lại!');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAvatar = async () => {
        setIsUploadingAvatar(true);
        try {
            await userService.updateProfile({ name, avatarUrl: '' });
            setAvatarUrl('');

            // Update in localStorage
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem('user');
                const parsed = stored ? JSON.parse(stored) : {};
                parsed.avatarUrl = '';
                window.localStorage.setItem('user', JSON.stringify(parsed));
                window.dispatchEvent(new Event('user-profile-updated'));
            }

            toast.success('Đã gỡ ảnh đại diện');
        } catch (error) {
            toast.error('Không thể gỡ ảnh đại diện');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsChangingPassword(true);
        try {
            await userService.changePassword({
                currentPassword,
                newPassword,
                confirmPassword
            });
            toast.success('Đổi mật khẩu thành công!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'ROLE_ADMIN';
    const initial = name ? name.trim().split(' ').slice(-1)[0][0].toUpperCase() : 'U';

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#F8FAFD] dark:bg-slate-950 px-6 py-6 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#1F1F1F] dark:text-slate-100 tracking-tight">
                        Cài đặt tài khoản
                    </h1>
                    <p className="text-sm text-[#747775] dark:text-slate-400 mt-1">
                        Quản lý hồ sơ cá nhân, ảnh đại diện và bảo mật tài khoản
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Navigation Tabs (Google Drive clean capsule style) */}
                    <div className="w-full md:w-60 shrink-0">
                        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-2 shadow-xs flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800'
                                }`}
                            >
                                <User className="w-4.5 h-4.5 shrink-0 stroke-[1.8]" />
                                <span>Thông tin cá nhân</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('password')}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left cursor-pointer ${
                                    activeTab === 'password'
                                        ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-900/40 dark:text-blue-300'
                                        : 'text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800'
                                }`}
                            >
                                <KeyRound className="w-4.5 h-4.5 shrink-0 stroke-[1.8]" />
                                <span>Đổi mật khẩu</span>
                            </button>

                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('system')}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors text-left cursor-pointer ${
                                        activeTab === 'system'
                                            ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-blue-900/40 dark:text-blue-300'
                                            : 'text-[#444746] dark:text-slate-300 hover:bg-[#F0F4F9] dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Building2 className="w-4.5 h-4.5 shrink-0 stroke-[1.8]" />
                                    <span>Cài đặt hệ thống</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {isLoading ? (
                            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-12 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1A73E8]" />
                                <span className="text-sm text-[#747775] dark:text-slate-400 mt-3 font-normal">Đang tải thông tin...</span>
                            </div>
                        ) : activeTab === 'profile' ? (
                            <div className="space-y-6">
                                {/* 1. Avatar Card */}
                                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-6 shadow-xs">
                                    <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100 mb-1">
                                        Ảnh đại diện
                                    </h2>
                                    <p className="text-xs text-[#747775] dark:text-slate-400 mb-5">
                                        Ảnh đại diện sẽ hiển thị trên thanh công cụ và các tương tác trong hệ thống
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                        {/* Avatar Preview */}
                                        <div className="relative group shrink-0">
                                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#E0E2EC] dark:ring-slate-700 bg-gradient-to-tr from-[#1a73e8] to-[#0b57d0] text-white flex items-center justify-center font-bold text-3xl shadow-md">
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt={name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{initial}</span>
                                                )}
                                            </div>

                                            {/* Quick Camera Overlay Button */}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingAvatar}
                                                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                                title="Tải ảnh mới"
                                            >
                                                <Camera className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Upload controls */}
                                        <div className="flex flex-col justify-center gap-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleAvatarSelect}
                                                    accept="image/png,image/jpeg,image/webp"
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploadingAvatar}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#1A73E8] text-white hover:bg-blue-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                                >
                                                    {isUploadingAvatar ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>Tải ảnh mới lên</span>
                                                </button>

                                                {avatarUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveAvatar}
                                                        disabled={isUploadingAvatar}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Gỡ ảnh</span>
                                                    </button>
                                                )}
                                            </div>

                                            <p className="text-[11.5px] text-[#747775] dark:text-slate-400">
                                                Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Personal Information Card */}
                                <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-6 shadow-xs">
                                    <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100 mb-1">
                                        Thông tin cơ bản
                                    </h2>
                                    <p className="text-xs text-[#747775] dark:text-slate-400 mb-5">
                                        Cập nhật tên hiển thị và xem chi tiết phân quyền tài khoản của bạn
                                    </p>

                                    <form onSubmit={handleSaveProfile} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                                Họ và tên
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full max-w-lg px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                                placeholder="Nhập họ và tên của bạn"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                                Địa chỉ Email
                                            </label>
                                            <div className="relative max-w-lg">
                                                <input
                                                    type="email"
                                                    value={profile?.email || ''}
                                                    disabled
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0E2EC] dark:border-slate-800 bg-[#F0F4F9]/60 dark:bg-slate-800/40 text-sm text-[#747775] dark:text-slate-400 cursor-not-allowed font-normal"
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[#747775] dark:text-slate-400">
                                                    Không thể thay đổi
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-1">
                                            <div>
                                                <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                                    Phòng ban
                                                </label>
                                                <div className="px-3.5 py-2 rounded-xl bg-[#F0F4F9] dark:bg-slate-800/60 border border-[#E0E2EC] dark:border-slate-800 text-xs text-[#1F1F1F] dark:text-slate-200 flex items-center gap-2">
                                                    <Building className="w-3.5 h-3.5 text-[#1A73E8]" />
                                                    <span>{profile?.departmentName || 'Chung'}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                                    Vai trò hệ thống
                                                </label>
                                                <div className="px-3.5 py-2 rounded-xl bg-[#F0F4F9] dark:bg-slate-800/60 border border-[#E0E2EC] dark:border-slate-800 text-xs flex items-center gap-2">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-[#1A73E8]" />
                                                    <span className="font-medium text-[#1A73E8]">
                                                        {isAdmin ? 'Quản trị viên (ADMIN)' : 'Người dùng (USER)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3">
                                            <button
                                                type="submit"
                                                disabled={isSavingProfile}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-[#1A73E8] text-white hover:bg-blue-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                            >
                                                {isSavingProfile ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="w-3.5 h-3.5" />
                                                )}
                                                <span>Lưu thay đổi</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : activeTab === 'password' ? (
                            /* 3. Change Password Card */
                            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-6 shadow-xs max-w-xl">
                                <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100 mb-1">
                                    Đổi mật khẩu
                                </h2>
                                <p className="text-xs text-[#747775] dark:text-slate-400 mb-6">
                                    Để bảo mật tài khoản, hãy sử dụng mật khẩu mạnh có tối thiểu 6 ký tự
                                </p>

                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Mật khẩu hiện tại
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPass ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                                placeholder="Nhập mật khẩu hiện tại"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPass ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                                placeholder="Tối thiểu 6 ký tự"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPass(!showNewPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPass ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-normal"
                                                placeholder="Nhập lại mật khẩu mới"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-3">
                                        <button
                                            type="submit"
                                            disabled={isChangingPassword}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-[#1A73E8] text-white hover:bg-blue-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                                        >
                                            {isChangingPassword ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <KeyRound className="w-3.5 h-3.5" />
                                            )}
                                            <span>Cập nhật mật khẩu</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            /* 4. System Settings (Admin only) */
                            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E2EC] dark:border-slate-800 p-6 shadow-xs max-w-xl">
                                <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-slate-100 mb-1">
                                    Cài đặt hệ thống
                                </h2>
                                <p className="text-xs text-[#747775] dark:text-slate-400 mb-6">
                                    Cấu hình thông tin cơ bản cho tổ chức và doanh nghiệp
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Tên tổ chức / Doanh nghiệp
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Email liên hệ chính
                                        </label>
                                        <input
                                            type="email"
                                            value={contactEmail}
                                            onChange={(e) => setContactEmail(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Số điện thoại hotline
                                        </label>
                                        <input
                                            type="text"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[#444746] dark:text-slate-300 mb-1.5">
                                            Địa chỉ trụ sở
                                        </label>
                                        <input
                                            type="text"
                                            value={companyAddress}
                                            onChange={(e) => setCompanyAddress(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#C4C7C5] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#1F1F1F] dark:text-slate-100 outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>

                                    <div className="pt-3">
                                        <button
                                            type="button"
                                            onClick={() => toast.success('Đã lưu cấu hình hệ thống!')}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-[#1A73E8] text-white hover:bg-blue-600 transition-colors shadow-xs cursor-pointer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            <span>Lưu cấu hình</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
