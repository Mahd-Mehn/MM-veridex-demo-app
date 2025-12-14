// Veridex SDK Configuration

// Base Sepolia (Hub Chain)
export const config = {
    chainId: 84532,
    wormholeChainId: 10004,
    rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/tsOnfTBZDKMXcUA26OED-',
    hubContract: '0xf189b649ecb44708165f36619ED24ff917eF1f94',
    wormholeCoreBridge: '0x79A1027a6A159502049F10906D333EC57E95F083',
    chainName: 'Base Sepolia',
    explorerUrl: 'https://sepolia.basescan.org',
    // Note: Base Sepolia is hub-only, no factory on hub chain
    vaultFactory: undefined,
    vaultImplementation: undefined,
} as const;

// Spoke Chain Configurations
export const spokeConfigs = {
    optimismSepolia: {
        chainId: 11155420,
        wormholeChainId: 10005,
        rpcUrl: 'https://sepolia.optimism.io',
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
        rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
        wormholeCoreBridge: '0x6b9C8671cdDC8dEab9c719bB87cBd3e782bA6a35',
        wormholeTokenBridge: '0xC7A204bDBFe983FCD8d8E61D02b475D4073fF97e',
        chainName: 'Arbitrum Sepolia',
        explorerUrl: 'https://sepolia.arbiscan.io',
        vaultFactory: '0xbE9B9c39956448DA75Ac97E5e3dE17e34171660A',
        vaultImplementation: '0x500853DCc54Fd1A707ec9d443032Bb7748f426d3',
    },
} as const;

// List of all supported chains with their vault configurations
export const supportedChains = {
    baseSepolia: config,
    ...spokeConfigs,
} as const;

export type ChainKey = keyof typeof supportedChains;
