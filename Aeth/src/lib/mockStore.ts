// Sencillo store global para estado simulado (staking, etc.)
// No usa dependencias externas; listeners para re-render en hooks.

type Listener = () => void;

class MockStore {
  private stakedIds = new Set<string>();
  private listeners: Listener[] = [];
  private activity: { id: string; type: string; summary: string; timestamp: number; details?: string }[] = [];
  private listings: { id: string; tokenId: bigint; name: string; priceCore: number; seller: string; image?: string; isOwn?: boolean }[] = [
    { id: 'L1', tokenId: 1n, name: 'Ixchel', priceCore: 1.25, seller: '0xSellerA', image: '', isOwn: false, favorite: false },
    { id: 'L2', tokenId: 3n, name: 'Quetzal', priceCore: 0.75, seller: '0xSellerB', image: '', isOwn: true, favorite: true },
  ];

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  isStaked(id: bigint): boolean {
    return this.stakedIds.has(id.toString());
  }

  setStaked(ids: bigint[], value: boolean) {
    for (const id of ids) {
      const key = id.toString();
      if (value) this.stakedIds.add(key);
      else this.stakedIds.delete(key);
    }
    this.emit();
  }

  // Marketplace
  getListings() {
    return this.listings;
  }
  addListing(listing: { id: string; tokenId: bigint; name: string; priceCore: number; seller: string; image?: string; isOwn?: boolean }) {
    this.listings = [listing, ...this.listings];
    this.emit();
  }
  removeListing(id: string) {
    this.listings = this.listings.filter((l) => l.id !== id);
    this.emit();
  }
  toggleFavorite(id: string) {
    this.listings = this.listings.map((l) => l.id === id ? { ...l, favorite: !l.favorite } : l);
    this.emit();
  }
  sortBy(field: 'price' | 'name', order: 'asc' | 'desc') {
    const dir = order === 'asc' ? 1 : -1;
    if (field === 'price') this.listings = [...this.listings].sort((a,b) => (a.priceCore - b.priceCore) * dir);
    else this.listings = [...this.listings].sort((a,b) => a.name.localeCompare(b.name) * dir);
    this.emit();
  }

  // Activity
  pushActivity(type: string, summary: string, details?: string) {
    const id = Math.random().toString(36).slice(2);
    this.activity = [{ id, type, summary, details, timestamp: Date.now() }, ...this.activity].slice(0, 50);
    this.emit();
  }
  getActivity() { return this.activity; }
}

export const mockStore = new MockStore();


