import StakingPanel from '../components/staking/StakingPanel';
import EssenceTracker from '../components/staking/EssenceTracker';

export default function StakingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="heading text-2xl sm:text-3xl">El Altar de la Ascensión</h1>
      <EssenceTracker />
      <StakingPanel />
      <div className="text-xs text-text-secondary text-center sm:text-left">Tip: selecciona héroes y usa los botones para Stake/Unstake/Claim. En modo onchain verás los hashes de transacción.</div>
    </div>
  );
}


