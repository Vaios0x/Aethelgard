#!/usr/bin/env node

/**
 * Script para verificar la configuración de Core Testnet2
 * Ejecutar con: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Core Testnet2...\n');

// Verificar archivo .env
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

let envExists = false;
let envContent = '';

try {
  if (fs.existsSync(envPath)) {
    envExists = true;
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Archivo .env encontrado');
  } else {
    console.log('❌ Archivo .env no encontrado');
  }
} catch (error) {
  console.log('❌ Error leyendo archivo .env:', error.message);
}

// Verificar variables de entorno requeridas
const requiredVars = [
  'VITE_HERO_NFT_TESTNET',
  'VITE_STAKING_TESTNET', 
  'VITE_MARKETPLACE_TESTNET',
  'VITE_BACKEND_URL'
];

const contractAddresses = {
  'VITE_HERO_NFT_TESTNET': '0x5b33069977773557D07023A73468fD16F83ebaea',
  'VITE_STAKING_TESTNET': '0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637',
  'VITE_MARKETPLACE_TESTNET': '0xAf59e08968446664acE238d3B3415179e5E2E428'
};

console.log('\n📋 Variables de entorno:');
requiredVars.forEach(varName => {
  if (envExists) {
    const match = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'));
    if (match) {
      const value = match[1].trim();
      if (contractAddresses[varName]) {
        if (value === contractAddresses[varName]) {
          console.log(`✅ ${varName}: ${value}`);
        } else {
          console.log(`⚠️  ${varName}: ${value} (esperado: ${contractAddresses[varName]})`);
        }
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: No encontrada`);
    }
  } else {
    console.log(`❌ ${varName}: No verificada (falta .env)`);
  }
});

// Verificar archivos de configuración
console.log('\n📁 Archivos de configuración:');

const configFiles = [
  'src/constants/index.ts',
  'src/lib/wagmi.ts',
  'src/hooks/useAethelgardContracts.ts'
];

configFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath}: No encontrado`);
  }
});

// Verificar ABIs
console.log('\n📄 Archivos ABI:');

const abiFiles = [
  'src/constants/abis/HeroNFT.json',
  'src/constants/abis/Staking.json', 
  'src/constants/abis/Marketplace.json'
];

abiFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const abi = JSON.parse(content);
    if (abi.abi && Array.isArray(abi.abi)) {
      console.log(`✅ ${filePath} (${abi.abi.length} funciones)`);
    } else {
      console.log(`⚠️  ${filePath}: ABI inválido`);
    }
  } else {
    console.log(`❌ ${filePath}: No encontrado`);
  }
});

// Verificar package.json
console.log('\n📦 Dependencias:');

const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['wagmi', '@rainbow-me/rainbowkit', 'viem', 'react', 'react-dom'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`);
    } else {
      console.log(`❌ ${dep}: No encontrada`);
    }
  });
} else {
  console.log('❌ package.json: No encontrado');
}

// Resumen
console.log('\n🎯 Resumen:');
console.log('Para que Aethelgard funcione en Core Testnet2:');
console.log('1. Crea un archivo .env basado en env.example');
console.log('2. Configura las variables de entorno con las direcciones correctas');
console.log('3. Ejecuta npm run dev para iniciar el servidor de desarrollo');
console.log('4. Conecta tu wallet y cambia a Core Testnet2');

console.log('\n🔗 Enlaces útiles:');
console.log('- Core Testnet2 Explorer: https://scan.test2.btcs.network');
console.log('- Core Testnet2 RPC: https://rpc.test2.btcs.network');
console.log('- Documentación: SETUP_TESTNET.md');

console.log('\n✨ ¡Listo para usar Aethelgard en Core Testnet2!');
