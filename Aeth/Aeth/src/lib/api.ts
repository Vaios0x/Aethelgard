const API_URL = (import.meta.env.VITE_ENABLE_BACKEND === 'true')
  ? (import.meta.env.VITE_BACKEND_URL as string | undefined)
  : undefined;

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

export async function getNonce(address: string): Promise<string> {
  if (!API_URL) throw new Error('Backend no configurado');
  const res = await fetch(`${API_URL}/auth/nonce/${address}`);
  if (!res.ok) throw new Error('No se pudo obtener nonce');
  const data = await res.json();
  return data.nonce as string;
}

export async function loginSiwe(message: string, signature: string): Promise<{ accessToken: string; walletAddress: string }>{
  if (!API_URL) throw new Error('Backend no configurado');
  const res = await fetch(`${API_URL}/auth/login`, {
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
  return fetch(input.startsWith('http') ? input : `${API_URL}${input}`, { ...init, headers });
}


