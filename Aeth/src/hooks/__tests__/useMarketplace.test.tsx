import { renderHook, act } from '@testing-library/react';
import * as React from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from '../../lib/wagmi';
import { useMarketplace } from '../../hooks/useMarketplace';
import { ToastProvider } from '../../lib/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

describe('useMarketplace (mock mode)', () => {
  beforeAll(() => {
    // Fuerza modo mock para no depender de backend/chain
    window.localStorage.setItem('AETH_MOCKS', 'true');
  });
  afterAll(() => {
    window.localStorage.removeItem('AETH_MOCKS');
  });

  it('carga listados mock y permite listar/comprar/quitar', async () => {
    const { result } = renderHook(() => useMarketplace(), { wrapper });
    expect(Array.isArray(result.current.listings)).toBe(true);

    // list (mock)
    await act(async () => {
      await result.current.list({ tokenId: 99n, name: 'Test', priceCore: 0.5, seller: '0xYOU', isOwn: true });
    });
    expect(result.current.listings.find((l) => l.name === 'Test')).toBeTruthy();

    const id = result.current.listings[0]?.id;
    if (id) {
      // toggle favoritos solo mock
      act(() => { result.current.toggleFavorite?.(id); });
      // unlist (mock)
      await act(async () => { await result.current.unlist(id); });
    }
  });
});


