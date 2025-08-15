import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmModal from '../ui/ConfirmModal';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useConfirm } from '../../hooks/useConfirm';
import { ListingTooltip, ApprovalTooltip } from './MarketplaceTooltips';
import type { HeroData } from '../../types/hero';

interface ListHeroModalProps {
  hero: HeroData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListHeroModal({ hero, isOpen, onClose }: ListHeroModalProps) {
  const { list } = useMarketplace();
  const [price, setPrice] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  React.useEffect(() => {
    if (hero && isOpen) {
      setPrice('');
      setError('');
    }
  }, [hero, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hero) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Precio debe ser mayor a 0');
      return;
    }

    if (priceNum > 1000) {
      setError('Precio máximo es 1000 CORE');
      return;
    }

    // Mostrar confirmación antes de listar
    confirm({
      title: 'Confirmar listado',
      message: `¿Estás seguro de que quieres listar ${hero.name} por ${priceNum} CORE?`,
      confirmText: 'Listar',
      cancelText: 'Cancelar',
      variant: 'warning'
    }, async () => {
      setIsLoading(true);
      setError('');

      try {
        await list({
          tokenId: hero.id,
          name: hero.name,
          priceCore: priceNum,
          seller: '', // El seller se obtiene de la wallet conectada
          isOwn: true,
          level: hero.level,
          class: hero.class,
          power: hero.power
        });
        onClose();
      } catch (err) {
        setError('Error al listar el héroe');
      } finally {
        setIsLoading(false);
      }
    });
  };

  if (!isOpen || !hero) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="heading text-xl">Listar Héroe</h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Información del héroe */}
          <div className="bg-surface/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                ⚔️
              </div>
              <div>
                <h3 className="heading">{hero.name}</h3>
                <p className="text-sm text-text-secondary">ID: #{String(hero.id)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-text-secondary">Clase:</span>
                <div className="font-semibold">{hero.class}</div>
              </div>
              <div>
                <span className="text-text-secondary">Nivel:</span>
                <div className="font-semibold">{hero.level}</div>
              </div>
              <div>
                <span className="text-text-secondary">Poder:</span>
                <div className="font-semibold">{hero.power}</div>
              </div>
            </div>
          </div>

          {/* Formulario de precio */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Precio en CORE
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                max="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.50"
                required
                aria-describedby="price-help"
              />
              <p id="price-help" className="text-xs text-text-secondary mt-1">
                Precio mínimo: 0.01 CORE | Máximo: 1000 CORE
              </p>
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            {/* Acciones */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isLoading}
                disabled={!price || parseFloat(price) <= 0}
              >
                Listar Héroe
              </Button>
            </div>
          </form>

          {/* Información adicional */}
          <div className="text-xs text-text-secondary space-y-1">
            <p>• El héroe será transferido al contrato del marketplace</p>
            <p>• Podrás cancelar el listado en cualquier momento</p>
            <p>• Comisión del marketplace: 2.5%</p>
          </div>
        </div>
      </Card>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmOptions.title || 'Confirmar'}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText || 'Confirmar'}
        cancelText={confirmOptions.cancelText || 'Cancelar'}
        variant={confirmOptions.variant || 'danger'}
        isLoading={isLoading}
      />
    </div>
  );
}
