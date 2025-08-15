// @ts-nocheck
import React from 'react';
import Card from '../ui/Card';
import { useActivity } from '../../hooks/useActivity';

const TYPES: { label: string; value: string }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Stake', value: 'stake' },
  { label: 'Unstake', value: 'unstake' },
  { label: 'Claim', value: 'claim' },
  { label: 'Evolución', value: 'evolution' },
  { label: 'Compra', value: 'buy' },
  { label: 'Listado', value: 'list' },
  { label: 'Retiro', value: 'unlist' },
];

export default function ActivityList() {
  const { items } = useActivity();
  const [type, setType] = React.useState('all');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');

  const filtered = items.filter((it) => {
    if (type !== 'all' && it.type !== type) return false;
    if (from && it.timestamp < new Date(from).getTime()) return false;
    if (to && it.timestamp > new Date(to).getTime()) return false;
    return true;
  });

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-text-secondary">Tipo</label>
            <select className="bg-surface border border-white/10 rounded px-2 py-1 text-xs sm:text-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de actividad">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-text-secondary">Desde</label>
            <input type="date" className="bg-surface border border-white/10 rounded px-2 py-1 text-xs sm:text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-text-secondary">Hasta</label>
            <input type="date" className="bg-surface border border-white/10 rounded px-2 py-1 text-xs sm:text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="text-text-secondary text-xs sm:text-sm py-4 sm:py-6">Sin actividad todavía.</div>
          ) : (
            filtered.map((it) => (
              <div key={it.id} className="py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="heading text-xs sm:text-sm">{it.summary}</div>
                  {it.details && <div className="text-xs text-text-secondary break-words">{it.details}</div>}
                  {it.details?.includes('hash:') && (
                    <a
                      className="text-xs text-primary underline"
                      href={`https://scan.test2.btcs.network/tx/${(it.details.split('hash:')[1]||'').trim()}`}
                      target="_blank" rel="noreferrer"
                    >View on CoreScan</a>
                  )}
                </div>
                <div className="text-xs text-text-secondary whitespace-nowrap">{new Date(it.timestamp).toLocaleString('es-MX')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}



