export type ActivityType = 
  | 'stake' 
  | 'unstake' 
  | 'claim' 
  | 'evolution' 
  | 'buy' 
  | 'list' 
  | 'unlist'
  | 'transfer'
  | 'mint'
  | 'approve'
  | 'error'
  | 'system';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  summary: string;
  details?: string;
  timestamp: number;
  // Campos adicionales para mejor tracking
  txHash?: string;
  tokenId?: string;
  amount?: string;
  status?: 'pending' | 'success' | 'failed';
  metadata?: Record<string, any>;
}

export interface ActivityFilters {
  type?: ActivityType;
  from?: Date;
  to?: Date;
  status?: 'pending' | 'success' | 'failed';
  tokenId?: string;
}

export interface ActivityStats {
  total: number;
  byType: Record<ActivityType, number>;
  byStatus: Record<string, number>;
  recentActivity: ActivityItem[];
}


