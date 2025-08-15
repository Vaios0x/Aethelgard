// @ts-nocheck
import Card from '../ui/Card';
import { useAccount } from 'wagmi';
import { shortenAddress } from '../../lib/utils';

export default function UserProfile() {
  const { address, chain } = useAccount();
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h2 className="heading text-lg sm:text-xl">Perfil</h2>
        <p className="text-text-secondary text-xs sm:text-sm">Red: {chain?.name ?? '—'}</p>
      </div>
      <div className="text-primary font-semibold text-xs sm:text-sm lg:text-base break-all">{shortenAddress(address)}</div>
    </Card>
  );
}


