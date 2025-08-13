import StakingPanel from '../components/staking/StakingPanel';
import EssenceTracker from '../components/staking/EssenceTracker';

export default function StakingPage() {
  return (
    <div className="space-y-6">
      <h1 className="heading text-3xl">El Altar de la Ascensión</h1>
      <EssenceTracker />
      <StakingPanel />
    </div>
  );
}


