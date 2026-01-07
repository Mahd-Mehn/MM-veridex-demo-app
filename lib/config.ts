// Veridex SDK Configuration

// RPC URLs from environment variables (fallback to public endpoints)
const RPC_URLS = {
    baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    optimismSepolia: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
    arbitrumSepolia: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    starknetSepolia: process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC_URL || 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/tsOnfTBZDKMXcUA26OED-',
    suiTestnet: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    aptosTestnet: process.env.NEXT_PUBLIC_APTOS_RPC_URL || 'https://aptos-testnet.g.alchemy.com/v2/tsOnfTBZDKMXcUA26OED-',
};

// Base Sepolia (Hub Chain) - Now also has factory for vault creation
export const config = {
    chainId: 84532,
    wormholeChainId: 10004,
    rpcUrl: RPC_URLS.baseSepolia,
    hubContract: '0x66D87dE68327f48A099c5B9bE97020Feab9a7c82',
    wormholeCoreBridge: '0x79A1027a6A159502049F10906D333EC57E95F083',
    wormholeTokenBridge: '0x86F55A04690fd7815A3D802bD587e83eA888B239',
    chainName: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
    // Factory deployed on Base Sepolia for local vault creation
    vaultFactory: '0xCFaEb5652aa2Ee60b2229dC8895B4159749C7e53',
    vaultImplementation: '0x0d13367C16c6f0B24eD275CC67C7D9f42878285c',
    // Relayer URL - uses local proxy to hide backend URL from browser
    // The proxy forwards to RELAYER_BACKEND_URL (server-side only)
    relayerUrl: '/api/relayer',
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
        vaultFactory: '0xA5653d54079ABeCe780F8d9597B2bc4B09fe464A',
        vaultImplementation: '0x8099b1406485d2255ff89Ce5Ea18520802AFC150',
    },
    arbitrumSepolia: {
        chainId: 421614,
        wormholeChainId: 10003,
        rpcUrl: RPC_URLS.arbitrumSepolia,
        wormholeCoreBridge: '0x6b9C8671cdDC8dEab9c719bB87cBd3e782bA6a35',
        wormholeTokenBridge: '0xC7A204bDBFe983FCD8d8E61D02b475D4073fF97e',
        chainName: 'Arbitrum Sepolia',
        explorerUrl: 'https://sepolia.arbiscan.io',
        vaultFactory: '0xd36D3D5DB59d78f1E33813490F72DABC15C9B07c',
        vaultImplementation: '0xB10ACf39eBF17fc33F722cBD955b7aeCB0611bc4',
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

// Sui Testnet Configuration
export const suiConfig = {
    wormholeChainId: 21,
    rpcUrl: RPC_URLS.suiTestnet,
    packageId: '0x6ae854c698d73e39f5dc07c4d2291fa81e8732aded14bbff3b98cfa8bfaebff5',
    wormholeCoreBridge: '0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790',
    network: 'testnet' as const,
    chainName: 'Sui Testnet',
    explorerUrl: 'https://suiscan.xyz/testnet',
};

// Aptos Testnet Configuration
export const aptosConfig = {
    wormholeChainId: 22,
    rpcUrl: RPC_URLS.aptosTestnet,
    // Spoke module address (deployed)
    moduleAddress: '0x0237e04f74b991b5b6030a793779663033f4ff4a1682a9e66c1f41fc1ec3e2a4',
    wormholeCoreBridge: '0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625',
    tokenBridge: '0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f',
    network: 'testnet' as const,
    chainName: 'Aptos Testnet',
    explorerUrl: 'https://explorer.aptoslabs.com',
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
