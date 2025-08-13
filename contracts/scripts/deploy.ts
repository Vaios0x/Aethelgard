import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // Deploy HeroNFT con baseURI (puede ser IPFS)
  const baseURI = process.env.NFT_BASE_URI || 'ipfs://Qm.../';
  const Hero = await ethers.getContractFactory('HeroNFT');
  const hero = await Hero.deploy(baseURI);
  await hero.waitForDeployment();
  const heroAddr = await hero.getAddress();
  console.log('HeroNFT:', heroAddr);

  // Mint inicial al deployer
  const mintTx = await hero.mint(deployer.address, 3);
  await mintTx.wait();

  const Staking = await ethers.getContractFactory('Staking');
  // rewardPerSecond simple para demo: 1e16 wei (0.01 CORE) virtual; ajusta según economía
  const rewardPerSecond = ethers.parseEther('0.000001');
  const staking = await Staking.deploy(heroAddr, rewardPerSecond);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log('Staking:', stakingAddr);

  const Marketplace = await ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  console.log('Marketplace:', marketAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


