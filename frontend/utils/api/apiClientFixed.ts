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

const callApi = async (method: string, endPoint: string, data: any = null, contentType: string | null = null, _retry: boolean = false): Promise<Response> => {
    const contentTypeDefault: string = 'application/json; charset=UTF-8';

    const headers: { [key: string]: string } = {
        'Content-type': contentType ?? contentTypeDefault,
    };

    // Attach Authorization if accessToken exists
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
        }
        requestOptions.body = data;
    }

    let response: Response;
    try {
        response = await fetch(endPoint, requestOptions);
    } catch (err) {
        throw err;
    }

    // If 401 Unauthorized, attempt refresh once or redirect to login
    if ((response.status === 401 || response.status === 403) && !endPoint.includes('/auth/login') && !endPoint.includes('/auth/register')) {
        if (!_retry) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                return callApi(method, endPoint, data, contentType, true);
            }
        }
        redirectToLogin();
    }

    return response;
};

const apiClient = {
    get: (endPoint: string) => callApi('GET', endPoint),
    post: (endPoint: string, data: any = null, contentType: string | null = null) => callApi('POST', endPoint, data, contentType),
    put: (endPoint: string, data: any = null, contentType: string | null = null) => callApi('PUT', endPoint, data, contentType),
    patch: (endPoint: string, data: any = null, contentType: string | null = null) => callApi('PATCH', endPoint, data, contentType),
    delete: (endPoint: string) => callApi('DELETE', endPoint)
};

export default apiClient;
