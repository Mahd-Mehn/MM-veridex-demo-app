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
    getTokenBySymbol as getSDKTokenBySymbol,
    getTokenByAddress as getSDKTokenByAddress,
    isNativeToken,
    getSupportedChainIds,
    getChainName,
    type TokenInfo as SDKTokenInfo,
    type ChainTokenList,
} from '@veridex/sdk';

// ============================================================================
// Sera Stablecoin Token Registry (Ethereum Sepolia)
// All tokens have 6 decimals (same as USDC/USDT)
// ============================================================================

export interface SeraTokenInfo {
    symbol: string;
    address: string;
    currency: string;
    decimals: number;
    name: string;
}

/**
 * Sera Protocol Stablecoins - All deployed on Ethereum Sepolia
 * Chain ID: 11155111 | Wormhole Chain ID: 10002
 */
export const SERA_TOKENS: Record<string, SeraTokenInfo> = {
    // USD Stablecoins
    USDT: {
        symbol: 'USDT',
        address: '0x1920bf0643ae49B4fB334586dAd6Bed29fF30F88',
        currency: 'USD',
        decimals: 6,
        name: 'Tether USD',
    },
    USDC: {
        symbol: 'USDC',
        address: '0x7A7754A2089df825801A0a8d95a9801928bFb22A',
        currency: 'USD',
        decimals: 6,
        name: 'USD Coin',
    },

    // EUR Stablecoins
    EURC: {
        symbol: 'EURC',
        address: '0xd3BdB2CE9cD98566EFc2e2977448c40578371779',
        currency: 'EUR',
        decimals: 6,
        name: 'Euro Coin',
    },
    EURT: {
        symbol: 'EURT',
        address: '0x47230df72231f594C5c598635dD92849C11532D0',
        currency: 'EUR',
        decimals: 6,
        name: 'Tether EUR',
    },
    TNEUR: {
        symbol: 'TNEUR',
        address: '0xe4AF44eF7ce074F8FA94131035108201A5ac2F3a',
        currency: 'EUR',
        decimals: 6,
        name: 'TN EUR',
    },
    VEUR: {
        symbol: 'VEUR',
        address: '0x4AbcbC7C307baCF5AdbFc57E822658F5D917Ca1E',
        currency: 'EUR',
        decimals: 6,
        name: 'Venus EUR',
    },

    // GBP Stablecoins
    GBPA: {
        symbol: 'GBPA',
        address: '0xD685BC15a53bbb624B98Ebf97B357DB8e0DA4A23',
        currency: 'GBP',
        decimals: 6,
        name: 'GBP Anchor',
    },
    TGBP: {
        symbol: 'TGBP',
        address: '0xA26f1088f41714B696d0e7b117FA9cbd810bbE8B',
        currency: 'GBP',
        decimals: 6,
        name: 'TrueGBP',
    },
    VGBP: {
        symbol: 'VGBP',
        address: '0x01d8b6E34a57573Ff48d49fA047b45054f939eDa',
        currency: 'GBP',
        decimals: 6,
        name: 'Venus GBP',
    },

    // SGD Stablecoins
    XSGD: {
        symbol: 'XSGD',
        address: '0x1Fe69B1171d8aA5e6d432F14A9E4129ED96E40C0',
        currency: 'SGD',
        decimals: 6,
        name: 'StraitsX SGD',
    },
    TNSGD: {
        symbol: 'TNSGD',
        address: '0x4638F8eB9F2047Ab18d70E12539E0B16fF2998A2',
        currency: 'SGD',
        decimals: 6,
        name: 'TN SGD',
    },

    // JPY Stablecoins
    GYEN: {
        symbol: 'GYEN',
        address: '0xA39c3648Cd2b5a183Af33Dcc30af6799A13aD7aE',
        currency: 'JPY',
        decimals: 6,
        name: 'GMO JPY',
    },
    JPYC: {
        symbol: 'JPYC',
        address: '0x2C9e4Db557af394f1F21d1E1E6754a7CB1eC1D01',
        currency: 'JPY',
        decimals: 6,
        name: 'JPY Coin',
    },

    // AUD Stablecoins
    AUDD: {
        symbol: 'AUDD',
        address: '0x03A8D551Bf1d708471064aA97FeA004a45Ed8CF3',
        currency: 'AUD',
        decimals: 6,
        name: 'Novatti AUD',
    },
    AUDF: {
        symbol: 'AUDF',
        address: '0x06dCE1A62f5D3188d016e640F3a9dd3bB26f9431',
        currency: 'AUD',
        decimals: 6,
        name: 'AUD Fiat',
    },

    // CAD Stablecoins
    CADC: {
        symbol: 'CADC',
        address: '0xaE64cEB804292F737C28e0Bd552d929041662970',
        currency: 'CAD',
        decimals: 6,
        name: 'CAD Coin',
    },
    QCAD: {
        symbol: 'QCAD',
        address: '0x3BDB8BE37Ad586852ad005C5a0885211CD803250',
        currency: 'CAD',
        decimals: 6,
        name: 'Stablecorp QCAD',
    },

    // BRL Stablecoins
    BRLA: {
        symbol: 'BRLA',
        address: '0x6B5256523aCD840aE97AeDE492cB31a5D500Fdf9',
        currency: 'BRL',
        decimals: 6,
        name: 'BRL Anchor',
    },
    BRZ: {
        symbol: 'BRZ',
        address: '0x1B7fA411238bf745138a59Cbd90Fb8480D85c130',
        currency: 'BRL',
        decimals: 6,
        name: 'Brazilian Digital',
    },

    // KRW Stablecoins
    KRW1: {
        symbol: 'KRW1',
        address: '0x01943628c3E70A4F39CE905e8fea56E7A8a357F8',
        currency: 'KRW',
        decimals: 6,
        name: 'KRW One',
    },
    KRWO: {
        symbol: 'KRWO',
        address: '0x4C16AF20C7f8a841397273955c6451F4fEB6a576',
        currency: 'KRW',
        decimals: 6,
        name: 'KRW Official',
    },
    KRWIN: {
        symbol: 'KRWIN',
        address: '0xCE2dDC28068b3929ECF9787ec47284A9e3a62B3a',
        currency: 'KRW',
        decimals: 6,
        name: 'KRW International',
    },

    // IDR Stablecoins
    IDRX: {
        symbol: 'IDRX',
        address: '0x258f1E146b8Bd0dEcf54bAD8f1f01fE69025601c',
        currency: 'IDR',
        decimals: 6,
        name: 'Rupiah Token',
    },
    IDRT: {
        symbol: 'IDRT',
        address: '0x26db12e7cB7Be8Ab22a97B7e4c3d33C0bfE89e82',
        currency: 'IDR',
        decimals: 6,
        name: 'Rupiah Token',
    },
    XIDR: {
        symbol: 'XIDR',
        address: '0xe02bbf861736147e1506d07239d7f2D291FB39fC',
        currency: 'IDR',
        decimals: 6,
        name: 'StraitsX IDR',
    },

    // CHF Stablecoins
    CCHF: {
        symbol: 'CCHF',
        address: '0xA6B42B17219C854E4a44F40ed93d15A5FD88676E',
        currency: 'CHF',
        decimals: 6,
        name: 'Crypto CHF',
    },
    VCHF: {
        symbol: 'VCHF',
        address: '0x1e7Fd8256Cff4C61519e9E7E5E9d0496a14b0D5B',
        currency: 'CHF',
        decimals: 6,
        name: 'Venus CHF',
    },

    // MXN Stablecoins
    MXNB: {
        symbol: 'MXNB',
        address: '0x510139cC0B118711ACCf9ec476b3093dF0BBb1FC',
        currency: 'MXN',
        decimals: 6,
        name: 'MXN Bitso',
    },
    MXNT: {
        symbol: 'MXNT',
        address: '0x6750EEC6a189BCBc4a9A52EE285b525c8D1940f3',
        currency: 'MXN',
        decimals: 6,
        name: 'Tether MXN',
    },

    // NZD Stablecoins
    NZDD: {
        symbol: 'NZDD',
        address: '0x2cDc20d7eFEe786d28529ecC8a0A491Bee84b207',
        currency: 'NZD',
        decimals: 6,
        name: 'Novatti NZD',
    },
    NZDS: {
        symbol: 'NZDS',
        address: '0xA6DA6F948F6C95D4D6525856208B1A267a37c905',
        currency: 'NZD',
        decimals: 6,
        name: 'NZD Stablecoin',
    },

    // THB Stablecoins
    THBK: {
        symbol: 'THBK',
        address: '0x696451A335EB929934a1020Db4ED655f33765802',
        currency: 'THB',
        decimals: 6,
        name: 'THB Kasikorn',
    },
    THBT: {
        symbol: 'THBT',
        address: '0x5e875193255BfE0557701DceB01831C7bDFa910b',
        currency: 'THB',
        decimals: 6,
        name: 'Tether THB',
    },

    // ZAR Stablecoins
    ZARP: {
        symbol: 'ZARP',
        address: '0x409667Ce4E4674E9fB8272774AAbFfBB7c8956a4',
        currency: 'ZAR',
        decimals: 6,
        name: 'ZAR Stablecoin',
    },
    ZARU: {
        symbol: 'ZARU',
        address: '0x721CB3e2B0BA43b0a51f2179b7D260DD98d4BAF1',
        currency: 'ZAR',
        decimals: 6,
        name: 'ZAR Universal',
    },

    // Other Regional Stablecoins
    ARC: {
        symbol: 'ARC',
        address: '0xDbb492152eBd689ceF184C17e6F65AB18DCDe627',
        currency: 'INR',
        decimals: 6,
        name: 'ARC INR',
    },
    MYRC: {
        symbol: 'MYRC',
        address: '0x68077f53a6562D42051C86b09160EA577f3C7476',
        currency: 'MYR',
        decimals: 6,
        name: 'Malaysian Ringgit',
    },
    TRYB: {
        symbol: 'TRYB',
        address: '0x0d2968Dc1b9EC131bEcaB8e28193e81Bcd63040c',
        currency: 'TRY',
        decimals: 6,
        name: 'BiLira',
    },
    PHPC: {
        symbol: 'PHPC',
        address: '0x9aA087afD8C3EadA4f52Dfe61aaC507Bf845BC29',
        currency: 'PHP',
        decimals: 6,
        name: 'PHP Coin',
    },
    HKDR: {
        symbol: 'HKDR',
        address: '0x40ad01c5ade2a9202D110C621919D0a2b147EB97',
        currency: 'HKD',
        decimals: 6,
        name: 'HKD Reserve',
    },
    CNHT: {
        symbol: 'CNHT',
        address: '0x8f3F6bE3f2545d5d90275f0dA98980264F6a8913',
        currency: 'CNH',
        decimals: 6,
        name: 'Tether CNH',
    },
    ARZ: {
        symbol: 'ARZ',
        address: '0x3A2498C86Db0e4a2E8766649f368cBD37Fe6D52a',
        currency: 'ARS',
        decimals: 6,
        name: 'Argentine Peso',
    },
    cNGN: {
        symbol: 'cNGN',
        address: '0x82167feCbB10C496F75afcD933DC0E23891E1CF3',
        currency: 'NGN',
        decimals: 6,
        name: 'cNGN Stablecoin',
    },
    A7A5: {
        symbol: 'A7A5',
        address: '0xEf6182c0DB1466b4B24608360bEf8376A6A0578d',
        currency: 'RUB',
        decimals: 6,
        name: 'A7A5 RUB',
    },
};

