// Veridex SDK Configuration

// RPC URLs from environment variables (fallback to public endpoints)
const RPC_URLS = {
    baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    optimismSepolia: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
    arbitrumSepolia: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    starknetSepolia: process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC_URL || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
};

// Base Sepolia (Hub Chain) - Now also has factory for vault creation
export const config = {
    chainId: 84532,
    wormholeChainId: 10004,
    rpcUrl: RPC_URLS.baseSepolia,
    hubContract: '0xf189b649ecb44708165f36619ED24ff917eF1f94',
    wormholeCoreBridge: '0x79A1027a6A159502049F10906D333EC57E95F083',
    wormholeTokenBridge: '0x86F55A04690fd7815A3D802bD587e83eA888B239',
    chainName: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
    // Factory deployed on Base Sepolia for local vault creation
    vaultFactory: '0x0E4B53AbCE029Df2a1e0068F16C5A35A6a8D85b6',
    vaultImplementation: '0x755F4d7191fC8A3e832E9f8b30c7ab6543F943f3',
    // Relayer URL for gasless transactions
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001',
};

// Spoke Chain Configurations
export const spokeConfigs = {
    optimismSepolia: {
        chainId: 11155420,
        wormholeChainId: 10005,
        rpcUrl: RPC_URLS.optimismSepolia,
        wormholeCoreBridge: '0x31377888146f3253211EFEf5c676D41ECe7D58Fe',
        wormholeTokenBridge: '0x99737Ec4B815d816c49A385943baf0380e75c0Ac',
        chainName: 'Optimism Sepolia',
        explorerUrl: 'https://sepolia-optimism.etherscan.io',
        vaultFactory: '0x677bA5C2f9c7377860c7aeB00037E1a5D12B3515',
        vaultImplementation: '0x966248A18329037B043C21AcDae9B3161C7acB33',
    },
    arbitrumSepolia: {
        chainId: 421614,
        wormholeChainId: 10003,
        rpcUrl: RPC_URLS.arbitrumSepolia,
        wormholeCoreBridge: '0x6b9C8671cdDC8dEab9c719bB87cBd3e782bA6a35',
        wormholeTokenBridge: '0xC7A204bDBFe983FCD8d8E61D02b475D4073fF97e',
        chainName: 'Arbitrum Sepolia',
        explorerUrl: 'https://sepolia.arbiscan.io',
        vaultFactory: '0xbE9B9c39956448DA75Ac97E5e3dE17e34171660A',
        vaultImplementation: '0x500853DCc54Fd1A707ec9d443032Bb7748f426d3',
    },
};

// Solana Devnet Configuration
export const solanaConfig = {
    wormholeChainId: 1,
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    programId: 'J7JehynQjN4XrucGQ5joMfhQWiViDmmLhQLriGUcWAM2',
    wormholeCoreBridge: '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5',
    wormholeTokenBridge: 'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe',
    network: 'devnet' as const,
    chainName: 'Solana Devnet',
    explorerUrl: 'https://explorer.solana.com',
    commitment: 'confirmed' as const,
};

// Starknet Sepolia Configuration
// Uses CUSTOM BRIDGE (not Wormhole VAA) - multi-relayer threshold attestations
export const starknetConfig = {
    wormholeChainId: 50001, // Custom chain ID (50000+ reserved for non-Wormhole chains)
    chainId: 0, // Native Starknet chain ID (SN_SEPOLIA)
    rpcUrl: RPC_URLS.starknetSepolia,
    // Starknet spoke contract
    spokeAddress: '0x767073ab5682d1908c7f6498eee8e480fb2457dbcf34bab075c5dd536d08176',
    // Custom bridge contract (NOT Wormhole)
    bridgeAddress: '0x5fb87f29937b2b1eff97e18cd72c3c28985e51e2916b0b75f739c5641845e13',
    network: 'sepolia' as const,
    chainName: 'Starknet Sepolia',
    explorerUrl: 'https://sepolia.starkscan.co',
    // Hub chain ID that Starknet bridge validates (Base Sepolia = 10004)
    hubChainId: 10004,
    // Gasless execution: relayer pays ALL fees on Starknet
    isGasless: true,
};

// List of all supported chains with their vault configurations
export const supportedChains = {
    baseSepolia: config,
    ...spokeConfigs,
} as const;

export type ChainKey = keyof typeof supportedChains;
