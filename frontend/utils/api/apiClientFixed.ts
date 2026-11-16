interface RequestOptions {
    method: string;
    headers: {
        [key: string]: string;
    };
    credentials: "omit" | "same-origin" | "include";
    redirect: "manual";
    body?: any;
}

export const API_ROOT = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) 
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') 
    : 'http://localhost:8080';

const AUTH_BASE = `${API_ROOT}/api/v1/auth`;

export function normalizeUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://localhost:8080')) {
        return url.replace('http://localhost:8080', API_ROOT);
    }
    if (url.startsWith('/')) {
        return `${API_ROOT}${url}`;
    }
    return url;
}

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

function isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        if (typeof window === 'undefined') return false;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window.atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (!payload.exp) return false;
        return Date.now() >= (payload.exp * 1000 - 60000);
    } catch {
        return false;
    }
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

// Production In-flight Request Deduplication
const inFlightGetRequests = new Map<string, Promise<Response>>();

const callApi = async (
    method: string, 
    endPoint: string, 
    data: any = null, 
    contentType: string | null = null, 
    _retry: boolean = false,
    quiet: boolean = false
): Promise<Response> => {
    const targetUrl = normalizeUrl(endPoint);
    const contentTypeDefault: string = 'application/json; charset=UTF-8';

    const headers: { [key: string]: string } = {
        'Content-type': contentType ?? contentTypeDefault,
    };

    // Proactively refresh access token in background if expired or expiring within 60s
    if (
        !_retry &&
        !targetUrl.includes('/auth/login') &&
        !targetUrl.includes('/auth/register') &&
        !targetUrl.includes('/auth/refresh')
    ) {
        const currentToken = getAccessToken();
        if (currentToken && isTokenExpiringSoon(currentToken)) {
            await tryRefreshToken();
        }
    }

    // Attach Authorization if accessToken exists
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const isGet = method.toUpperCase() === 'GET';
    const cacheKey = `${targetUrl}|${token || ''}`;

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

    // Standard UX: Normal queries & background fetches are completely quiet (non-intrusive).
    // Individual UI components manage their own focused button/table spinners.
    const isQuiet = Boolean(
        quiet !== false || // quiet by default
        isGet ||
        targetUrl.includes('/rename') ||
        targetUrl.includes('/star') ||
        targetUrl.includes('silent=true') ||
        targetUrl.includes('/access-requests') || 
        targetUrl.includes('/auth') ||
        targetUrl.includes('/chat') ||
        targetUrl.includes('/activity-logs') ||
        targetUrl.includes('/dashboard') ||
        targetUrl.includes('/files') ||
        targetUrl.includes('/folders')
    );

    if (!isQuiet && !_retry) {
        activeRequestsCount++;
        notifyLoadingChange();
    }

    const executeNetworkFetch = async (): Promise<Response> => {
        try {
            return await fetch(targetUrl, requestOptions);
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
            response = await fetch(targetUrl, requestOptions);
        }
    } catch (err) {
        throw err;
    } finally {
        if (!isQuiet && !_retry) {
            activeRequestsCount = Math.max(0, activeRequestsCount - 1);
            notifyLoadingChange();
        }
    }

    // Handle 401 Unauthorized or 403 on expired token
    if ((response.status === 401 || (response.status === 403 && token)) && !targetUrl.includes('/auth/login') && !targetUrl.includes('/auth/register')) {
        if (!_retry) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                return callApi(method, endPoint, data, contentType, true, quiet);
            }
        }
        if (response.status === 401) {
            redirectToLogin();
        }
    }

    return response;
};

const apiClient = {
    get: (endPoint: string, quiet: boolean = true) => callApi('GET', endPoint, null, null, false, quiet),
    post: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = true) => callApi('POST', endPoint, data, contentType, false, quiet),
    put: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = true) => callApi('PUT', endPoint, data, contentType, false, quiet),
    patch: (endPoint: string, data: any = null, contentType: string | null = null, quiet: boolean = true) => callApi('PATCH', endPoint, data, contentType, false, quiet),
    delete: (endPoint: string, data: any = null, quiet: boolean = true) => callApi('DELETE', endPoint, data, null, false, quiet)
};

export default apiClient;
