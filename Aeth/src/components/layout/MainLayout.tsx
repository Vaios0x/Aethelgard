// @ts-nocheck
import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import ConnectWalletButton from '../web3/ConnectWalletButton';
import ThemeToggle from '../ui/ThemeToggle';
import Toaster from '../ui/Toaster';
import { useAethelgardContracts } from '../../hooks/useAethelgardContracts';
import { isMockMode, setMockMode } from '../../lib/utils';
import { useAccount, useSwitchChain } from 'wagmi';
import { coreMainnet, coreTestnet2 } from '../../lib/wagmi';
import { useActivity } from '../../hooks/useActivity';

function Navbar() {
  const { items } = useActivity();
  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur border-b border-white/5">
      <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2" aria-label="Aethelgard Inicio">
          <span className="heading text-xl">Aethelgard</span>
          <span className="text-text-secondary text-sm hidden sm:block">Command Center</span>
        </Link>
        <ul className="flex items-center gap-2 sm:gap-4">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }: { isActive: boolean; isPending: boolean; isTransitioning?: boolean }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }: { isActive: boolean; isPending: boolean; isTransitioning?: boolean }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/staking"
              className={({ isActive }: { isActive: boolean; isPending: boolean; isTransitioning?: boolean }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              Staking
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/marketplace"
              className={({ isActive }: { isActive: boolean; isPending: boolean; isTransitioning?: boolean }) =>
                `px-3 py-2 rounded-md ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              Mercado
            </NavLink>
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="relative px-3 py-2 rounded-md hover:bg-white/5" aria-label="Actividad reciente" role="button" tabIndex={0}>
            <span>Actividad</span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-primary text-black text-xs flex items-center justify-center">
                {Math.min(items.length, 9)}
              </span>
            )}
          </Link>
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-800 bg-neutral-900/60">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <a href="/" className="inline-flex items-baseline gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded">
            <span className="text-lg font-semibold">Aethelgard</span>
            <span className="text-sm text-neutral-400">Command Center</span>
          </a>
          <p className="mt-3 text-sm text-neutral-400">Evoluciona, stakea y gestiona tus Héroes NFT en el ecosistema Core.</p>
        </div>
        <nav aria-label="Producto">
          <h3 className="text-sm font-semibold text-neutral-300">Producto</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="/dashboard">Dashboard</a></li>
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="/staking">Staking</a></li>
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="/marketplace">Mercado</a></li>
          </ul>
        </nav>
        <nav aria-label="Comunidad">
          <h3 className="text-sm font-semibold text-neutral-300">Comunidad</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li>
              <a className="inline-flex items-center gap-2 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="https://x.com/" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2H21l-6.56 7.49L22 22h-6.828l-5.09-6.58L4.2 22H2l6.993-7.986L2 2h6.828l4.59 6.04L18.244 2Zm-1.196 18h1.847L7.06 4H5.118l11.93 16Z"/></svg>
                X (Twitter)
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="https://discord.com/" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.36-.433.848-.594 1.232a17.31 17.31 0 0 0-7.928 0C7.375 3.848 7.141 3.36 6.94 3a19.796 19.796 0 0 0-3.76 1.369C1.37 8.046.53 12.6 1.12 17.088A19.93 19.93 0 0 0 7 20c.36-.49.68-1.02.95-1.58-.53-.2-1.04-.45-1.53-.74.13-.09.25-.18.37-.27 2.96 1.39 6.17 1.39 9.13 0 .12.09.24.18.37.27-.49.29-1 .54-1.53.74.27.56.59 1.09.95 1.58a19.93 19.93 0 0 0 5.88-2.912c.7-5.31-.47-9.85-2.87-12.719ZM8.68 14.348c-1.01 0-1.83-.93-1.83-2.07 0-1.141.81-2.07 1.83-2.07s1.84.929 1.83 2.07c0 1.14-.82 2.07-1.83 2.07Zm6.64 0c-1.01 0-1.83-.93-1.83-2.07 0-1.141.82-2.07 1.83-2.07 1.01 0 1.84.929 1.83 2.07 0 1.14-.82 2.07-1.83 2.07Z"/></svg>
                Discord
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="https://github.com/" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 .5a11.5 11.5 0 0 0-3.635 22.41c.574.106.785-.25.785-.558 0-.276-.01-1.008-.016-1.98-3.191.694-3.866-1.539-3.866-1.539-.522-1.327-1.276-1.681-1.276-1.681-1.044-.713.079-.699.079-.699 1.155.082 1.764 1.186 1.764 1.186 1.027 1.76 2.695 1.252 3.35.957.104-.77.402-1.252.73-1.54-2.55-.293-5.233-1.275-5.233-5.674 0-1.253.45-2.277 1.186-3.079-.119-.293-.514-1.474.112-3.071 0 0 .967-.31 3.17 1.176a10.94 10.94 0 0 1 2.885-.388c.978.005 1.964.132 2.885.388 2.2-1.486 3.166-1.176 3.166-1.176.628 1.597.234 2.778.115 3.071.738.802 1.184 1.826 1.184 3.079 0 4.41-2.69 5.377-5.255 5.665.41.36.78 1.067.78 2.151 0 1.553-.014 2.806-.014 3.187 0 .311.208.672.79.556A11.5 11.5 0 0 0 12 .5Z"/></svg>
                GitHub
              </a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Recursos">
          <h3 className="text-sm font-semibold text-neutral-300">Recursos</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="#">Documentación</a></li>
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="#">Estado del servicio</a></li>
            <li><a className="hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1" href="mailto:support@aethelgard.app">Soporte</a></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Aethelgard. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1">Privacidad</a>
            <a href="#" className="hover:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded px-1">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout() {
  const { heroNft } = useAethelgardContracts();
  const { chain } = useAccount();
  const { switchChain, error: switchError } = useSwitchChain();
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      {/* Aviso deshabilitado temporalmente */}
      {chain && ![coreMainnet.id, coreTestnet2.id].includes(chain.id) && (
        <div className="bg-purple-900/30 border-b border-purple-700/30 text-text-primary">
          <div className="mx-auto max-w-7xl px-4 py-2 text-sm flex items-center gap-3">
            Red actual no soportada: {chain.name}. Cambia a Core.
            <button className="btn-ghost px-3 py-1" onClick={() => switchChain({ chainId: coreTestnet2.id })}>Core Testnet2</button>
            <button className="btn-ghost px-3 py-1" onClick={() => switchChain({ chainId: coreMainnet.id })}>Core Mainnet</button>
            {switchError && <span className="text-amber-300 text-xs">No se pudo cambiar la red. Abre tu wallet y acepta.</span>}
          </div>
        </div>
      )}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}


