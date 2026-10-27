// Tiny fetch wrapper: adds the auth token, parses JSON, throws ApiError with
// the server's message so the UI can show it.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'bm_token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* private mode */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const buildUrl = (path, query) => {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  return url;
};

export async function api(path, { method = 'GET', body, query, signal } = {}) {
  const token = tokenStore.get();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, signal, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError("Can't reach the server. Check your connection (or that the API is running).", 0);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// Upload one image with progress reporting (fetch can't report upload progress).
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildUrl('/uploads'));
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* non-JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(data?.message || 'Upload failed', xhr.status, data));
    };
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 0));
    const form = new FormData();
    form.append('image', file);
    xhr.send(form);
  });
}

// Images stored locally in dev come back as "/uploads/...": prefix the API host.
// "/demo/..." sample images are served by the frontend itself.
export const assetUrl = (url) => (url && url.startsWith('/uploads/') ? `${BASE}${url}` : url);

export const SOCKET_URL = BASE || undefined;
