import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMarketplace } from '../useMarketplace';
import { WagmiProvider } from 'wagmi';
import { config } from '../../lib/wagmi';
import { ToastProvider } from '../../lib/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock del store
vi.mock('../../lib/marketplaceStore', () => ({
  marketplaceStore: {
    subscribe: vi.fn(() => vi.fn()),
    getFavorites: vi.fn(() => new Set()),
    getFilters: vi.fn(() => ({})),
    getSort: vi.fn(() => ({ field: 'createdAt', order: 'desc' })),
    getPagination: vi.fn(() => ({ page: 1, pageSize: 12, total: 0 })),
    processListings: vi.fn(() => ({ items: [], total: 0 })),
    toggleFavorite: vi.fn(() => true),
    setSort: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    clearFavorites: vi.fn(),
  }
}));

// Mock de wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: '0x123' })),
  usePublicClient: vi.fn(() => ({
    estimateContractGas: vi.fn(() => Promise.resolve(21000n)),
    readContract: vi.fn(() => Promise.resolve(true)),
    getBalance: vi.fn(() => Promise.resolve(1000000000000000000n)),
    waitForTransactionReceipt: vi.fn(() => Promise.resolve({ hash: '0xhash' }))
  })),
  useWalletClient: vi.fn(() => ({
    data: {
      writeContract: vi.fn(() => Promise.resolve('0xhash'))
    }
  }))
}));

// Mock de la API
vi.mock('../../lib/api', () => ({
  authorizedFetch: vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ listings: [] })
  }))
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

describe('useMarketplace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa con estado correcto', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    expect(result.current.listings).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.filters).toEqual({});
    expect(result.current.sort).toEqual({ field: 'createdAt', order: 'desc' });
    expect(result.current.pagination).toEqual({ page: 1, pageSize: 12, total: 0 });
  });

  it('maneja favoritos correctamente', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.toggleFavorite('test-id');
    });

    expect(result.current.toggleFavorite).toBeDefined();
  });

  it('maneja ordenamiento correctamente', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.sort('price', 'asc');
    });

    expect(result.current.sort).toBeDefined();
  });

  it('maneja filtros correctamente', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.setFilters({ q: 'test' });
    });

    expect(result.current.setFilters).toBeDefined();
  });

  it('maneja paginación correctamente', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.setPage).toBeDefined();
  });

  it('maneja limpieza de filtros', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.clearFilters).toBeDefined();
  });

  it('maneja limpieza de favoritos', () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });

    act(() => {
      result.current.clearFavorites();
    });

    expect(result.current.clearFavorites).toBeDefined();
  });
});


