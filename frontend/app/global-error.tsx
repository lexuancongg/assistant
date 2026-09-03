'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="vi">
            <body>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Đã xảy ra lỗi hệ thống</h2>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>{error?.message || 'Không thể khởi tạo ứng dụng.'}</p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Thử lại
                    </button>
                </div>
            </body>
        </html>
    );
}
