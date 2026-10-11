import { RequestInit } from "next/dist/server/web/spec-extension/request";

interface RequestOptions {
    method: string;
    headers: {
        [key: string]: string;
    };
    credentials: "omit" | "same-origin" | "include";
    redirect: "manual";
    body?: any;
}

const AUTH_BASE = "http://localhost:8080/api/v1/auth";

let refreshInProgress: Promise<boolean> | null = null;

function getAccessToken(): string | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
    } catch {
        return null;
    }
}

function setAccessToken(token: string | null) {
    try {
        if (typeof window !== 'undefined') {
            if (token) window.localStorage.setItem('accessToken', token);
            else window.localStorage.removeItem('accessToken');
        }
    } catch (e) {}
}

function getRefreshToken(): string | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage.getItem('refreshToken') : null;
    } catch {
        return null;
    }
}

function setRefreshToken(token: string | null) {
    try {
        if (typeof window !== 'undefined') {
            if (token) window.localStorage.setItem('refreshToken', token);
            else window.localStorage.removeItem('refreshToken');
        }
    } catch (e) {}
}

function clearAuthStorage() {
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('accessToken');
            window.localStorage.removeItem('refreshToken');
            window.localStorage.removeItem('authUsername');
        }
    } catch (e) {}
}

function redirectToLogin() {
    try {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            clearAuthStorage();
            window.location.href = '/login';
        }
    } catch (e) {}
}

async function tryRefreshToken(): Promise<boolean> {
    if (refreshInProgress) return refreshInProgress;
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    refreshInProgress = (async () => {
        try {
            const resp = await fetch(`${AUTH_BASE}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            if (!resp.ok) {
                clearAuthStorage();
                return false;
            }
            const json = await resp.json();
            const newAccess = json.accessToken ?? json.access_token ?? null;
            const newRefresh = json.refreshToken ?? json.refresh_token ?? null;
            if (newAccess) setAccessToken(newAccess);
            if (newRefresh) setRefreshToken(newRefresh);
            return true;
        } catch (e) {
            clearAuthStorage();
            return false;
        } finally {
            refreshInProgress = null;
        }
    })();

    return refreshInProgress;
}

let activeRequestsCount = 0;

function notifyLoadingChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api_loading_state_change', {
            detail: {
                activeCount: activeRequestsCount,
                isLoading: activeRequestsCount > 0
            }
        }));
    }
}

// Production In-flight Request Deduplication: Gộp các request GET trùng lặp đang đồng thời diễn ra
const inFlightGetRequests = new Map<string, Promise<Response>>();

const callApi = async (
    method: string, 
    endPoint: string, 
    data: any = null, 
    contentType: string | null = null, 
    _retry: boolean = false,
    quiet: boolean = false
): Promise<Response> => {
    const contentTypeDefault: string = 'application/json; charset=UTF-8';

    const headers: { [key: string]: string } = {
        'Content-type': contentType ?? contentTypeDefault,
    };

    // Attach Authorization if accessToken exists
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const isGet = method.toUpperCase() === 'GET';
    const cacheKey = `${endPoint}|${token || ''}`;

    // Nếu có request GET cùng endpoint đang in-flight, tái sử dụng Promise thay vì gửi thêm network request
    if (isGet && !_retry && inFlightGetRequests.has(cacheKey)) {
        const sharedPromise = inFlightGetRequests.get(cacheKey)!;
        const sharedResp = await sharedPromise;
        return sharedResp.clone();
    }

    const requestOptions: RequestOptions = {
        method: method.toUpperCase(),
        headers: headers,
        credentials: "include",
        redirect: "manual"
    };

    if (data) {
        if (data instanceof FormData) {
            delete requestOptions.headers['Content-type'];
            requestOptions.body = data;
        } else if (typeof data === 'string') {
            requestOptions.body = data;
        } else {
            requestOptions.body = JSON.stringify(data);
        }
    }

    // Do not show full-screen overlay for background polling, rename, star, or silent requests
    const isQuiet = Boolean(
        quiet ||
        endPoint.includes('/rename') ||
        endPoint.includes('/star') ||
        endPoint.includes('silent=true') ||
        endPoint.includes('/access-requests/pending') || 
        endPoint.includes('/access-requests/count') ||
        endPoint.includes('/auth/me') ||
        endPoint.includes('/chat-sessions') ||
        endPoint.includes('/chat')
    );

    if (!isQuiet && !_retry) {
        activeRequestsCount++;
        notifyLoadingChange();
    }

    const executeNetworkFetch = async (): Promise<Response> => {
        try {
            return await fetch(endPoint, requestOptions);
        } finally {
            if (isGet) {
                inFlightGetRequests.delete(cacheKey);
            }
        }
    };

    let response: Response;
    try {
        if (isGet && !_retry) {
            const pendingPromise = executeNetworkFetch();
            inFlightGetRequests.set(cacheKey, pendingPromise);
            const rawResp = await pendingPromise;
            response = rawResp.clone();
        } else {
            response = await fetch(endPoint, requestOptions);
        }
    } catch (err) {
        throw err;
    } finally {
        if (!isQuiet && !_retry) {
            activeRequestsCount = Math.max(0, activeRequestsCount - 1);
            notifyLoadingChange();
        }
    }

    // If 401 Unauthorized, attempt refresh once or redirect to login
    if ((response.status === 401 || response.status === 403) && !endPoint.includes('/auth/login') && !endPoint.includes('/auth/register')) {
        if (!_retry) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                return callApi(method, endPoint, data, contentType, true, quiet);
            }
        }
        redirectToLogin();
    }

    return response;
};

const apiClient = {
    get: (endPoint: string, quiet: boolean = false) => callApi('GET', endPoint, null, null, false, quiet),
    post: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = false) => callApi('POST', endPoint, data, contentType, false, quiet),
    put: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = false) => callApi('PUT', endPoint, data, contentType, false, quiet),
    patch: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = false) => callApi('PATCH', endPoint, data, contentType, false, quiet),
    delete: (endPoint: string, data: any = null, quiet: boolean = false) => callApi('DELETE', endPoint, data, null, false, quiet)
};

export default apiClient;
