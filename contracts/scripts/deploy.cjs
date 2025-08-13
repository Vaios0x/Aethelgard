const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const baseURI = process.env.NFT_BASE_URI || 'ipfs://Qm.../';

  // HeroNFT
  const Hero = await hre.ethers.getContractFactory('HeroNFT');
  const hero = await Hero.deploy(baseURI);
  await hero.waitForDeployment();
  const heroAddr = await hero.getAddress();
  console.log('HeroNFT:', heroAddr);

  // Mint inicial
  const mintTx = await hero.mint(deployer.address, 3);
  await mintTx.wait();

  // Staking
  const Staking = await hre.ethers.getContractFactory('Staking');
  const rewardPerSecond = hre.ethers.parseEther('0.000001');
  const staking = await Staking.deploy(heroAddr, rewardPerSecond);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log('Staking:', stakingAddr);

  // Marketplace
  const Marketplace = await hre.ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.deploy(deployer.address);
  await marketplace.waitForDeployment();
  const marketAddr = await marketplace.getAddress();
  console.log('Marketplace:', marketAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


