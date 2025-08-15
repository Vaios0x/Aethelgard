// @ts-nocheck
import ListingGrid from '../components/marketplace/ListingGrid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useMarketplace } from '../hooks/useMarketplace';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  const { address } = useAccount();
  const { list } = useMarketplace();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading text-2xl sm:text-3xl lg:text-4xl">Marketplace</h1>
          <p className="text-text-secondary text-sm sm:text-base">
            Compra, vende y descubre héroes únicos en el ecosistema Core
          </p>
        </div>
        
        {address && (
          <Link to="/dashboard">
            <Button variant="primary" className="text-sm">
              Mis Héroes
            </Button>
          </Link>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">🏪</div>
            <div className="text-sm text-text-secondary">Marketplace</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">⚔️</div>
            <div className="text-sm text-text-secondary">Héroes NFT</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">💎</div>
            <div className="text-sm text-text-secondary">Core DAO</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">🔒</div>
            <div className="text-sm text-text-secondary">Seguro</div>
          </div>
        </div>
      </Card>

      {/* Grid principal */}
      <ListingGrid />
    </div>
  );
}


