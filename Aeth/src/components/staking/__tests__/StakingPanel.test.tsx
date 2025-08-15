import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WagmiProvider } from 'wagmi';
import { config } from '../../../lib/wagmi';
import { ToastProvider } from '../../../lib/notifications';
import StakingPanel from '../../staking/StakingPanel';
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

describe('StakingPanel', () => {
  it('muestra acciones principales', () => {
    render(<StakingPanel />, { wrapper });
    // Busca por aria-label para evitar colisiones
    expect(screen.getByRole('button', { name: /^Stakear seleccionados$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Des-stakear seleccionados$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Reclamar recompensas$/i })).toBeInTheDocument();
  });
});


