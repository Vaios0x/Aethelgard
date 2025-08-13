import { useToast } from '../../lib/notifications';

export default function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-[92vw] max-w-sm" role="region" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`rounded-md px-4 py-3 shadow-glow border ${
          t.variant === 'success' ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-200' :
          t.variant === 'error' ? 'bg-red-600/20 border-red-500/40 text-red-200' :
          'bg-surface border-white/10 text-text-primary'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{t.message}</p>
            <button className="text-xs opacity-70 hover:opacity-100" onClick={() => dismiss(t.id)} aria-label="Cerrar notificación">Cerrar</button>
          </div>
        </div>
      ))}
    </div>
  );
}


