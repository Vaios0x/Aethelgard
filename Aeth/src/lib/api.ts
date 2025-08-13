// Permite usar un backend público por defecto si no está definido en env (para demos)
const RAW_API_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'https://aethelgard-backend.onrender.com';
// Normaliza para evitar "//auth/..." si el usuario pone slash final
const API_URL = RAW_API_URL.replace(/\/+$/, '');

const TOKEN_KEY = 'AETH_JWT';

export function getToken(): string | null {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string) {
  try { window.localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearToken() {
  try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
}

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); });
  });
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await withTimeout(fetch(input, init));
  } catch (e: any) {
    // Normaliza errores de red
    const msg = e?.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION') || msg === 'timeout') {
      throw new Error('backend-offline');
    }
    throw e;
  }
}

export async function getNonce(address: string): Promise<string> {
  if (!API_URL) throw new Error('Backend no configurado');
  const res = await apiFetch(`${API_URL}/auth/nonce/${address}`);
  if (!res.ok) throw new Error('No se pudo obtener nonce');
  const data = await res.json();
  return data.nonce as string;
}

export async function loginSiwe(message: string, signature: string): Promise<{ accessToken: string; walletAddress: string }>{
  if (!API_URL) throw new Error('Backend no configurado');
  const res = await apiFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) throw new Error('Login SIWE falló');
  return res.json();
}

export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!API_URL) throw new Error('Backend no configurado');
  let res = await apiFetch(input.startsWith('http') ? input : `${API_URL}${input}`, { ...init, headers });
  if (res.status === 401 && getToken()) {
    // intento de refresh token
    try {
      const refresh = window.localStorage.getItem('AETH_REFRESH');
      if (refresh) {
        const r = await apiFetch(`${API_URL}/auth/refresh`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }),
        });
        if (r.ok) {
          const data = await r.json();
          setToken(data.accessToken);
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          res = await apiFetch(input.startsWith('http') ? input : `${API_URL}${input}`, { ...init, headers });
        } else {
          clearToken();
        }
      }
    } catch {}
  }
  return res;
}


