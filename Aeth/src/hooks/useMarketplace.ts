// @ts-nocheck
import React from 'react';
import { mockStore } from '../lib/mockStore';
import type { ListingItem } from '../types/marketplace';
import { useToast } from '../lib/notifications';
import { isMockMode } from '../lib/utils';
import { pushActivity } from './useActivity';

export function useMarketplace() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const { show } = useToast();

  React.useEffect(() => mockStore.subscribe(force), []);

  const listings = React.useMemo<ListingItem[]>(() => mockStore.getListings(), [force]);

  const buy = React.useCallback((id: string) => {
    if (!isMockMode()) return;
    mockStore.removeListing(id);
    show('Compra simulada completada.', 'success');
    pushActivity('buy', `Compra de listado ${id}`);
  }, [show]);

  const list = React.useCallback((item: Omit<ListingItem, 'id'>) => {
    if (!isMockMode()) return;
    const id = Math.random().toString(36).slice(2);
    mockStore.addListing({ ...item, id });
    show('Listado simulado publicado.', 'success');
    pushActivity('list', `Listado de #${String(item.tokenId)} por ${item.priceCore} CORE`);
  }, [show]);

  const unlist = React.useCallback((id: string) => {
    if (!isMockMode()) return;
    mockStore.removeListing(id);
    show('Listado simulado retirado.', 'success');
    pushActivity('unlist', `Retiro de listado ${id}`);
  }, [show]);

  const toggleFavorite = React.useCallback((id: string) => {
    if (!isMockMode()) return;
    mockStore.toggleFavorite(id);
  }, []);

  const sort = React.useCallback((field: 'price' | 'name', order: 'asc' | 'desc') => {
    mockStore.sortBy(field, order);
  }, []);

  return { listings, buy, list, unlist, toggleFavorite, sort };
}


