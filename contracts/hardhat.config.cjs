require('dotenv/config');
require('@nomicfoundation/hardhat-toolbox');

const { PRIVATE_KEY, CORE_TESTNET2_RPC } = process.env;

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: '0.8.24',
  networks: {
    coreTestnet2: {
      url: CORE_TESTNET2_RPC || 'https://rpc.test2.btcs.network',
      chainId: 1114,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [],
    },
  },
};

module.exports = config;


