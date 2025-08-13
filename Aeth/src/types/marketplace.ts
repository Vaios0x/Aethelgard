export interface ListingItem {
  id: string; // unique listing id
  tokenId: bigint;
  name: string;
  image?: string;
  priceCore: number; // precio en CORE (mock)
  seller: string; // address
  isOwn?: boolean; // en mocks, si es del usuario
  favorite?: boolean; // flag UI
}