// ============================================================================
// Sera Token Helper Functions
// ============================================================================

/**
 * Get Sera token by symbol
 */
export function getSeraTokenBySymbol(symbol: string): SeraTokenInfo | undefined {
    return SERA_TOKENS[symbol.toUpperCase()];
}

/**
 * Get all Sera tokens for a specific currency
 */
export function getSeraTokensByCurrency(currency: string): SeraTokenInfo[] {
    return Object.values(SERA_TOKENS).filter(t => t.currency === currency.toUpperCase());
}

/**
 * Get Sera token address by symbol
 */
export function getSeraTokenAddress(symbol: string): string | undefined {
    return SERA_TOKENS[symbol.toUpperCase()]?.address;
}

/**
 * Get all Sera token addresses
 */
export function getAllSeraTokenAddresses(): string[] {
    return Object.values(SERA_TOKENS).map(t => t.address);
}

/**
 * Get Sera token by address
 */
export function getSeraTokenByAddress(address: string): SeraTokenInfo | undefined {
    const lowerAddress = address.toLowerCase();
    return Object.values(SERA_TOKENS).find(t => t.address.toLowerCase() === lowerAddress);
}

/**
 * Get all Sera tokens as array
 */
export function getAllSeraTokens(): SeraTokenInfo[] {
    return Object.values(SERA_TOKENS);
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
    const currencies = new Set(Object.values(SERA_TOKENS).map(t => t.currency));
    return Array.from(currencies).sort();
}

