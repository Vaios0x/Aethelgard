import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Iniciando deployment de contratos...");

  // Obtener el deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Deploy EssenceToken primero
  console.log("\n🏗️  Deploying EssenceToken...");
  const EssenceToken = await ethers.getContractFactory("EssenceToken");
  const essenceToken = await EssenceToken.deploy();
  await essenceToken.waitForDeployment();
  const essenceTokenAddress = await essenceToken.getAddress();
  console.log("✅ EssenceToken deployed to:", essenceTokenAddress);

  // Deploy HeroNFT con el token de esencia
  console.log("\n🏗️  Deploying HeroNFT...");
  const HeroNFT = await ethers.getContractFactory("HeroNFT");
  const baseURI = "https://api.aethelgard.app/metadata/"; // Cambiar por tu URI real
  const heroNft = await HeroNFT.deploy(baseURI, essenceTokenAddress);
  await heroNft.waitForDeployment();
  const heroNftAddress = await heroNft.getAddress();
  console.log("✅ HeroNFT deployed to:", heroNftAddress);

  // Deploy Staking con reward rate de 1e15 wei por segundo (aproximadamente 31.5 tokens por año)
  console.log("\n🏗️  Deploying Staking...");
  const Staking = await ethers.getContractFactory("Staking");
  const rewardPerSecond = ethers.parseEther("0.000001"); // 1e-6 tokens por segundo
  const staking = await Staking.deploy(heroNftAddress, rewardPerSecond);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking deployed to:", stakingAddress);

  // Deploy Marketplace
  console.log("\n🏗️  Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Configurar autorizaciones
  console.log("\n🔧 Configurando autorizaciones...");

  // Autorizar HeroNFT para mintear esencia
  console.log("📝 Autorizando HeroNFT para mintear esencia...");
  const authorizeTx = await essenceToken.authorizeMinter(heroNftAddress);
  await authorizeTx.wait();
  console.log("✅ HeroNFT autorizado para mintear esencia");

  // Configurar Marketplace para usar HeroNFT
  console.log("📝 Configurando Marketplace...");
  const setHeroTx = await marketplace.setHeroNFT(heroNftAddress);
  await setHeroTx.wait();
  console.log("✅ Marketplace configurado con HeroNFT");

  // Verificar contratos en CoreScan (si estamos en testnet)
  const network = await ethers.provider.getNetwork();
  const isTestnet = network.chainId === 1114n; // Core Testnet2

  if (isTestnet) {
    console.log("\n🔍 Verificando contratos en CoreScan...");
    
    try {
      // Verificar EssenceToken
      await (global as any).hre.run("verify:verify", {
        address: essenceTokenAddress,
        constructorArguments: [],
      });
      console.log("✅ EssenceToken verificado");

      // Verificar HeroNFT
      await (global as any).hre.run("verify:verify", {
        address: heroNftAddress,
        constructorArguments: [baseURI, essenceTokenAddress],
      });
      console.log("✅ HeroNFT verificado");

      // Verificar Staking
      await (global as any).hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [heroNftAddress, rewardPerSecond],
      });
      console.log("✅ Staking verificado");

      // Verificar Marketplace
      await (global as any).hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [],
      });
      console.log("✅ Marketplace verificado");

    } catch (error) {
      console.log("⚠️  Error en verificación:", error);
    }
  }

  // Guardar direcciones
  const deployedAddresses = {
    essenceToken: essenceTokenAddress,
    heroNft: heroNftAddress,
    staking: stakingAddress,
    marketplace: marketplaceAddress,
    network: network.name,
    chainId: network.chainId.toString(),
  };

  console.log("\n📋 Direcciones desplegadas:");
  console.log("EssenceToken:", essenceTokenAddress);
  console.log("HeroNFT:", heroNftAddress);
  console.log("Staking:", stakingAddress);
  console.log("Marketplace:", marketplaceAddress);

  console.log("\n🔗 Enlaces de CoreScan:");
  if (isTestnet) {
    console.log(`EssenceToken: https://scan.test2.btcs.network/address/${essenceTokenAddress}`);
    console.log(`HeroNFT: https://scan.test2.btcs.network/address/${heroNftAddress}`);
    console.log(`Staking: https://scan.test2.btcs.network/address/${stakingAddress}`);
    console.log(`Marketplace: https://scan.test2.btcs.network/address/${marketplaceAddress}`);
  } else {
    console.log(`EssenceToken: https://scan.coredao.org/address/${essenceTokenAddress}`);
    console.log(`HeroNFT: https://scan.coredao.org/address/${heroNftAddress}`);
    console.log(`Staking: https://scan.coredao.org/address/${stakingAddress}`);
    console.log(`Marketplace: https://scan.coredao.org/address/${marketplaceAddress}`);
  }

  console.log("\n📝 Variables de entorno para .env:");
  console.log(`VITE_ESSENCE_TOKEN_${isTestnet ? 'TESTNET' : 'MAINNET'}=${essenceTokenAddress}`);
  console.log(`VITE_HERO_NFT_${isTestnet ? 'TESTNET' : 'MAINNET'}=${heroNftAddress}`);
  console.log(`VITE_STAKING_${isTestnet ? 'TESTNET' : 'MAINNET'}=${stakingAddress}`);
  console.log(`VITE_MARKETPLACE_${isTestnet ? 'TESTNET' : 'MAINNET'}=${marketplaceAddress}`);

  console.log("\n🎉 ¡Deployment completado exitosamente!");
  console.log("💡 Recuerda actualizar las variables de entorno en tu frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en deployment:", error);
    process.exit(1);
  });


