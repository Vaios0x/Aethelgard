import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const Hero = await ethers.getContractFactory('MockHeroNFT');
  const hero = await Hero.deploy();
  await hero.waitForDeployment();
  console.log('MockHeroNFT:', await hero.getAddress());

  // Mint inicial al deployer
  const mintTx = await hero.mint(deployer.address, 3);
  await mintTx.wait();

  const Staking = await ethers.getContractFactory('MockStaking');
  const staking = await Staking.deploy(await hero.getAddress());
  await staking.waitForDeployment();
  console.log('MockStaking:', await staking.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