// ============================================================================
// Primary Tokens (Default for each currency)
// ============================================================================

export const PRIMARY_TOKENS: Record<string, SeraTokenInfo> = {
    USD: SERA_TOKENS.USDT,
    EUR: SERA_TOKENS.EURC,
    GBP: SERA_TOKENS.GBPA,
    SGD: SERA_TOKENS.XSGD,
    JPY: SERA_TOKENS.GYEN,
    AUD: SERA_TOKENS.AUDD,
    CAD: SERA_TOKENS.CADC,
    BRL: SERA_TOKENS.BRLA,
    KRW: SERA_TOKENS.KRW1,
    IDR: SERA_TOKENS.IDRX,
    CHF: SERA_TOKENS.CCHF,
    MXN: SERA_TOKENS.MXNB,
    NZD: SERA_TOKENS.NZDD,
    THB: SERA_TOKENS.THBK,
    ZAR: SERA_TOKENS.ZARP,
    INR: SERA_TOKENS.ARC,
    MYR: SERA_TOKENS.MYRC,
    TRY: SERA_TOKENS.TRYB,
    PHP: SERA_TOKENS.PHPC,
    HKD: SERA_TOKENS.HKDR,
    CNH: SERA_TOKENS.CNHT,
    ARS: SERA_TOKENS.ARZ,
    NGN: SERA_TOKENS.cNGN,
    RUB: SERA_TOKENS.A7A5,
};

