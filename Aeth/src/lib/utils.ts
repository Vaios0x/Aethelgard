export function shortenAddress(address?: string | null, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function formatNumber(num: number | bigint, decimals = 2): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: decimals }).format(n);
}

export function ipfsToHttp(uri?: string): string | undefined {
  if (!uri) return uri;
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
  return uri;
}

export function assertEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) {
    console.warn(`Variable de entorno faltante: ${name}`);
    return '';
  }
  return value;
}

export function isZeroAddress(address?: string): boolean {
  if (!address) return true;
  return /^0x0{40}$/i.test(address);
}

export function isMockMode(): boolean {
  // Permite override en runtime vía localStorage.
  try {
    const override = typeof window !== 'undefined' ? window.localStorage.getItem('AETH_MOCKS') : null;
    if (override === 'true') return true;
    if (override === 'false') return false;
  } catch {}
  // Por defecto: mock desactivado. Solo se activa si VITE_MOCKS es "true"
  const flag = import.meta.env.VITE_MOCKS as string | undefined;
  return flag === 'true';
}

export function setMockMode(enabled: boolean): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('AETH_MOCKS', enabled ? 'true' : 'false');
    }
  } catch {}
}


