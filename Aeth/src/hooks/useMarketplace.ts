// @ts-nocheck
import React from 'react';
import { mockStore } from '../lib/mockStore';
import type { ListingItem } from '../types/marketplace';
import { useToast } from '../lib/notifications';
import { isMockMode } from '../lib/utils';
import { pushActivity } from './useActivity';
import { useAethelgardContracts } from './useAethelgardContracts';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { authorizedFetch } from '../lib/api';

export function useMarketplace() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const { show } = useToast();
  const { marketplace, heroNft } = useAethelgardContracts();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  React.useEffect(() => mockStore.subscribe(force), []);

  const [listingsState, setListings] = React.useState<ListingItem[]>([]);
  const listings = listingsState;

  const loadListings = React.useCallback(async () => {
    if (isMockMode() || !marketplace.isConfigured) {
      setListings(mockStore.getListings());
      return;
    }
    try {
      const res = await authorizedFetch('/market/listings');
      if (!res.ok) throw new Error('fetch listings failed');
      const json = await res.json();
      const items: ListingItem[] = (json.listings || []).map((l: any) => ({
        id: l.id,
        tokenId: BigInt(l.tokenId),
        name: `Hero #${l.tokenId}`,
        priceCore: Number(l.priceCore),
        seller: l.seller,
        isOwn: address ? l.seller?.toLowerCase() === address.toLowerCase() : false,
      }));
      setListings(items);
    } catch {
      // fallback a mocks si falla backend
      setListings(mockStore.getListings());
    }
  }, [address, marketplace.isConfigured]);

  // Cargar listados iniciales y ante cambios relevantes
  React.useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await loadListings(); })();
    return () => { mounted = false; };
  }, [loadListings, force]);

  const buy = React.useCallback(async (id: string) => {
    if (isMockMode() || !marketplace.isConfigured) {
      mockStore.removeListing(id);
      show('Compra simulada completada.', 'success');
      pushActivity('buy', `Compra de listado ${id}`);
      setListings(mockStore.getListings());
      return;
    }
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    try {
      const gas = await publicClient!.estimateContractGas({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'buy',
        args: [heroNft.address, listing.tokenId],
        value: BigInt(Math.floor(listing.priceCore * 1e18)),
        account: address as `0x${string}`,
      });
      const hash = await walletClient!.writeContract({
        address: marketplace.address,
        abi: marketplace.abi,
        functionName: 'buy',
        args: [heroNft.address, listing.tokenId],
        value: BigInt(Math.floor(listing.priceCore * 1e18)),
        gas,
      });
      show(`Tx enviada: buy (${hash.slice(0,10)}…)`, 'info');
      pushActivity('buy', `Compra #${String(listing.tokenId)}`, `hash: ${hash}`);
      await publicClient!.waitForTransactionReceipt({ hash });
      show('Compra confirmada', 'success');
      await loadListings();
    } catch (e: any) {
      show(e?.shortMessage || e?.message || 'Compra fallida', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, listings, loadListings]);

  const list = React.useCallback(async (item: Omit<ListingItem, 'id'>) => {
    if (isMockMode() || !marketplace.isConfigured) {
      const id = Math.random().toString(36).slice(2);
      mockStore.addListing({ ...item, id });
      show('Listado simulado publicado.', 'success');
      pushActivity('list', `Listado de #${String(item.tokenId)} por ${item.priceCore} CORE`);
      setListings(mockStore.getListings());
      return;
    }
    try {
      // Asegurar aprobación global
      const approved = await publicClient!.readContract({ address: heroNft.address, abi: heroNft.abi as any, functionName: 'isApprovedForAll', args: [address!, marketplace.address] }) as boolean;
      if (!approved) {
        const gasApprove = await publicClient!.estimateContractGas({ address: heroNft.address, abi: heroNft.abi as any, functionName: 'setApprovalForAll', args: [marketplace.address, true], account: address as `0x${string}` });
        const h = await walletClient!.writeContract({ address: heroNft.address, abi: heroNft.abi as any, functionName: 'setApprovalForAll', args: [marketplace.address, true], gas: gasApprove });
        show(`Aprobando NFT… (${h.slice(0,10)}…)`, 'info');
        await publicClient!.waitForTransactionReceipt({ hash: h });
      }
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
      show(`Tx enviada: list (${hash.slice(0,10)}…)`, 'info');
      pushActivity('list', `Listado #${String(item.tokenId)} por ${item.priceCore} CORE`, `hash: ${hash}`);
      await publicClient!.waitForTransactionReceipt({ hash });
      show('Listado confirmado', 'success');
      await loadListings();
    } catch (e: any) {
      show(e?.shortMessage || e?.message || 'Listado fallido', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, loadListings]);

  const unlist = React.useCallback(async (id: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    if (isMockMode() || !marketplace.isConfigured) {
      mockStore.removeListing(id);
      show('Listado simulado retirado.', 'success');
      pushActivity('unlist', `Retiro de listado ${id}`);
      setListings(mockStore.getListings());
      return;
    }
    try {
      const gas = await publicClient!.estimateContractGas({ address: marketplace.address, abi: marketplace.abi, functionName: 'cancel', args: [heroNft.address, listing.tokenId], account: address as `0x${string}` });
      const hash = await walletClient!.writeContract({ address: marketplace.address, abi: marketplace.abi, functionName: 'cancel', args: [heroNft.address, listing.tokenId], gas });
      show(`Tx enviada: cancel (${hash.slice(0,10)}…)`, 'info');
      pushActivity('unlist', `Retiro listado #${String(listing.tokenId)}`, `hash: ${hash}`);
      await publicClient!.waitForTransactionReceipt({ hash });
      show('Retiro confirmado', 'success');
      await loadListings();
    } catch (e: any) {
      show(e?.shortMessage || e?.message || 'Retiro fallido', 'error');
    }
  }, [address, heroNft.address, marketplace.address, marketplace.abi, publicClient, walletClient, show, listings, loadListings]);

  const toggleFavorite = React.useCallback((id: string) => {
    if (!isMockMode()) return;
    mockStore.toggleFavorite(id);
  }, []);

  const sort = React.useCallback((field: 'price' | 'name', order: 'asc' | 'desc') => {
    mockStore.sortBy(field, order);
  }, []);

  return { listings, buy, list, unlist, toggleFavorite, sort };
}


