'use client';

import React from 'react';
import OptimizedEnterpriseLoader from './OptimizedEnterpriseLoader';

export interface EnterpriseLoaderProps {
    width?: number | string;
    height?: number | string;
    theme?: 'light' | 'frosted';
    loaderType?: number;
    text?: string;
    subtext?: string;
}

export function getUnifiedLoaderIndex(): number {
    return 1;
}

export function pickNewUnifiedLoaderIndex(): number {
    return 1;
}

/**
 * Enterprise Loader:
 * Sử dụng phiên bản OptimizedEnterpriseLoader (dựa trên ToughZebraLoader 3D wave tunnel)
 * được tối ưu hóa GPU, không gây giật lag khi hiển thị toàn hệ thống.
 */
export default function RandomEnterpriseLoader(props: EnterpriseLoaderProps) {
    return (
        <OptimizedEnterpriseLoader
            width={props.width || 260}
            theme={props.theme}
            text={props.text}
            subtext={props.subtext}
        />
    );
}
