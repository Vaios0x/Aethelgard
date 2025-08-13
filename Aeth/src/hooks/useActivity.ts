// @ts-nocheck
import React from 'react';
import { mockStore } from '../lib/mockStore';
import type { ActivityItem, ActivityType } from '../types/activity';

export function useActivity() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => mockStore.subscribe(force), []);
  const items = React.useMemo<ActivityItem[]>(() => mockStore.getActivity() as any, [force]);
  return { items };
}

export function pushActivity(type: ActivityType, summary: string, details?: string) {
  mockStore.pushActivity(type, summary, details);
}


