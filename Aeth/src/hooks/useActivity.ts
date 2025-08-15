// @ts-nocheck
import React from 'react';
import type { ActivityItem, ActivityType } from '../types/activity';

// Store simple de actividad en memoria
const activityStore = {
  items: [] as Array<{id: string; type: string; message: string; details?: string; timestamp: number}>,
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  notify() {
    this.listeners.forEach(listener => listener());
  },
  
  getActivity() {
    return this.items.slice().reverse();
  },
  
  pushActivity(type: string, message: string, details?: string) {
    this.items.push({
      id: Math.random().toString(36).slice(2),
      type,
      message,
      details,
      timestamp: Date.now()
    });
    // Mantener solo los últimos 50 items
    if (this.items.length > 50) {
      this.items = this.items.slice(-50);
    }
    this.notify();
  }
};

export function useActivity() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => activityStore.subscribe(force), []);
  const items = React.useMemo<ActivityItem[]>(() => activityStore.getActivity() as any, [force]);
  return { items };
}

export function pushActivity(type: ActivityType, summary: string, details?: string) {
  activityStore.pushActivity(type, summary, details);
}


