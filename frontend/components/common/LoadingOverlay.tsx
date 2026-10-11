'use client';

import React, { useEffect, useState, useRef } from 'react';
import RandomEnterpriseLoader from './RandomEnterpriseLoader';

interface LoadingOverlayProps {
    isLoading: boolean;
    text?: string;
    subtext?: string;
    delayMs?: number;
    minDisplayMs?: number;
}

export default function LoadingOverlay({
    isLoading,
    text,
    subtext,
    delayMs = 200,
    minDisplayMs = 0
}: LoadingOverlayProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const showStartRef = useRef<number>(0);
    const openTimerRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isLoading) {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            setIsFadingOut(false);

            if (!shouldRender && !openTimerRef.current) {
                openTimerRef.current = setTimeout(() => {
                    setShouldRender(true);
                    showStartRef.current = Date.now();
                    openTimerRef.current = null;
                }, delayMs);
            }
        } else {
            if (openTimerRef.current) {
                clearTimeout(openTimerRef.current);
                openTimerRef.current = null;
            }

            if (!shouldRender) return;

            const elapsed = Date.now() - showStartRef.current;
            const remaining = Math.max(0, minDisplayMs - elapsed);

            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

            if (remaining <= 0) {
                setShouldRender(false);
                setIsFadingOut(false);
            } else {
                closeTimerRef.current = setTimeout(() => {
                    setIsFadingOut(true);
                    setTimeout(() => {
                        setShouldRender(false);
                        setIsFadingOut(false);
                    }, 100);
                    closeTimerRef.current = null;
                }, remaining);
            }
        }

        return () => {
            if (openTimerRef.current) clearTimeout(openTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, [isLoading, shouldRender, delayMs, minDisplayMs]);

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-[2px] transition-opacity duration-200 p-4 pointer-events-auto ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            <RandomEnterpriseLoader theme="light" text={text} subtext={subtext} />
            {text && (
                <p className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}
