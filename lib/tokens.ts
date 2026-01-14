/**
 * Veridex Test App - Token Configuration
 * 
 * Supported tokens per chain for the test app.
 * Aligned with Sera dashboard token support.
 */

// Re-export from SDK for convenience
export {
    NATIVE_TOKEN_ADDRESS,
    BASE_SEPOLIA_TOKENS,
    OPTIMISM_SEPOLIA_TOKENS,
    ARBITRUM_SEPOLIA_TOKENS,
    ETHEREUM_SEPOLIA_TOKENS,
    getAllTokens,
    getTokenBySymbol,
    getTokenByAddress,
    isNativeToken,
    getSupportedChainIds,
    getChainName,
    type TokenInfo,
    type ChainTokenList,
} from '@veridex/sdk';

// ============================================================================
// Wormhole Chain ID to Chain Name Mapping
// ============================================================================

export const WORMHOLE_CHAIN_ID_MAP: Record<number, string> = {
    10004: 'baseSepolia',
    10005: 'optimismSepolia',
    10003: 'arbitrumSepolia',
    10002: 'ethereumSepolia',
    1: 'solanaDevnet',
    21: 'suiTestnet',
    22: 'aptosTestnet',
    50001: 'starknetSepolia',
};

// ============================================================================
// Token Display Helpers
// ============================================================================

export interface TokenDisplayInfo {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoUrl?: string;
    isNative: boolean;
}

/**
 * Get display-ready token list for a chain
 */
export function getTokensForDisplay(wormholeChainId: number): TokenDisplayInfo[] {
    const { getAllTokens } = require('@veridex/sdk');
    const tokens = getAllTokens(wormholeChainId);
    
    return tokens.map((token: TokenDisplayInfo) => ({
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        logoUrl: getTokenLogoUrl(token.symbol),
        isNative: token.isNative,
    }));
}

/**
 * Get token logo URL by symbol
 */
export function getTokenLogoUrl(symbol: string): string {
    const logoMap: Record<string, string> = {
        'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
        'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        'SUI': 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
        'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
    };
    
    return logoMap[symbol] || '';
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
    amount: bigint,
    decimals: number,
    maxDecimals = 6
): string {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    
    if (remainder === BigInt(0)) {
        return whole.toString();
    }
    
    // Format decimal part
    const decimalStr = remainder.toString().padStart(decimals, '0');
    const trimmed = decimalStr.slice(0, maxDecimals).replace(/0+$/, '');
    
    if (trimmed === '') {
        return whole.toString();
    }
    
    return `${whole}.${trimmed}`;
}

/**
 * Parse token amount from string
 */
export function parseTokenAmount(value: string, decimals: number): bigint {
    const [whole, decimal = ''] = value.split('.');
    const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole + paddedDecimal);
}
