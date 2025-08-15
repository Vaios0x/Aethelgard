// @ts-nocheck
import React from 'react';
import type { ListingItem, MarketplaceFilters, SortConfig, PaginationConfig } from '../types/marketplace';
import { useToast } from '../lib/notifications';
import { pushActivity } from './useActivity';
import { useAethelgardContracts } from './useAethelgardContracts';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { authorizedFetch } from '../lib/api';
import { marketplaceStore } from '../lib/marketplaceStore';

// Datos de ejemplo para cuando el backend no esté disponible
const MOCK_LISTINGS: ListingItem[] = [
  {
    id: '1',
    tokenId: 1n,
    name: 'Hero #1',
    priceCore: 0.5,
    seller: '0x1234567890123456789012345678901234567890',
    isOwn: false,
    createdAt: Date.now() - 86400000, // 1 día atrás
    level: 5,
    class: 'Warrior',
    power: 150,
    image: '/images/hero-1.svg'
  },
  {
    id: '2',
    tokenId: 2n,
    name: 'Hero #2',
    priceCore: 0.75,
    seller: '0x2345678901234567890123456789012345678901',
    isOwn: false,
    createdAt: Date.now() - 43200000, // 12 horas atrás
    level: 3,
    class: 'Mage',
    power: 120,
    image: '/images/hero-1.svg'
  },
  {
    id: '3',
    tokenId: 3n,
    name: 'Hero #3',
    priceCore: 1.2,
    seller: '0x3456789012345678901234567890123456789012',
    isOwn: false,
    createdAt: Date.now() - 21600000, // 6 horas atrás
    level: 7,
    class: 'Ranger',
    power: 180,
    image: '/images/hero-1.svg'
  },
  {
    id: '4',
    tokenId: 4n,
    name: 'Hero #4',
    priceCore: 0.3,
    seller: '0x4567890123456789012345678901234567890123',
    isOwn: false,
    createdAt: Date.now() - 10800000, // 3 horas atrás
    level: 2,
    class: 'Paladin',
    power: 90,
    image: '/images/hero-1.svg'
  },
  {
    id: '5',
    tokenId: 5n,
    name: 'Hero #5',
    priceCore: 2.0,
    seller: '0x5678901234567890123456789012345678901234',
    isOwn: false,
    createdAt: Date.now() - 3600000, // 1 hora atrás
    level: 10,
    class: 'Assassin',
    power: 250,
    image: '/images/hero-1.svg'
  },
  {
    id: '6',
    tokenId: 6n,
    name: 'Hero #6',
    priceCore: 0.8,
    seller: '0x6789012345678901234567890123456789012345',
    isOwn: false,
    createdAt: Date.now() - 1800000, // 30 minutos atrás
    level: 4,
    class: 'Warrior',
    power: 110,
    image: '/images/hero-1.svg'
  }
];

