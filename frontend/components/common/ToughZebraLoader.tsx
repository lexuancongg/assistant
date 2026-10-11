'use client';

import React from 'react';

interface ToughZebraLoaderProps {
    text?: string;
    subtext?: string;
    width?: number | string;
    theme?: 'light' | 'frosted';
}

export default function ToughZebraLoader({
    text = 'Đang xử lý...',
    subtext = 'Vui lòng đợi trong giây lát',
    width = 280,
    theme = 'light'
}: ToughZebraLoaderProps) {
    const isFrosted = theme === 'frosted';

    return (
        <div className="flex flex-col items-center justify-center select-none pointer-events-none">
            {/* 3D Rotating Isometric Wave Tunnel */}
            <div
                className="flex items-center justify-center overflow-visible"
                style={{
                    width: typeof width === 'number' ? `${width}px` : width,
                    height: typeof width === 'number' ? `${Math.round(Number(width) * 0.85)}px` : '240px'
                }}
            >
                <aside className="tz-container-loader">
                    <div style={{ '--s': 0 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 1 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 2 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 3 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 4 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 5 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 6 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 7 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 8 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 9 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 10 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 11 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 12 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 13 } as React.CSSProperties} className="tz-aro" />
                    <div style={{ '--s': 14 } as React.CSSProperties} className="tz-aro" />
                </aside>
            </div>

            {/* Scoped CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
.tz-container-loader {
  width: 240px;
  height: 240px;
  position: relative;
  transform-style: preserve-3d;
  transform: perspective(600px) rotateX(60deg);
}

.tz-container-loader .tz-aro {
  position: absolute;
  inset: calc(var(--s) * 8px);
  box-shadow: inset 0 0 35px #2563eb, 0 0 12px rgba(59, 130, 246, 0.45);
  border: 1.5px solid rgba(37, 99, 235, 0.55);
  background: rgba(37, 99, 235, 0.05);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: tz-strim 3s infinite ease-in-out both;
  animation-delay: calc(var(--s) * -0.1s);
}

@keyframes tz-strim {
  0%,
  100% {
    transform: translateZ(-70px) rotate(0deg);
  }
  50% {
    transform: translateZ(70px) rotate(90deg);
  }
}
            ` }} />
        </div>
    );
}
