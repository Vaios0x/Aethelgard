export type ActivityType = 'stake' | 'unstake' | 'claim' | 'evolution' | 'buy' | 'list' | 'unlist';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  summary: string;
  timestamp: number; // ms since epoch
  details?: string;
}


