// @ts-nocheck
import React from 'react';
import ListingGrid from '../components/marketplace/ListingGrid';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useMarketplace } from '../hooks/useMarketplace';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  const { address } = useAccount();
  const { list } = useMarketplace();
  const [confirmation, setConfirmation] = React.useState<{
    isOpen: boolean;
    action: 'buy' | 'unlist';
    itemId: string;
    itemName: string;
    price?: number;
  }>({
    isOpen: false,
    action: 'buy',
    itemId: '',
    itemName: ''
  });

  const handleBuy = (id: string, name: string, price: number) => {
    setConfirmation({
      isOpen: true,
      action: 'buy',
      itemId: id,
      itemName: name,
      price
    });
  };

  const handleUnlist = (id: string, name: string) => {
    setConfirmation({
      isOpen: true,
      action: 'unlist',
      itemId: id,
      itemName: name
    });
  };

  const handleConfirm = async () => {
    if (confirmation.action === 'buy') {
      // La lógica de compra se maneja en ListingGrid
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    } else if (confirmation.action === 'unlist') {
      // La lógica de unlist se maneja en ListingGrid
      setConfirmation(prev => ({ ...prev, isOpen: false }));
    }
  };

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
      <ListingGrid 
        onBuyConfirm={handleBuy}
        onUnlistConfirm={handleUnlist}
      />

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirm}
        title={
          confirmation.action === 'buy' 
            ? 'Confirmar compra' 
            : 'Confirmar cancelación de listado'
        }
        message={
          confirmation.action === 'buy'
            ? `¿Estás seguro de que quieres comprar "${confirmation.itemName}" por ${confirmation.price} CORE?`
            : `¿Estás seguro de que quieres cancelar el listado de "${confirmation.itemName}"?`
        }
        confirmText={confirmation.action === 'buy' ? 'Comprar' : 'Cancelar listado'}
        variant={confirmation.action === 'buy' ? 'info' : 'warning'}
        details={
          confirmation.action === 'buy'
            ? 'Esta acción transferirá el héroe a tu wallet y descontará el precio de tu balance de CORE.'
            : 'El héroe será devuelto a tu wallet y el listado será removido del marketplace.'
        }
      />
    </div>
  );
}


