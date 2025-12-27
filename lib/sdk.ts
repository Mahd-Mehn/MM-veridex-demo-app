/**
 * Veridex SDK Configuration - Simplified
 * 
 * This is the new, simplified way to configure the Veridex SDK.
 * Just specify the chain name and optionally the network (defaults to testnet).
 * 
 * @example
 * ```typescript
 * import { sdk, createChainSDK } from '@/lib/sdk';
 * 
 * // Use the default SDK (Base testnet)
 * await sdk.passkey.register('user', 'My Wallet');
 * 
 * // Or create SDK for a different chain
 * const optimismSdk = createChainSDK('optimism');
 * ```
 */

import { 
    createSDK,
    type ChainName,
    type NetworkType,
    type SimpleSDKConfig,
} from 'veridex-sdk';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Get RPC URLs from environment variables
 * Falls back to public endpoints if not specified
 */
function getRpcUrls(): Partial<Record<ChainName, string>> {
    return {
        base: process.env.NEXT_PUBLIC_BASE_RPC_URL,
        optimism: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL,
        arbitrum: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
        starknet: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
        sui: process.env.NEXT_PUBLIC_SUI_RPC_URL,
        aptos: process.env.NEXT_PUBLIC_APTOS_RPC_URL,
        solana: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    };
}

/**
 * Get relayer configuration from environment
 */
function getRelayerConfig(): Pick<SimpleSDKConfig, 'relayerUrl' | 'relayerApiKey'> {
    return {
        relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001',
        relayerApiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
    };
}

// ============================================================================
// SDK Factory Functions
// ============================================================================

/**
 * Create an SDK for a specific chain
 * 
 * @param chain - Chain name (e.g., 'base', 'optimism', 'solana')
 * @param options - Optional configuration
 * @returns Configured Veridex SDK
 * 
 * @example
 * ```typescript
 * // Testnet (default)
 * const sdk = createChainSDK('base');
 * 
 * // Mainnet
 * const mainnetSdk = createChainSDK('base', { network: 'mainnet' });
 * 
 * // With custom RPC
 * const customSdk = createChainSDK('optimism', { 
 *   rpcUrl: 'https://my-custom-rpc.com' 
 * });
 * ```
 */
export function createChainSDK(
    chain: ChainName,
    options: {
        network?: NetworkType;
        rpcUrl?: string;
        enableRelayer?: boolean;
    } = {}
) {
    const { network = 'testnet', rpcUrl, enableRelayer = true } = options;
    
    return createSDK(chain, {
        network,
        rpcUrl,
        rpcUrls: getRpcUrls(),
        ...(enableRelayer ? getRelayerConfig() : {}),
    });
}

// ============================================================================
// Pre-configured SDK Instances
// ============================================================================

/**
 * Default SDK instance - Base testnet
 * Use this for the most common use case
 */
export const sdk = createChainSDK('base');

/**
 * Optimism testnet SDK
 */
export const optimismSdk = createChainSDK('optimism');

/**
 * Arbitrum testnet SDK
 */
export const arbitrumSdk = createChainSDK('arbitrum');

/**
 * Starknet testnet SDK
 */
export const starknetSdk = createChainSDK('starknet');

/**
 * Solana devnet SDK
 */
export const solanaSdk = createChainSDK('solana');

// ============================================================================
// Chain Selection
// ============================================================================

/**
 * Supported chains for the test app
 */
export const SUPPORTED_CHAINS = [
    'base',
    'optimism',
    'arbitrum',
    'starknet',
    'solana',
    'sui',
    'aptos',
] as const satisfies readonly ChainName[];

export type SupportedChain = typeof SUPPORTED_CHAINS[number];

/**
 * Get SDK for a chain by name
 */
export function getSDKForChain(chain: SupportedChain) {
    return createChainSDK(chain);
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { ChainName, NetworkType } from 'veridex-sdk';
export { 
    CHAIN_NAMES, 
    getSupportedChains, 
    getHubChains,
    isChainSupported,
} from 'veridex-sdk';
