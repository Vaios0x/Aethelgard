// @ts-nocheck
import Card from '../ui/Card';
import { useAccount } from 'wagmi';
import { shortenAddress, isMockMode } from '../../lib/utils';

export default function UserProfile() {
  const { address, chain } = useAccount();
  return (
    <Card className="flex items-center justify-between">
      <div>
        <h2 className="heading text-xl">Perfil</h2>
        <p className="text-text-secondary text-sm">Red: {isMockMode() ? 'Mock' : (chain?.name ?? '—')}</p>
      </div>
      <div className="text-primary font-semibold">{isMockMode() ? '0xDE...MOCK' : shortenAddress(address)}</div>
    </Card>
  );
}


