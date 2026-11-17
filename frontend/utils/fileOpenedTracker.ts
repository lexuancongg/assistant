/**
 * Utility to record and retrieve user's real file open/view history in browser localStorage
 */

const STORAGE_KEY = 'recently_opened_files';

export function recordFileOpened(fileId: string | number): void {
    if (typeof window === 'undefined' || !fileId) return;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const data: Record<string, number> = raw ? JSON.parse(raw) : {};
        data[String(fileId)] = Date.now();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('file_opened_history_updated', { detail: { fileId } }));
    } catch (e) {
        // Ignore localStorage quota errors
    }
}

export function getFileLastOpened(fileId: string | number): number | null {
    if (typeof window === 'undefined' || !fileId) return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data: Record<string, number> = JSON.parse(raw);
        return data[String(fileId)] || null;
    } catch (e) {
        return null;
    }
}

export function getAllOpenedFiles(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}
