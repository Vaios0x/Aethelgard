export interface HeroAttributes {
  strength: number;
  agility: number;
  intellect: number;
}

export interface HeroData {
  id: bigint;
  name: string;
  image: string;
  level: number;
  class: 'Warrior' | 'Mage' | 'Ranger' | 'Paladin' | 'Assassin' | string;
  power: number;
  staked: boolean;
  attributes?: HeroAttributes;
  description?: string;
}


