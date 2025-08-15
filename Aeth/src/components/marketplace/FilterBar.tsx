import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import React from 'react';
import { useMarketplace } from '../../hooks/useMarketplace';

interface FilterBarProps {
  onFilterChange: (f: { q: string; min?: number; max?: number }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const { list } = useMarketplace();
  const [name, setName] = React.useState('Nuevo Héroe');
  const [price, setPrice] = React.useState(0.5);
  const [tokenId, setTokenId] = React.useState(99);

  const [q, setQ] = React.useState('');
  const [min, setMin] = React.useState<number | ''>('');
  const [max, setMax] = React.useState<number | ''>('');

  React.useEffect(() => {
    const filter: { q: string; min?: number; max?: number } = { q };
    if (min !== '') filter.min = Number(min);
    if (max !== '') filter.max = Number(max);
    onFilterChange(filter);
  }, [q, min, max, onFilterChange]);

  return (
    <Card>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 items-end">
        <Input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" className="sm:col-span-3 lg:col-span-3" />
        <Input type="number" step="0.01" value={min} onChange={(e) => setMin(e.target.value === '' ? '' : Number(e.target.value))} aria-label="Min CORE" placeholder="Min CORE" />
        <Input type="number" step="0.01" value={max} onChange={(e) => setMax(e.target.value === '' ? '' : Number(e.target.value))} aria-label="Max CORE" placeholder="Max CORE" />
        <Input type="number" value={tokenId} onChange={(e) => setTokenId(Number(e.target.value))} aria-label="TokenId" />
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre" />
        <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} aria-label="Precio CORE" />
        <Button onClick={() => list({ tokenId: BigInt(tokenId), name, priceCore: price, seller: '0xYOU', isOwn: true })} className="w-full sm:w-auto text-sm">Listar</Button>
      </div>
    </Card>
  );
}


