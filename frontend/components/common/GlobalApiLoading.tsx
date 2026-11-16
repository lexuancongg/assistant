'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * Enterprise Non-Blocking Global Progress Bar
 * - Xuất hiện ở đỉnh màn hình (top-bar) khi có API in-flight
 * - Hoàn toàn không chặn thao tác click/scroll của người dùng (pointer-events: none)
 * - Mượt mà, hiện đại theo tiêu chuẩn GitHub, Linear, Google Cloud Console
 */
export default function GlobalApiLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleLoadingState = (e: any) => {
            const active = e.detail?.isLoading ?? false;

            if (active) {
                setIsLoading(true);
                setProgress((prev) => (prev > 0 ? prev : 20));

                if (!progressIntervalRef.current) {
                    progressIntervalRef.current = setInterval(() => {
                        setProgress((prev) => {
                            if (prev < 85) return prev + Math.random() * 15;
                            return prev;
                        });
                    }, 250);
                }
            } else {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
                setProgress(100);
                const timer = setTimeout(() => {
                    setIsLoading(false);
                    setProgress(0);
                }, 300);
                return () => clearTimeout(timer);
            }
        };

        window.addEventListener('api_loading_state_change', handleLoadingState);
        return () => {
            window.removeEventListener('api_loading_state_change', handleLoadingState);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, []);

    if (!isLoading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[2.5px] bg-transparent overflow-hidden"
            aria-hidden="true"
        >
            <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: isLoading ? 1 : 0,
                    transition: progress === 100 ? 'width 200ms ease-out, opacity 300ms ease-in' : 'width 300ms ease-out',
                }}
            />
        </div>
    );
}
