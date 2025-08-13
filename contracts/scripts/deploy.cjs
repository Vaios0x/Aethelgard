const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const Hero = await hre.ethers.getContractFactory('MockHeroNFT');
  const hero = await Hero.deploy();
  await hero.waitForDeployment();
  console.log('MockHeroNFT:', await hero.getAddress());

  const mintTx = await hero.mint(deployer.address, 3);
  await mintTx.wait();

  const Staking = await hre.ethers.getContractFactory('MockStaking');
  const staking = await Staking.deploy(await hero.getAddress());
  await staking.waitForDeployment();
  console.log('MockStaking:', await staking.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


