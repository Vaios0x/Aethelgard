// @ts-nocheck
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { WagmiProvider, RainbowKitProvider, config } from './lib/wagmi';
import { coreTestnet2 } from './lib/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './lib/notifications';
import { pwaManager } from './lib/pwa';
import App from './App.tsx';
import './styles/index.css';

const queryClient = new QueryClient();

// Carga diferida de estilos de RainbowKit vía CDN para evitar que PostCSS procese el CSS del paquete
function injectRainbowKitStyles() {
  if (document.getElementById('rk-styles')) return;
  const link = document.createElement('link');
  link.id = 'rk-styles';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/@rainbow-me/rainbowkit@2.1.1/styles.css';
  document.head.appendChild(link);
}

// Inicializar PWA
async function initPWA() {
  try {
    await pwaManager.init();
    console.log('PWA inicializada correctamente');
  } catch (error) {
    console.warn('Error inicializando PWA:', error);
  }
}

// Inicializar PWA y renderizar app
initPWA().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <HashRouter>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              initialChain={coreTestnet2.id}
              appInfo={{ disclaimer: ({ Text }) => <Text>Built for Core. Demo Mode disponible.</Text> }}
              modalSize="compact"
            >
              <ToastProvider>
                {injectRainbowKitStyles()}
                <App />
              </ToastProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </HashRouter>
    </StrictMode>
  );
});


