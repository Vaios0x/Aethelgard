// ABI mínimos para ERC721 y Staking. Reemplaza con tus ABIs reales al integrar.

export const HERO_NFT_ABI = [
  { "type": "function", "name": "balanceOf", "stateMutability": "view", "inputs": [{ "name": "owner", "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "tokenOfOwnerByIndex", "stateMutability": "view", "inputs": [{ "name": "owner", "type": "address" }, { "name": "index", "type": "uint256" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "tokenURI", "stateMutability": "view", "inputs": [{ "name": "tokenId", "type": "uint256" }], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "ownerOf", "stateMutability": "view", "inputs": [{ "name": "tokenId", "type": "uint256" }], "outputs": [{ "type": "address" }] },
  { "type": "function", "name": "evolve", "stateMutability": "nonpayable", "inputs": [{ "name": "tokenId", "type": "uint256" }], "outputs": [] },
  { "type": "function", "name": "mintSelf", "stateMutability": "nonpayable", "inputs": [{ "name": "qty", "type": "uint256" }], "outputs": [] },
] as const;

export const STAKING_ABI = [
  { "type": "function", "name": "stake", "stateMutability": "nonpayable", "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "outputs": [] },
  { "type": "function", "name": "unstake", "stateMutability": "nonpayable", "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "outputs": [] },
  { "type": "function", "name": "claimRewards", "stateMutability": "nonpayable", "inputs": [{ "name": "tokenIds", "type": "uint256[]" }], "outputs": [] },
  { "type": "function", "name": "pendingRewards", "stateMutability": "view", "inputs": [{ "name": "user", "type": "address" }], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "isStaked", "stateMutability": "view", "inputs": [{ "name": "tokenId", "type": "uint256" }], "outputs": [{ "type": "bool" }] },
] as const;

// Marketplace mínimo: list/buy/cancel + lectura de listados opcional
export const MARKETPLACE_ABI = [
  { "type": "function", "name": "list", "stateMutability": "nonpayable", "inputs": [
    { "name": "nft", "type": "address" },
    { "name": "tokenId", "type": "uint256" },
    { "name": "price", "type": "uint256" }
  ], "outputs": [] },
  { "type": "function", "name": "buy", "stateMutability": "payable", "inputs": [
    { "name": "nft", "type": "address" },
    { "name": "tokenId", "type": "uint256" }
  ], "outputs": [] },
  { "type": "function", "name": "cancel", "stateMutability": "nonpayable", "inputs": [
    { "name": "nft", "type": "address" },
    { "name": "tokenId", "type": "uint256" }
  ], "outputs": [] },
] as const;


