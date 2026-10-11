'use client';

import React, { useEffect, useState, useRef } from 'react';
import RandomEnterpriseLoader, { pickNewUnifiedLoaderIndex } from './RandomEnterpriseLoader';

export default function GlobalApiLoading() {
    const [isVisible, setIsVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    // State machine refs - Đảm bảo timer và cờ trạng thái chính xác không bị reset
    const isVisibleRef = useRef(false);
    const openTimerRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const showStartTimeRef = useRef<number>(0);

    // Chuẩn UX Gold-Standard:
    // 1. OPEN_DELAY (200ms): Nếu API hoàn tất trong vòng 200ms -> Tuyệt đối KHÔNG hiện loading để tránh chớp nháy.
    // 2. MIN_DISPLAY_TIME (500ms): Một khi đã hiện lên màn hình thì hiển thị tối thiểu 500ms để hiệu ứng trọn vẹn, không giật mắt.
    // 3. GRACE_PERIOD (250ms): Khoảng chờ phòng khi có API kế tiếp gọi ngay sau đó.
    // 4. FADE_DURATION (200ms): Hiệu ứng mờ dần nhẹ nhàng trước khi ẩn hoàn toàn.
    const OPEN_DELAY = 200;
    const MIN_DISPLAY_TIME = 500;
    const GRACE_PERIOD = 250;
    const FADE_DURATION = 200;

    useEffect(() => {
        const handleLoadingState = (e: any) => {
            const active = e.detail?.isLoading ?? false;

            if (active) {
                // 1. Huỷ ngay lập tức lệnh đóng nếu có API mới được gọi tới (giữ hiển thị liên tục)
                if (closeTimerRef.current) {
                    clearTimeout(closeTimerRef.current);
                    closeTimerRef.current = null;
                }
                setIsFadingOut(false);

                // 2. Nếu đã đang hiển thị trên màn hình thì giữ nguyên
                if (isVisibleRef.current) return;

                // 3. Trì hoãn mở (OPEN_DELAY = 200ms): Nếu API hoàn thành nhanh thì huỷ bỏ, chống chớp nháy
                if (!openTimerRef.current) {
                    openTimerRef.current = setTimeout(() => {
                        pickNewUnifiedLoaderIndex();
                        isVisibleRef.current = true;
                        showStartTimeRef.current = Date.now();
                        setIsVisible(true);
                        openTimerRef.current = null;
                    }, OPEN_DELAY);
                }
            } else {
                // 1. Nếu các API hoàn thành nhanh trước 200ms thì huỷ lệnh mở -> hoàn toàn không chớp nhấp nháy
                if (openTimerRef.current) {
                    clearTimeout(openTimerRef.current);
                    openTimerRef.current = null;
                }

                // 2. Nếu chưa từng hiển thị thì không cần đóng
                if (!isVisibleRef.current) return;

                // 3. Đã hiển thị: đảm bảo hiển thị đủ MIN_DISPLAY_TIME (500ms) và GRACE_PERIOD (250ms)
                if (closeTimerRef.current) {
                    clearTimeout(closeTimerRef.current);
                }

                const elapsed = Date.now() - showStartTimeRef.current;
                const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsed);
                const waitTime = Math.max(GRACE_PERIOD, remainingTime);

                closeTimerRef.current = setTimeout(() => {
                    setIsFadingOut(true);
                    setTimeout(() => {
                        isVisibleRef.current = false;
                        setIsVisible(false);
                        setIsFadingOut(false);
                    }, FADE_DURATION);
                    closeTimerRef.current = null;
                }, waitTime);
            }
        };

        window.addEventListener('api_loading_state_change', handleLoadingState);
        return () => {
            window.removeEventListener('api_loading_state_change', handleLoadingState);
            if (openTimerRef.current) clearTimeout(openTimerRef.current);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-[2px] p-4 transition-opacity duration-200 ease-out ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            <RandomEnterpriseLoader
                key={showStartTimeRef.current}
                theme="light"
            />
        </div>
    );
}