export function useMarketplace() {
  const { show } = useToast();
  const { marketplace, heroNft } = useAethelgardContracts();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Estado local
  const [rawListings, setRawListings] = React.useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = React.useState(false);

  // Estado del store
  const [storeState, setStoreState] = React.useState({
    favorites: marketplaceStore.getFavorites(),
    filters: marketplaceStore.getFilters(),
    sort: marketplaceStore.getSort(),
    pagination: marketplaceStore.getPagination()
  });

  // Suscribirse a cambios del store
  React.useEffect(() => {
    const unsubscribe = marketplaceStore.subscribe(() => {
      setStoreState({
        favorites: marketplaceStore.getFavorites(),
        filters: marketplaceStore.getFilters(),
        sort: marketplaceStore.getSort(),
        pagination: marketplaceStore.getPagination()
      });
    });
    return unsubscribe;
  }, []);

  // Procesar listings con filtros, ordenamiento y paginación
  const { items: processedListings, total } = React.useMemo(() => {
    return marketplaceStore.processListings(rawListings);
  }, [rawListings]);

  // Cargar listings desde el backend o usar datos de ejemplo
  const loadListings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsUsingMockData(false);

    try {
      // Si el marketplace no está configurado, usar datos de ejemplo
      if (!marketplace.isConfigured) {
        console.log('Marketplace no configurado, usando datos de ejemplo');
        setRawListings(MOCK_LISTINGS);
        setIsUsingMockData(true);
        return;
      }

      // Intentar cargar desde el backend
      const res = await authorizedFetch('/market/listings');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      const items: ListingItem[] = (json.listings || []).map((l: any) => ({
        id: l.id,
        tokenId: BigInt(l.tokenId),
        name: `Hero #${l.tokenId}`,
        priceCore: Number(l.priceCore),
        seller: l.seller,
        isOwn: address ? l.seller?.toLowerCase() === address.toLowerCase() : false,
        createdAt: l.createdAt || Date.now(),
        level: l.level || 1,
        class: l.class || 'Warrior',
        power: l.power || 0,
        image: l.image || undefined
      }));

      setRawListings(items);
      setIsUsingMockData(false);
    } catch (error) {
      console.error('Error loading listings:', error);
      
      // Si hay error, usar datos de ejemplo
      if (error instanceof Error && error.message.includes('backend-offline')) {
        setError('Backend no disponible. Mostrando datos de ejemplo.');
        setRawListings(MOCK_LISTINGS);
        setIsUsingMockData(true);
      } else {
        setError('Error al cargar listados. Mostrando datos de ejemplo.');
        setRawListings(MOCK_LISTINGS);
        setIsUsingMockData(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [address, marketplace.isConfigured]);

  // Cargar listings iniciales y ante cambios relevantes
  React.useEffect(() => {
    let mounted = true;
    (async () => { 
      if (mounted) await loadListings(); 
    })();
    return () => { mounted = false; };
  }, [loadListings]);

  // Función de compra mejorada
  const buy = React.useCallback(async (id: string) => {
    if (isUsingMockData) {
      show('Modo demo: Esta es una simulación de compra', 'info');
      pushActivity('buy', `Compra simulada #${id}`, 'demo mode');
      return;
    }

    if (!marketplace.isConfigured) {
      show('Marketplace no configurado', 'error');
      return;
    }

    const listing = rawListings.find(l => l.id === id);
    if (!listing) {
      show('Listado no encontrado', 'error');
      return;
    }

    try {
      // Verificar balance de CORE
      const balance = await publicClient!.getBalance({ address: address as `0x${string}` });
      const requiredAmount = BigInt(Math.floor(listing.priceCore * 1e18));
      
      if (balance < requiredAmount) {
        show('Saldo insuficiente de CORE', 'error');
        return;
      }

      // Estimar gas
      const gas = await publicClient!.estimateContractGas({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'buy',
        args: [heroNft.address, listing.tokenId],
        value: requiredAmount,
        account: address as `0x${string}`,
      });

      // Enviar transacción
      const hash = await walletClient!.writeContract({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'buy',
        args: [heroNft.address, listing.tokenId],
        value: requiredAmount,
        gas,
      });

      show(`Transacción enviada: Compra #${String(listing.tokenId)} (${hash.slice(0,10)}…)`, 'info');
      pushActivity('buy', `Compra #${String(listing.tokenId)} por ${listing.priceCore} CORE`, `hash: ${hash}`);

      // Esperar confirmación
      await publicClient!.waitForTransactionReceipt({ hash });
      show('¡Compra exitosa! El héroe es tuyo.', 'success');

      // Recargar listings
      await loadListings();
    } catch (e: any) {
      console.error('Error en compra:', e);
      show(e?.shortMessage || e?.message || 'Error en la compra', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, rawListings, loadListings, isUsingMockData]);

  // Función de listado mejorada
  const list = React.useCallback(async (item: Omit<ListingItem, 'id'>) => {
    if (isUsingMockData) {
      show('Modo demo: Esta es una simulación de listado', 'info');
      pushActivity('list', `Listado simulado #${String(item.tokenId)} por ${item.priceCore} CORE`, 'demo mode');
      return;
    }

    if (!marketplace.isConfigured) {
      show('Marketplace no configurado', 'error');
      return;
    }

    try {
      // Verificar que el usuario es dueño del NFT
      const owner = await publicClient!.readContract({
        address: heroNft.address,
        abi: heroNft.abi as any,
        functionName: 'ownerOf',
        args: [item.tokenId]
      });

      if (owner.toLowerCase() !== address?.toLowerCase()) {
        show('No eres dueño de este héroe', 'error');
        return;
      }

      // Asegurar aprobación global
      const approved = await publicClient!.readContract({ 
        address: heroNft.address, 
        abi: heroNft.abi as any, 
        functionName: 'isApprovedForAll', 
        args: [address!, marketplace.address] 
      }) as boolean;

      if (!approved) {
        const gasApprove = await publicClient!.estimateContractGas({ 
          address: heroNft.address, 
          abi: heroNft.abi as any, 
          functionName: 'setApprovalForAll', 
          args: [marketplace.address, true], 
          account: address as `0x${string}` 
        });
        
        const h = await walletClient!.writeContract({ 
          address: heroNft.address, 
          abi: heroNft.abi as any, 
          functionName: 'setApprovalForAll', 
          args: [marketplace.address, true], 
          gas: gasApprove 
        });
        
        show(`Aprobando NFT… (${h.slice(0,10)}…)`, 'info');
        await publicClient!.waitForTransactionReceipt({ hash: h });
      }

      // Listar el NFT
      const gas = await publicClient!.estimateContractGas({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'list',
        args: [heroNft.address, item.tokenId, BigInt(Math.floor(item.priceCore * 1e18))],
        account: address as `0x${string}`,
      });

      const hash = await walletClient!.writeContract({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'list',
        args: [heroNft.address, item.tokenId, BigInt(Math.floor(item.priceCore * 1e18))],
        gas,
      });

      show(`Listado enviado: #${String(item.tokenId)} por ${item.priceCore} CORE (${hash.slice(0,10)}…)`, 'info');
      pushActivity('list', `Listado #${String(item.tokenId)} por ${item.priceCore} CORE`, `hash: ${hash}`);

      await publicClient!.waitForTransactionReceipt({ hash });
      show('¡Listado exitoso! Tu héroe está en el mercado.', 'success');

      await loadListings();
    } catch (e: any) {
      console.error('Error en listado:', e);
      show(e?.shortMessage || e?.message || 'Error en el listado', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, loadListings, isUsingMockData]);

  // Función de cancelación mejorada
  const unlist = React.useCallback(async (id: string) => {
    if (isUsingMockData) {
      show('Modo demo: Esta es una simulación de cancelación', 'info');
      pushActivity('unlist', `Cancelación simulada #${id}`, 'demo mode');
      return;
    }

    const listing = rawListings.find(l => l.id === id);
    if (!listing) {
      show('Listado no encontrado', 'error');
      return;
    }

    if (!marketplace.isConfigured) {
      show('Marketplace no configurado', 'error');
      return;
    }

    try {
      const gas = await publicClient!.estimateContractGas({ 
        address: marketplace.address, 
        abi: marketplace.abi, 
        functionName: 'cancel', 
        args: [heroNft.address, listing.tokenId], 
        account: address as `0x${string}` 
      });
      
      const hash = await walletClient!.writeContract({ 
        address: marketplace.address, 
        abi: marketplace.abi, 
        functionName: 'cancel', 
        args: [heroNft.address, listing.tokenId], 
        gas 
      });
      
      show(`Cancelación enviada: #${String(listing.tokenId)} (${hash.slice(0,10)}…)`, 'info');
      pushActivity('unlist', `Retiro listado #${String(listing.tokenId)}`, `hash: ${hash}`);
      
      await publicClient!.waitForTransactionReceipt({ hash });
      show('¡Listado cancelado! Tu héroe ha vuelto a tu inventario.', 'success');
      
      await loadListings();
    } catch (e: any) {
      console.error('Error en cancelación:', e);
      show(e?.shortMessage || e?.message || 'Error en la cancelación', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, rawListings, loadListings, isUsingMockData]);

  // Funciones de favoritos
  const toggleFavorite = React.useCallback((id: string) => {
    const isFavorite = marketplaceStore.toggleFavorite(id);
    show(isFavorite ? 'Añadido a favoritos' : 'Removido de favoritos', 'info');
  }, [show]);

  // Funciones de ordenamiento
  const handleSort = React.useCallback((field: 'price' | 'name' | 'level' | 'power' | 'createdAt', order: 'asc' | 'desc') => {
    marketplaceStore.setSort({ field, order });
  }, []);

  // Funciones de filtros
  const setFilters = React.useCallback((filters: Partial<MarketplaceFilters>) => {
    marketplaceStore.setFilters(filters);
  }, []);

  const clearFilters = React.useCallback(() => {
    marketplaceStore.clearFilters();
    show('Filtros limpiados', 'info');
  }, [show]);

  // Funciones de paginación
  const setPage = React.useCallback((page: number) => {
    marketplaceStore.setPage(page);
  }, []);

  const setPageSize = React.useCallback((pageSize: number) => {
    marketplaceStore.setPageSize(pageSize);
  }, []);

  // Funciones de favoritos
  const clearFavorites = React.useCallback(() => {
    marketplaceStore.clearFavorites();
    show('Favoritos limpiados', 'info');
  }, [show]);

  return {
    // Estado
    listings: processedListings,
    rawListings,
    isLoading,
    error,
    isUsingMockData,
    
    // Configuración
    filters: storeState.filters,
    sort: storeState.sort,
    pagination: storeState.pagination,
    favorites: storeState.favorites,
    
    // Acciones principales
    buy,
    list,
    unlist,
    
    // Favoritos
    toggleFavorite,
    clearFavorites,
    
    // Ordenamiento
    sort: handleSort,
    
    // Filtros
    setFilters,
    clearFilters,
    
    // Paginación
    setPage,
    setPageSize,
    
    // Utilidades
    loadListings,
    total
  };
}


