// @ts-nocheck
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConnectWalletButton from '../components/web3/ConnectWalletButton';

export default function LandingPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[420px] sm:min-h-[560px]">
        <img src="/images/landing-hero.svg" alt="Aethelgard" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" aria-hidden />
        <div className="relative px-4 py-12 sm:px-12 sm:py-24 text-center flex items-center justify-center h-full">
          <div className="max-w-3xl mx-auto">
            <h1 className="heading text-4xl sm:text-6xl mb-3 sm:mb-4">Aethelgard</h1>
            <p className="text-text-secondary max-w-2xl mx-auto text-base sm:text-lg">
            El Command Center para tus Héroes NFT: evoluciona, stakea y comercia en un ecosistema <span className="text-primary">Play-to-Secure</span> sobre Core.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button aria-label="Entrar a la dApp" className="w-full sm:w-auto px-6 py-3 text-base">Entrar a la dApp</Button>
              </Link>
              <div className="w-full sm:w-auto flex justify-center">
                <ConnectWalletButton />
              </div>
            </div>
            <div className="mt-4 text-xs text-text-secondary">Modo: Onchain</div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="heading text-xl mb-1">Dashboard</h3>
          <p className="text-text-secondary text-sm">Visión total de tus héroes, actividad y red. Integrado con Core Testnet2/Mainnet.</p>
        </Card>
        <Card>
          <h3 className="heading text-xl mb-1">Staking P2S</h3>
          <p className="text-text-secondary text-sm">Stakea/des-stakea, reclama esencia y evoluciona héroes con feedback de transacción.</p>
        </Card>
        <Card>
          <h3 className="heading text-xl mb-1">Marketplace</h3>
          <p className="text-text-secondary text-sm">Compra, lista y retira con filtros, favoritos y paginación. Listo para contratos.</p>
        </Card>
      </section>

      {/* Callouts Core */}
      <Card>
        <h2 className="heading text-2xl mb-2">Construido para la Core DAO</h2>
        <p className="text-text-secondary text-sm">Compatible con Core Testnet2 (1114) y Mainnet (1116). Wallets: MetaMask, Rabby, Coinbase, WalletConnect.</p>
        <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
          <a href="https://scan.test2.btcs.network" target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 rounded">Testnet2 Explorer</a>
          <a href="https://scan.coredao.org" target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 rounded">CoreScan</a>
        </div>
      </Card>

      {/* Conversión */}
      <section className="text-center space-y-3">
        <h2 className="heading text-3xl sm:text-4xl">¿Listo para comandar tu ejército?</h2>
        <p className="text-text-secondary text-base sm:text-lg">Conecta tu wallet y entra al Dashboard.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button aria-label="Ir al Dashboard" className="w-full sm:w-auto">Ir al Dashboard</Button>
          </Link>
          <div className="w-full sm:w-auto flex justify-center">
            <ConnectWalletButton />
          </div>
        </div>
      </section>
    </div>
  );
}


