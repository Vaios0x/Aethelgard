// @ts-nocheck
import React from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { authorizedFetch, getToken } from '../lib/api';
import type { HeroData } from '../types/hero';

export function useUserHeroes() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { heroNft, staking } = useAethelgardContracts();
  const [heroes, setHeroes] = React.useState<HeroData[]>([]);
  const [isLoading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!address) { setHeroes([]); return; }
    if (!heroNft.isConfigured) { setHeroes([]); return; }
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Si hay JWT, preferimos el backend (más rápido con caché y resolve IPFS)
        if (getToken()) {
          const res = await authorizedFetch('/users/me/heroes');
          if (res.ok) {
            const json = await res.json();
            const heroesFromApi = (json.heroes || []).map((h: any) => ({
              id: BigInt(h.id),
              name: h.name,
              image: h.image,
              level: h.level,
              class: h.class,
              power: h.power,
              staked: false,
              description: h.description,
              attributes: h.attributes,
            }));
            if (mounted) setHeroes(heroesFromApi);
            return;
          }
        }

        const balance = await publicClient!.readContract({
          address: heroNft.address,
          abi: heroNft.abi,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;

        const ids: bigint[] = [];
        for (let i = 0n; i < balance; i++) {
          const id = await publicClient!.readContract({
            address: heroNft.address,
            abi: heroNft.abi,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, i],
          }) as bigint;
          ids.push(id);
        }

        const results = await Promise.all(ids.map(async (id) => {
          const tokenUri = await publicClient!.readContract({
            address: heroNft.address,
            abi: heroNft.abi,
            functionName: 'tokenURI',
            args: [id],
          }) as string;
          let metadata: any = {};
          try {
            const url = tokenUri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${tokenUri.replace('ipfs://','')}` : tokenUri;
            const res = await fetch(url);
            metadata = await res.json();
          } catch {}
          let isStaked = false;
          if (staking.isConfigured) {
            isStaked = await publicClient!.readContract({ address: staking.address, abi: staking.abi, functionName: 'isStaked', args: [id] }) as boolean;
          }
          const hero: HeroData = {
            id,
            name: metadata.name ?? `Héroe #${id}`,
            image: metadata.image ?? '',
            level: Number(metadata.level ?? 1),
            class: metadata.class ?? 'Warrior',
            power: Number(metadata.power ?? 0),
            staked: isStaked,
            description: metadata.description,
          } as unknown as HeroData;
          if (metadata.attributes) {
            hero.attributes = {
              strength: Number(metadata.attributes.strength ?? 10),
              agility: Number(metadata.attributes.agility ?? 10),
              intellect: Number(metadata.attributes.intellect ?? 10),
            } as any;
          }
          return hero;
        }));
        if (mounted) setHeroes(results);
      } catch (e) {
        console.error(e);
        if (mounted) setHeroes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [address, heroNft.address, heroNft.abi, heroNft.isConfigured, publicClient, staking.address, staking.abi, staking.isConfigured]);

  return { heroes, isLoading };
}

export function useHeroById(id: bigint) {
  const { heroes, isLoading } = useUserHeroes();
  const hero = React.useMemo(() => heroes.find((h: HeroData) => h.id === id), [heroes, id]);
  return { hero, isLoading };
}


