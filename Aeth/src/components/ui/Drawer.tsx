// @ts-nocheck
import React from 'react';

interface DrawerProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Cerrar" />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-surface border-l border-white/10 p-3 sm:p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="heading text-lg sm:text-xl">{title}</h2>
          <button className="btn-ghost px-2 sm:px-3 py-1 text-sm" onClick={onClose}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}


