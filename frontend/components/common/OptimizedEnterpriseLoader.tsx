'use client';

import React from 'react';

interface OptimizedEnterpriseLoaderProps {
    text?: string;
    subtext?: string;
    width?: number | string;
    theme?: 'light' | 'frosted';
}

/**
 * OptimizedEnterpriseLoader:
 * Custom dựa trên ToughZebraLoader (hiệu ứng 3D Isometric Wave Tunnel xoay lượn sóng)
 * nhưng được tối ưu hóa phần cứng GPU 100%:
 * - Không dùng clip-path (nguyên nhân chính gây GPU 100% khi kết hợp box-shadow liên tục repaint)
 * - Tận dụng CSS 3D transform hardware acceleration (translate3d, will-change, backface-visibility)
 * - Hiệu ứng hình thoi xoay 3D màu xanh công nghệ siêu mượt 60-120fps mà không gây quá tải GPU.
 */
export default function OptimizedEnterpriseLoader({
    text = 'Đang xử lý...',
    subtext = 'Vui lòng đợi trong giây lát',
    width = 260,
    theme = 'light'
}: OptimizedEnterpriseLoaderProps) {
    const numericWidth = typeof width === 'number' ? width : parseInt(String(width), 10) || 260;
    const height = Math.round(numericWidth * 0.85);

    return (
        <div className="flex flex-col items-center justify-center select-none pointer-events-none">
            {/* 3D Rotating Isometric Wave Tunnel - GPU Optimized Edition */}
            <div
                className="flex items-center justify-center overflow-visible relative"
                style={{
                    width: `${numericWidth}px`,
                    height: `${height}px`
                }}
            >
                <aside className="opt-container-loader">
                    <div style={{ '--s': 0 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 1 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 2 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 3 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 4 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 5 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 6 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 7 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 8 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 9 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 10 } as React.CSSProperties} className="opt-aro" />
                    <div style={{ '--s': 11 } as React.CSSProperties} className="opt-aro" />
                </aside>

                {/* Tâm sáng nhẹ ở giữa tạo điểm nhấn công nghệ */}
                <div className="opt-center-core" />
            </div>

            {/* Scoped CSS tối ưu hóa GPU */}
            <style dangerouslySetInnerHTML={{ __html: `
.opt-container-loader {
  width: 200px;
  height: 200px;
  position: relative;
  transform-style: preserve-3d;
  transform: perspective(600px) rotateX(60deg) rotateZ(45deg);
  will-change: transform;
}

.opt-container-loader .opt-aro {
  position: absolute;
  inset: calc(var(--s) * 8px);
  border: 1.5px solid rgba(37, 99, 235, 0.65);
  background: rgba(37, 99, 235, 0.04);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.35);
  border-radius: 2px;
  will-change: transform;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
  animation: opt-strim 3s infinite ease-in-out both;
  animation-delay: calc(var(--s) * -0.1s);
}

.opt-center-core {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 16px 4px rgba(59, 130, 246, 0.6);
  pointer-events: none;
  animation: opt-core-pulse 2s infinite ease-in-out;
}

@keyframes opt-strim {
  0%,
  100% {
    transform: translate3d(0, 0, -60px) rotate(0deg);
  }
  50% {
    transform: translate3d(0, 0, 60px) rotate(90deg);
  }
}

@keyframes opt-core-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}
            ` }} />
        </div>
    );
}
