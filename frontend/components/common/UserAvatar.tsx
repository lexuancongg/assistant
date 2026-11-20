'use client';

import React, { useState, useEffect } from 'react';

// Google Material style consistent avatar color palette
const GOOGLE_AVATAR_PALETTE = [
    'bg-[#0b57d0] text-white', // Google Blue
    'bg-[#1e8e3e] text-white', // Google Green
    'bg-[#d93025] text-white', // Google Red
    'bg-[#e37400] text-white', // Google Amber / Orange
    'bg-[#9334e6] text-white', // Google Purple
    'bg-[#129eaf] text-white', // Google Teal
    'bg-[#e52592] text-white', // Google Pink
    'bg-[#5f6368] text-white', // Google Slate
];

export function getConsistentAvatarColor(identifier?: string): string {
    if (!identifier || identifier === 'tôi' || identifier.toLowerCase() === 'me') {
        return 'bg-[#0b57d0] text-white'; // Current user always has Google signature Blue
    }
    let hash = 0;
    const str = identifier.trim().toLowerCase();
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GOOGLE_AVATAR_PALETTE.length;
    return GOOGLE_AVATAR_PALETTE[index];
}

export interface UserAvatarProps {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
    isCurrentUser?: boolean;
    userId?: string | number;
    size?: 'xs' | 'sm' | 'md' | 'base' | 'lg' | 'xl' | '2xl';
    className?: string;
    title?: string;
}

const SIZE_CLASSES = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-6 h-6 text-[10px]',
    base: 'w-7 h-7 text-[11px]',
    lg: 'w-8 h-8 text-[12px]',
    xl: 'w-10 h-10 text-[14px]',
    '2xl': 'w-12 h-12 text-[16px]',
};

export default function UserAvatar({
    name,
    email,
    avatarUrl: propAvatarUrl,
    isCurrentUser = false,
    userId,
    size = 'sm',
    className = '',
    title,
}: UserAvatarProps) {
    const [cachedUser, setCachedUser] = useState<{ avatarUrl?: string; name?: string; email?: string } | null>(null);
    const [imgFailed, setImgFailed] = useState(false);

    // Sync current logged in user's info from localStorage
    useEffect(() => {
        const loadCurrentUser = () => {
            try {
                if (typeof window !== 'undefined') {
                    const stored = window.localStorage.getItem('user');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setCachedUser({
                            avatarUrl: parsed.avatarUrl || '',
                            name: parsed.name || '',
                            email: parsed.email || ''
                        });
                    }
                }
            } catch (err) {
                // ignore storage error
            }
        };

        loadCurrentUser();
        window.addEventListener('user-profile-updated', loadCurrentUser);
        window.addEventListener('storage', loadCurrentUser);
        return () => {
            window.removeEventListener('user-profile-updated', loadCurrentUser);
            window.removeEventListener('storage', loadCurrentUser);
        };
    }, []);

    // Check if this avatar corresponds to the current user
    const isMe =
        isCurrentUser ||
        name === 'tôi' ||
        name?.toLowerCase() === 'tôi' ||
        name?.toLowerCase() === 'me' ||
        Boolean(email && cachedUser?.email && email.trim().toLowerCase() === cachedUser.email.trim().toLowerCase());

    // Effective avatar URL: prop passed directly OR fallback to cached current user avatar if isMe
    const effectiveAvatarUrl = (!imgFailed && (propAvatarUrl || (isMe && cachedUser?.avatarUrl ? cachedUser.avatarUrl : null))) || null;

    // Display initial calculation
    let initial = '?';
    if (isMe) {
        if (name && name !== 'tôi' && name.toLowerCase() !== 'me') {
            initial = name.trim().charAt(0).toUpperCase();
        } else if (cachedUser?.name) {
            initial = cachedUser.name.trim().charAt(0).toUpperCase();
        } else {
            initial = 'T';
        }
    } else if (name) {
        initial = name.trim().charAt(0).toUpperCase();
    } else if (email) {
        initial = email.trim().charAt(0).toUpperCase();
    }

    const colorClass = isMe
        ? 'bg-[#0b57d0] text-white'
        : getConsistentAvatarColor(name || email || initial);

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
    const tooltipTitle = title || (isMe ? (cachedUser?.name || 'Tôi') : (name || email || 'Người dùng'));

    if (effectiveAvatarUrl) {
        return (
            <div
                className={`rounded-full shrink-0 overflow-hidden select-none bg-slate-100 dark:bg-slate-800 ${sizeClass} ${className}`}
                title={tooltipTitle}
            >
                <img
                    src={effectiveAvatarUrl}
                    alt={name || 'Avatar'}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
        );
    }

    return (
        <div
            className={`rounded-full font-medium flex items-center justify-center shrink-0 select-none shadow-2xs ${sizeClass} ${colorClass} ${className}`}
            title={tooltipTitle}
        >
            <span className="leading-none">{initial}</span>
        </div>
    );
}
