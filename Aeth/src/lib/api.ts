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

export async function loginSiwe(
  message: string,
  signature: string
): Promise<{ accessToken: string; walletAddress: string; refreshToken: string; expiresIn?: number }>{
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

export async function getUserEssenceBalance(): Promise<{
  balance: string;
  balanceFormatted: number;
  tokenStats: {
    totalSupply: string;
    maxSupply: string;
    remainingSupply: string;
    rewardAmount: string;
  };
}> {
  const res = await authorizedFetch('/users/me/essence-balance');
  if (!res.ok) throw new Error('No se pudo obtener balance de esencia');
  return res.json();
}

export async function getUserStats(): Promise<{
  user: {
    address: string;
    totalHeroes: number;
    totalPower: number;
    averageLevel: number;
    maxLevel: number;
    heroesByLevel: Record<number, number>;
  };
  essence: {
    balance: string;
    balanceFormatted: number;
  };
  staking: {
    stakedTokens: string[];
    pendingRewards: string;
    pendingRewardsFormatted: number;
    totalRewards: string;
    lastClaimTime: number;
    stakedCount: number;
  } | null;
  marketplace: {
    activeListings: number;
    totalListed: number;
  } | null;
  summary: {
    totalAssets: number;
    totalValue: number;
    isActive: boolean;
  };
}> {
  const res = await authorizedFetch('/users/me/stats');
  if (!res.ok) throw new Error('No se pudo obtener estadísticas del usuario');
  return res.json();
}

export async function getUserActivity(params?: {
  page?: number;
  limit?: number;
  type?: string;
  from?: string;
  to?: string;
}): Promise<{
  activities: Array<{
    id: string;
    type: string;
    summary: string;
    details?: string;
    timestamp: number;
    txHash?: string;
    tokenId?: string;
    status: string;
    metadata?: Record<string, any>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recentActivity: any[];
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.type) searchParams.set('type', params.type);
  if (params?.from) searchParams.set('from', params.from);
  if (params?.to) searchParams.set('to', params.to);

  const url = `/users/me/activity${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const res = await authorizedFetch(url);
  if (!res.ok) throw new Error('No se pudo obtener historial de actividad');
  return res.json();
}

export async function getHeroMetadata(tokenId: string): Promise<{
  tokenId: string;
  name: string;
  description: string;
  image: string;
  level: number;
  evolutionStage: number;
  class: string;
  power: number;
  owner: string;
  isStaked: boolean;
  isListed: boolean;
  listingPrice: {
    wei: string;
    core: number;
  } | null;
  attributes: any[];
  externalUrl?: string;
  animationUrl?: string;
  background?: string;
  createdAt?: string;
  updatedAt: string;
}> {
  const res = await authorizedFetch(`/heroes/${tokenId}/metadata`);
  if (!res.ok) throw new Error('No se pudo obtener metadata del héroe');
  return res.json();
}