/**
 * Default payment token (USDT)
 */
export const DEFAULT_PAYMENT_TOKEN = SERA_TOKENS.USDT;

// ============================================================================
// Sera Chain Configuration
// ============================================================================

export const SERA_CHAIN = {
    chainId: 11155111,
    wormholeChainId: 10002,
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
};

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
    currency?: string;
}

/**
 * Get token logo URL by symbol
 */
export function getTokenLogoUrl(symbol: string): string {
    const logoMap: Record<string, string> = {
        'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
        'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
        'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
        'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
        'SOL': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        'SUI': 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
        'APT': 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
        'EURC': 'https://assets.coingecko.com/coins/images/26045/small/euro-coin.png',
        'EURT': 'https://assets.coingecko.com/coins/images/17385/small/Tether_full_logo_dm.png',
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

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number | string, currency: string): string {
    const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CNH: '¥',
        KRW: '₩',
        INR: '₹',
        BRL: 'R$',
        MXN: 'MX$',
        SGD: 'S$',
        AUD: 'A$',
        CAD: 'C$',
        NZD: 'NZ$',
        HKD: 'HK$',
        CHF: 'CHF ',
        THB: '฿',
        IDR: 'Rp',
        PHP: '₱',
        MYR: 'RM',
        ZAR: 'R',
        TRY: '₺',
        ARS: 'ARS ',
        NGN: '₦',
        RUB: '₽',
    };
    
    const symbol = symbols[currency] || `${currency} `;
    return `${symbol}${amount}`;
}
