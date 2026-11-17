/**
 * Utility to extract clean, human-readable error messages from HTTP Response objects or Error instances.
 */
export async function extractApiError(response: Response, defaultMessage: string = 'Đã có lỗi xảy ra'): Promise<Error> {
    let msg = defaultMessage;
    let data: any = null;

    try {
        data = await response.clone().json();
        if (data?.message) {
            msg = data.message;
        } else if (data?.error) {
            msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        }
    } catch (_) {
        try {
            const text = await response.clone().text();
            if (text && text.trim().length > 0 && text.length < 500) {
                msg = text;
            }
        } catch (__) {}
    }

    const err = new Error(msg);
    (err as any).response = response;
    (err as any).status = response.status;
    (err as any).statusCode = response.status;
    (err as any).data = data;
    return err;
}

/**
 * Safely retrieves an error message string from unknown catch block error objects
 */
export function getErrorMessage(err: any, fallback: string = 'Đã có lỗi xảy ra'): string {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err?.data?.message) return String(err.data.message);
    if (err?.response?.data?.message) return String(err.response.data.message);
    if (err?.message && !err.message.includes('[object') && !err.message.includes('Response')) {
        return String(err.message);
    }
    return fallback;
}
