'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
    VeridexSDK, 
    PasskeyCredential, 
    UnifiedIdentity, 
    VaultCreationResult,
    TokenBalance,
    PortfolioBalance,
    PreparedTransfer,
    TransferResult,
    ReceiveAddress,
    TransferParams,
    TransactionState,
    TokenInfo,
    BridgeParams,
    PreparedBridge,
    BridgeResult,
    CrossChainProgress,
    CrossChainResult,
    MultiChainVaultResult,
    SponsoredVaultResult,
    // Issue #26: Human-Readable Transaction Summaries
    TransactionSummary,
    // Issue #27: Spending Limits
    SpendingLimits,
    FormattedSpendingLimits,
    LimitCheckResult,
} from '@veridex/sdk';
import { EVMClient } from '@veridex/sdk/chains/evm';
import { SolanaClient } from '@veridex/sdk/chains/solana';
import { SuiClient } from '@veridex/sdk/chains/sui';
import { AptosClient } from '@veridex/sdk/chains/aptos';
import { StarknetClient } from '@veridex/sdk/chains/starknet';
import { ethers } from 'ethers';
import { config, spokeConfigs, solanaConfig, suiConfig, aptosConfig, starknetConfig } from '@/lib/config';
import { logger } from '@/lib/logger';

// Relayer proxy URL - hides backend URL from browser Network tab
// Uses local /api/relayer which proxies to the actual relayer backend
const RELAYER_PROXY_URL = '/api/relayer';

// Multi-chain vault addresses type
export interface MultiChainVaultAddresses {
    /** EVM vault address (Base Sepolia) */
    evm: string | null;
    /** Solana vault address */
    solana: string | null;
    /** Sui vault address */
    sui: string | null;
    /** Aptos vault address */
    aptos: string | null;
    /** Starknet vault address */
    starknet: string | null;
}

// Solana balance type
export interface SolanaBalance {
    address: string;
    lamports: bigint;
    sol: number;
    /** Alias for sol for component compatibility */
    native: number;
    /** USD value (optional, fetched from price API) */
    usdValue?: number;
}

// Sui balance type
export interface SuiBalance {
    address: string;
    mist: bigint;
    sui: number;
    /** USD value (optional) */
    usdValue?: number;
}

// Aptos balance type
export interface AptosBalance {
    address: string;
    octas: bigint;
    apt: number;
    /** USD value (optional) */
    usdValue?: number;
}

// Starknet balance type (STRK native token)
export interface StarknetBalance {
    address: string;
    wei: bigint;
    strk: number;
    /** USD value (optional) */
    usdValue?: number;
}

interface VeridexContextType {
    sdk: VeridexSDK | null;
    credential: PasskeyCredential | null;
    identity: UnifiedIdentity | null;
    signer: ethers.Signer | null;
    address: string | null;
    isConnected: boolean;
    isRegistered: boolean;
    vaultAddress: string | null;
    vaultDeployed: boolean;
    isLoading: boolean;
    
    // Phase 1: Authentication & Identity
    register: (username: string, displayName: string) => Promise<void>;
    login: () => Promise<void>;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    logout: () => void;
    deleteCredential: () => void;
    hasStoredCredential: () => boolean;
    createVault: () => Promise<VaultCreationResult>;
    refreshIdentity: () => Promise<void>;
    
    // Sponsored Vault Creation (Gasless)
    createSponsoredVaults: () => Promise<MultiChainVaultResult>;
    isSponsorshipAvailable: () => boolean;
    sponsoredVaultStatus: MultiChainVaultResult | null;
    isCreatingSponsoredVaults: boolean;
    
    // Phase 2: Balances
    vaultBalances: PortfolioBalance | null;
    /** Balances per chain (keyed by Wormhole chain ID) */
    chainBalances: Record<number, PortfolioBalance | null>;
    isLoadingBalances: boolean;
    /** Refresh balances for the hub chain (Base) */
    refreshBalances: () => Promise<void>;
    /** Refresh balances for a specific chain by Wormhole chain ID */
    refreshBalancesForChain: (wormholeChainId: number) => Promise<void>;
    getTokenBalance: (tokenAddress: string) => Promise<TokenBalance>;
    getTokenList: () => TokenInfo[];
    
    // Phase 2: Transfers
    prepareTransfer: (params: TransferParams) => Promise<PreparedTransfer>;
    executeTransfer: (prepared: PreparedTransfer) => Promise<TransferResult>;
    transfer: (params: TransferParams) => Promise<TransferResult>;
    /** Gasless transfer - uses relayer to pay gas fees */
    transferGasless: (params: TransferParams) => Promise<TransferResult>;
    /** Gasless bridge - uses relayer to pay gas fees for cross-chain transfers */
    bridgeGasless: (params: BridgeParams, onProgress?: (progress: CrossChainProgress) => void) => Promise<BridgeResult>;
    
    // Phase 2: Receive
    receiveAddress: ReceiveAddress | null;
    getPaymentRequest: (amount: bigint, tokenAddress?: string, decimals?: number) => ReceiveAddress | null;
    
    // Phase 2: Transaction Tracking
    pendingTransactions: TransactionState[];
    waitForTransaction: (hash: string) => Promise<TransactionState>;

    // Phase 3: Cross-Chain
    prepareBridge: (params: BridgeParams) => Promise<PreparedBridge>;
    executeBridge: (prepared: PreparedBridge, onProgress?: (progress: CrossChainProgress) => void) => Promise<BridgeResult>;
    bridgeWithTracking: (params: BridgeParams, onProgress?: (progress: CrossChainProgress) => void) => Promise<BridgeResult>;
    pendingBridges: CrossChainResult[];
    bridgeProgress: CrossChainProgress | null;

    // Solana Integration
    solanaClient: SolanaClient | null;
    solanaVaultAddress: string | null;
    solanaBalance: SolanaBalance | null;
    isLoadingSolanaBalance: boolean;
    refreshSolanaBalance: () => Promise<void>;
    getSolanaReceiveAddress: () => string | null;
    createSolanaVault: () => Promise<VaultCreationResult>;
    solanaVaultExists: boolean;

    // Multi-chain vault addresses (Sui, Aptos, Starknet)
    suiVaultAddress: string | null;
    aptosVaultAddress: string | null;
    starknetVaultAddress: string | null;
    /** Get vault address for any chain by Wormhole chain ID */
    getVaultAddressForChain: (wormholeChainId: number) => string | null;
    /** All vault addresses across chains */
    multiChainVaultAddresses: MultiChainVaultAddresses;

    // Sui vault management
    suiVaultExists: boolean;
    createSuiVault: () => Promise<VaultCreationResult>;
    suiBalance: SuiBalance | null;
    isLoadingSuiBalance: boolean;
    refreshSuiBalance: () => Promise<void>;

    // Aptos vault management
    aptosVaultExists: boolean;
    createAptosVault: () => Promise<VaultCreationResult>;
    aptosBalance: AptosBalance | null;
    isLoadingAptosBalance: boolean;
    refreshAptosBalance: () => Promise<void>;

    // Starknet vault management
    starknetVaultExists: boolean;
    createStarknetVault: () => Promise<VaultCreationResult>;
    starknetBalance: StarknetBalance | null;
    isLoadingStarknetBalance: boolean;
    refreshStarknetBalance: () => Promise<void>;

    // Backup Passkey Management (Issue #22/#25)
    hasBackupPasskey: boolean;
    isAddingBackupPasskey: boolean;
    addBackupPasskey: () => Promise<void>;
    checkBackupPasskeyStatus: () => Promise<void>;

    // Issue #26: Human-Readable Transaction Summaries
    parseTransaction: (prepared: PreparedTransfer | PreparedBridge) => Promise<TransactionSummary>;
    
    // Issue #27: Spending Limits
    spendingLimits: SpendingLimits | null;
    formattedSpendingLimits: FormattedSpendingLimits | null;
    isLoadingSpendingLimits: boolean;
    refreshSpendingLimits: () => Promise<void>;
    checkTransactionLimit: (amount: bigint) => Promise<LimitCheckResult | null>;
    setDailyLimit: (newLimit: bigint) => Promise<void>;
    pauseVault: () => Promise<void>;
    unpauseVault: () => Promise<void>;
}

const VeridexContext = createContext<VeridexContextType | undefined>(undefined);

export function VeridexProvider({ children }: { children: ReactNode }) {
    const [sdk, setSdk] = useState<VeridexSDK | null>(null);
    const [credential, setCredential] = useState<PasskeyCredential | null>(null);
    const [identity, setIdentity] = useState<UnifiedIdentity | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [vaultAddress, setVaultAddress] = useState<string | null>(null);
    const [vaultDeployed, setVaultDeployed] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Phase 2 state
    const [vaultBalances, setVaultBalances] = useState<PortfolioBalance | null>(null);
    const [chainBalances, setChainBalances] = useState<Record<number, PortfolioBalance | null>>({});
    const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
    const [receiveAddress, setReceiveAddress] = useState<ReceiveAddress | null>(null);
    const [pendingTransactions, setPendingTransactions] = useState<TransactionState[]>([]);

    // Phase 3 state
    const [pendingBridges, setPendingBridges] = useState<CrossChainResult[]>([]);
    const [bridgeProgress, setBridgeProgress] = useState<CrossChainProgress | null>(null);

    // Sponsored vault creation state
    const [sponsoredVaultStatus, setSponsoredVaultStatus] = useState<MultiChainVaultResult | null>(null);
    const [isCreatingSponsoredVaults, setIsCreatingSponsoredVaults] = useState<boolean>(false);

    // Solana state
    const [solanaClient, setSolanaClient] = useState<SolanaClient | null>(null);
    const [solanaVaultAddress, setSolanaVaultAddress] = useState<string | null>(null);
    const [solanaBalance, setSolanaBalance] = useState<SolanaBalance | null>(null);
    const [isLoadingSolanaBalance, setIsLoadingSolanaBalance] = useState<boolean>(false);
    const [solanaVaultExists, setSolanaVaultExists] = useState<boolean>(false);

    // Multi-chain vault addresses (Sui, Aptos, Starknet)
    const [suiClient, setSuiClient] = useState<SuiClient | null>(null);
    const [aptosClient, setAptosClient] = useState<AptosClient | null>(null);
    const [starknetClient, setStarknetClient] = useState<StarknetClient | null>(null);
    const [suiVaultAddress, setSuiVaultAddress] = useState<string | null>(null);
    const [aptosVaultAddress, setAptosVaultAddress] = useState<string | null>(null);
    const [starknetVaultAddress, setStarknetVaultAddress] = useState<string | null>(null);
    const [suiVaultExists, setSuiVaultExists] = useState<boolean>(false);
    const [aptosVaultExists, setAptosVaultExists] = useState<boolean>(false);
    const [starknetVaultExists, setStarknetVaultExists] = useState<boolean>(false);
    
    // Non-EVM chain balances
    const [suiBalance, setSuiBalance] = useState<SuiBalance | null>(null);
    const [isLoadingSuiBalance, setIsLoadingSuiBalance] = useState<boolean>(false);
    const [aptosBalance, setAptosBalance] = useState<AptosBalance | null>(null);
    const [isLoadingAptosBalance, setIsLoadingAptosBalance] = useState<boolean>(false);
    const [starknetBalance, setStarknetBalance] = useState<StarknetBalance | null>(null);
    const [isLoadingStarknetBalance, setIsLoadingStarknetBalance] = useState<boolean>(false);

    // Backup passkey state (Issue #22/#25)
    const [hasBackupPasskey, setHasBackupPasskey] = useState<boolean>(false);
    const [isAddingBackupPasskey, setIsAddingBackupPasskey] = useState<boolean>(false);

    // Issue #27: Spending Limits state
    const [spendingLimits, setSpendingLimits] = useState<SpendingLimits | null>(null);
    const [formattedSpendingLimits, setFormattedSpendingLimits] = useState<FormattedSpendingLimits | null>(null);
    const [isLoadingSpendingLimits, setIsLoadingSpendingLimits] = useState<boolean>(false);

    // Initialize SDK on mount
    useEffect(() => {
        const initSdk = async () => {
            setIsLoading(true);
            try {
                const evmClient = new EVMClient({
                    chainId: config.chainId,
                    wormholeChainId: config.wormholeChainId,
                    rpcUrl: config.rpcUrl,
                    hubContractAddress: config.hubContract,
                    wormholeCoreBridge: config.wormholeCoreBridge,
                    name: config.chainName,
                    explorerUrl: config.explorerUrl,
                    // Use Base Sepolia factory for vault address computation and creation
                    vaultFactory: config.vaultFactory,
                    vaultImplementation: config.vaultImplementation,
                });

                const veridexSdk = new VeridexSDK({
                    chain: evmClient,
                    persistWallet: true,
                    testnet: true,
                    // Relayer for remote sponsorship (future primary method)
                    relayerUrl: RELAYER_PROXY_URL,
                    relayerApiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
                    // Wormhole Query Proxy API key (rate limit: 6 queries/sec)
                    queryApiKey: process.env.NEXT_PUBLIC_WORMHOLE_QUERY_API_KEY,
                    // Integrator sponsor key (takes priority over Veridex default)
                    integratorSponsorKey: process.env.NEXT_PUBLIC_INTEGRATOR_SPONSOR_KEY,
                    // Veridex sponsor key (fallback when relayer not available)
                    sponsorPrivateKey: process.env.NEXT_PUBLIC_VERIDEX_SPONSOR_KEY,
                    // RPC URLs for multi-chain sponsorship
                    chainRpcUrls: {
                        10004: config.rpcUrl, // Base Sepolia (hub)
                        10005: spokeConfigs.optimismSepolia.rpcUrl, // Optimism Sepolia
                        10003: spokeConfigs.arbitrumSepolia.rpcUrl, // Arbitrum Sepolia
                        1: solanaConfig.rpcUrl, // Solana Devnet
                    },
                });

                // Initialize Solana client
                const solClient = new SolanaClient({
                    wormholeChainId: solanaConfig.wormholeChainId,
                    rpcUrl: solanaConfig.rpcUrl,
                    programId: solanaConfig.programId,
                    wormholeCoreBridge: solanaConfig.wormholeCoreBridge,
                    tokenBridge: solanaConfig.wormholeTokenBridge,
                    network: solanaConfig.network,
                    commitment: solanaConfig.commitment,
                });
                setSolanaClient(solClient);

                // Initialize Sui client
                const suiClientInstance = new SuiClient({
                    wormholeChainId: suiConfig.wormholeChainId,
                    rpcUrl: suiConfig.rpcUrl,
                    packageId: suiConfig.packageId,
                    wormholeCoreBridge: suiConfig.wormholeCoreBridge,
                    network: suiConfig.network,
                });
                setSuiClient(suiClientInstance);

                // Initialize Aptos client
                const aptosClientInstance = new AptosClient({
                    wormholeChainId: aptosConfig.wormholeChainId,
                    rpcUrl: aptosConfig.rpcUrl,
                    moduleAddress: aptosConfig.moduleAddress,
                    wormholeCoreBridge: aptosConfig.wormholeCoreBridge,
                    tokenBridge: aptosConfig.tokenBridge,
                    network: aptosConfig.network,
                });
                setAptosClient(aptosClientInstance);

                // Initialize Starknet client
                const starknetClientInstance = new StarknetClient({
                    wormholeChainId: starknetConfig.wormholeChainId,
                    rpcUrl: starknetConfig.rpcUrl,
                    spokeContractAddress: starknetConfig.spokeAddress,
                    bridgeContractAddress: starknetConfig.bridgeAddress,
                    network: starknetConfig.network,
                });
                setStarknetClient(starknetClientInstance);

                setSdk(veridexSdk);

                // Try to load existing credential
                const savedCred = veridexSdk.passkey.loadFromLocalStorage();
                if (savedCred) {
                    veridexSdk.setCredential(savedCred);
                    setCredential(savedCred);
                    
                    // Load unified identity (includes vault address)
                    // Pass the locally-created clients since state hasn't been updated yet
                    await loadIdentity(veridexSdk, solClient, {
                        sui: suiClientInstance,
                        aptos: aptosClientInstance,
                        starknet: starknetClientInstance,
                    });

                    // Auto-create non-EVM vaults for returning users
                    // Pass the locally-created clients since state hasn't been updated yet
                    if (savedCred.keyHash) {
                        logger.log('Returning user detected, checking/creating non-EVM vaults...');
                        // Note: We need to define autoCreateNonEvmVaults before this useEffect runs
                        // For now, inline the vault creation check
                        const relayerUrl = RELAYER_PROXY_URL;
                        if (relayerUrl) {
                            const vaultPromises: Promise<void>[] = [];
                            
                            // Check/create Solana vault
                            vaultPromises.push((async () => {
                                try {
                                    const info = await solClient.getVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                    if (!info.exists) {
                                        logger.log('Creating Solana vault for returning user...');
                                        await solClient.createVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                        setSolanaVaultExists(true);
                                    } else {
                                        setSolanaVaultExists(true);
                                    }
                                } catch (e) { logger.warn('Solana vault check failed:', e); }
                            })());

                            // Check/create Sui vault
                            vaultPromises.push((async () => {
                                try {
                                    const info = await suiClientInstance.getVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                    if (!info.exists) {
                                        logger.log('Creating Sui vault for returning user...');
                                        await suiClientInstance.createVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                        setSuiVaultExists(true);
                                    } else {
                                        setSuiVaultExists(true);
                                    }
                                } catch (e) { logger.warn('Sui vault check failed:', e); }
                            })());

                            // Check/create Aptos vault
                            vaultPromises.push((async () => {
                                try {
                                    const info = await aptosClientInstance.getVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                    if (!info.exists) {
                                        logger.log('Creating Aptos vault for returning user...');
                                        await aptosClientInstance.createVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                        setAptosVaultExists(true);
                                    } else {
                                        setAptosVaultExists(true);
                                    }
                                } catch (e) { logger.warn('Aptos vault check failed:', e); }
                            })());

                            // Check/create Starknet vault
                            vaultPromises.push((async () => {
                                try {
                                    const info = await starknetClientInstance.getVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                    if (!info.exists) {
                                        logger.log('Creating Starknet vault for returning user...');
                                        const createResult = await starknetClientInstance.createVaultViaRelayer(savedCred.keyHash, relayerUrl);
                                        setStarknetVaultAddress(createResult.address);
                                        setStarknetVaultExists(true);
                                        logger.log('Starknet vault created:', createResult.address);
                                    } else {
                                        setStarknetVaultAddress(info.vaultAddress);
                                        setStarknetVaultExists(true);
                                        logger.log('Starknet vault found:', info.vaultAddress);
                                    }
                                } catch (e) { logger.warn('Starknet vault check failed:', e); }
                            })());

                            // Run vault checks/creations in parallel (don't block app load)
                            Promise.allSettled(vaultPromises).then(results => {
                                const fulfilled = results.filter(r => r.status === 'fulfilled').length;
                                logger.log(`Returning user vault check complete: ${fulfilled}/${results.length} succeeded`);
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error('SDK initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSdk();
    }, []);

    const loadIdentity = async (
        sdkInstance: VeridexSDK, 
        solClient?: SolanaClient | null,
        clients?: {
            sui?: SuiClient | null;
            aptos?: AptosClient | null;
            starknet?: StarknetClient | null;
        }
    ) => {
        // Use passed clients or fall back to state
        const suiC = clients?.sui ?? suiClient;
        const aptosC = clients?.aptos ?? aptosClient;
        const starknetC = clients?.starknet ?? starknetClient;
        
        try {
            const unifiedIdentity = await sdkInstance.getUnifiedIdentity();
            setIdentity(unifiedIdentity);

            // Get the vault address from identity
            const currentChainAddress = unifiedIdentity.addresses.find(
                a => a.wormholeChainId === config.wormholeChainId ||
                     a.wormholeChainId === spokeConfigs.optimismSepolia.wormholeChainId
            );

            if (currentChainAddress) {
                setVaultAddress(currentChainAddress.address);
                setVaultDeployed(currentChainAddress.deployed);
            } else {
                // Try to compute vault address directly
                try {
                    const addr = sdkInstance.getVaultAddress();
                    setVaultAddress(addr);
                    const exists = await sdkInstance.vaultExists();
                    setVaultDeployed(exists);
                } catch {
                    logger.warn('Could not compute vault address');
                }
            }

            // Set receive address
            try {
                const recvAddr = sdkInstance.getReceiveAddress();
                setReceiveAddress(recvAddr);
            } catch {
                logger.warn('Could not get receive address');
            }

            // Compute Solana vault address using keyHash
            const clientToUse = solClient || solanaClient;
            if (clientToUse && unifiedIdentity.keyHash) {
                try {
                    const solVaultAddr = clientToUse.computeVaultAddress(unifiedIdentity.keyHash);
                    setSolanaVaultAddress(solVaultAddr);
                    logger.log('Solana vault address:', solVaultAddr);
                    
                    // Check if vault exists on-chain via relayer
                    try {
                        const vaultInfo = await clientToUse.getVaultViaRelayer(
                            unifiedIdentity.keyHash,
                            config.relayerUrl
                        );
                        setSolanaVaultExists(vaultInfo.exists);
                        logger.log('Solana vault exists:', vaultInfo.exists);
                    } catch (existsError) {
                        // If relayer check fails, assume not exists (can still receive)
                        logger.warn('Could not check Solana vault existence:', existsError);
                        setSolanaVaultExists(false);
                    }
                } catch (solError) {
                    logger.warn('Could not compute Solana vault address:', solError);
                }
            }

            // Compute Sui vault address using keyHash
            if (suiC && unifiedIdentity.keyHash) {
                try {
                    const suiVaultAddr = suiC.computeVaultAddress(unifiedIdentity.keyHash);
                    setSuiVaultAddress(suiVaultAddr);
                    logger.log('Sui vault address:', suiVaultAddr);
                    
                    // Check if Sui vault exists via relayer
                    try {
                        const vaultInfo = await suiC.getVaultViaRelayer(
                            unifiedIdentity.keyHash,
                            config.relayerUrl
                        );
                        setSuiVaultExists(vaultInfo.exists);
                        logger.log('Sui vault exists:', vaultInfo.exists);
                    } catch (existsError) {
                        // Sui uses implicit accounts - always consider as existing
                        logger.warn('Could not check Sui vault existence:', existsError);
                        setSuiVaultExists(true); // Sui implicit accounts always exist
                    }
                } catch (suiError) {
                    logger.warn('Could not compute Sui vault address:', suiError);
                }
            }

            // Get Aptos vault address from on-chain registry (async)
            if (aptosC && unifiedIdentity.keyHash) {
                try {
                    // Use async getVaultAddress which queries the on-chain VaultRegistry
                    const aptosVaultAddr = await aptosC.getVaultAddress(unifiedIdentity.keyHash);
                    if (aptosVaultAddr) {
                        setAptosVaultAddress(aptosVaultAddr);
                        setAptosVaultExists(true);
                        logger.log('Aptos vault address (from registry):', aptosVaultAddr);
                    } else {
                        // Vault doesn't exist in registry yet
                        setAptosVaultAddress(null);
                        setAptosVaultExists(false);
                        logger.log('Aptos vault not found in registry for keyHash:', unifiedIdentity.keyHash);
                    }
                } catch (aptosError) {
                    logger.warn('Could not get Aptos vault address from registry:', aptosError);
                    setAptosVaultAddress(null);
                    setAptosVaultExists(false);
                }
            }

            // Get Starknet vault address (requires RPC call to spoke contract)
            if (starknetC && unifiedIdentity.keyHash) {
                try {
                    const starknetVaultAddr = await starknetC.getVaultAddress(unifiedIdentity.keyHash);
                    setStarknetVaultAddress(starknetVaultAddr);
                    logger.log('Starknet vault address:', starknetVaultAddr);
                    
                    // Check if Starknet vault exists via relayer
                    try {
                        const vaultInfo = await starknetC.getVaultViaRelayer(
                            unifiedIdentity.keyHash,
                            config.relayerUrl
                        );
                        setStarknetVaultExists(vaultInfo.exists);
                        logger.log('Starknet vault exists:', vaultInfo.exists);
                    } catch (existsError) {
                        logger.warn('Could not check Starknet vault existence:', existsError);
                        setStarknetVaultExists(false);
                    }
                } catch (starknetError) {
                    logger.warn('Could not get Starknet vault address:', starknetError);
                    // Starknet vault may not exist yet - that's okay
                    setStarknetVaultAddress(null);
                }
            }

            // Check if user has backup passkeys (Issue #22/#25)
            try {
                // Check if SDK has the method (may not be available in all versions)
                if (typeof (sdkInstance as any).hasBackupPasskeys === 'function') {
                    const hasBackup = await (sdkInstance as any).hasBackupPasskeys();
                    setHasBackupPasskey(hasBackup);
                } else {
                    setHasBackupPasskey(false);
                }
            } catch {
                logger.warn('Could not check backup passkey status');
                setHasBackupPasskey(false);
            }
        } catch (error) {
            logger.warn('Could not load identity:', error);
            // Fallback to legacy method
            try {
                const vaultInfo = await sdkInstance.getVaultInfo();
                setVaultAddress(vaultInfo?.address || null);
                setVaultDeployed(vaultInfo?.exists || false);
            } catch {
                setVaultAddress(null);
                setVaultDeployed(false);
            }
        }
    };

    /**
     * Auto-create vaults on non-EVM chains via relayer
     * This is called after login or when a returning user loads their identity
     * Can optionally pass client instances for use during initialization before state is set
     */
    const autoCreateNonEvmVaults = async (
        keyHash: string,
        clients?: {
            solana?: SolanaClient | null;
            sui?: SuiClient | null;
            aptos?: AptosClient | null;
            starknet?: StarknetClient | null;
        }
    ) => {
        const relayerUrl = RELAYER_PROXY_URL;
        if (!relayerUrl || !keyHash) {
            logger.log('Skipping non-EVM vault auto-creation: missing relayer URL or keyHash');
            return;
        }

        // Use passed clients or fall back to state
        const solClient = clients?.solana ?? solanaClient;
        const suiC = clients?.sui ?? suiClient;
        const aptosC = clients?.aptos ?? aptosClient;
        const starknetC = clients?.starknet ?? starknetClient;

        logger.log('Auto-creating vaults on Solana, Sui, Aptos, Starknet...');
        const vaultCreationPromises: Promise<void>[] = [];

        // Solana vault auto-creation
        if (solClient) {
            vaultCreationPromises.push((async () => {
                try {
                    const vaultInfo = await solClient.getVaultViaRelayer(keyHash, relayerUrl);
                    if (!vaultInfo.exists) {
                        logger.log('Creating Solana vault...');
                        const result = await solClient.createVaultViaRelayer(keyHash, relayerUrl);
                        logger.log('Solana vault created:', result.address);
                        setSolanaVaultExists(true);
                    } else {
                        setSolanaVaultExists(true);
                    }
                } catch (error) {
                    logger.warn('Solana vault auto-creation failed:', error);
                }
            })());
        }

        // Sui vault auto-creation
        if (suiC) {
            vaultCreationPromises.push((async () => {
                try {
                    const vaultInfo = await suiC.getVaultViaRelayer(keyHash, relayerUrl);
                    if (!vaultInfo.exists) {
                        logger.log('Creating Sui vault...');
                        const result = await suiC.createVaultViaRelayer(keyHash, relayerUrl);
                        logger.log('Sui vault created:', result.address);
                        setSuiVaultExists(true);
                    } else {
                        setSuiVaultExists(true);
                    }
                } catch (error) {
                    logger.warn('Sui vault auto-creation failed:', error);
                }
            })());
        }

        // Aptos vault auto-creation
        if (aptosC) {
            vaultCreationPromises.push((async () => {
                try {
                    const vaultInfo = await aptosC.getVaultViaRelayer(keyHash, relayerUrl);
                    if (!vaultInfo.exists) {
                        logger.log('Creating Aptos vault...');
                        const result = await aptosC.createVaultViaRelayer(keyHash, relayerUrl);
                        logger.log('Aptos vault created:', result.address);
                        setAptosVaultExists(true);
                    } else {
                        setAptosVaultExists(true);
                    }
                } catch (error) {
                    logger.warn('Aptos vault auto-creation failed:', error);
                }
            })());
        }

        // Starknet vault auto-creation
        if (starknetC) {
            vaultCreationPromises.push((async () => {
                try {
                    const vaultInfo = await starknetC.getVaultViaRelayer(keyHash, relayerUrl);
                    if (!vaultInfo.exists) {
                        logger.log('Creating Starknet vault...');
                        const result = await starknetC.createVaultViaRelayer(keyHash, relayerUrl);
                        logger.log('Starknet vault created (async via Hub dispatch):', result.address);
                        setStarknetVaultExists(true);
                    } else {
                        setStarknetVaultExists(true);
                    }
                } catch (error) {
                    logger.warn('Starknet vault auto-creation failed:', error);
                }
            })());
        }

        // Wait for all vault creations (don't block on failures)
        const results = await Promise.allSettled(vaultCreationPromises);
        const fulfilled = results.filter(r => r.status === 'fulfilled').length;
        logger.log(`Non-EVM vault auto-creation complete: ${fulfilled}/${results.length} succeeded`);
    };

    // ========================================================================
    // Phase 2: Balance Methods
    // ========================================================================

    /**
     * Refresh balances for the hub chain (Base Sepolia)
     * This also updates the vaultBalances state for backward compatibility
     */
    const refreshBalances = async () => {
        if (!sdk || !vaultAddress) return;
        
        setIsLoadingBalances(true);
        try {
            const balances = await sdk.getVaultBalances(true);
            setVaultBalances(balances);
            // Also update chainBalances for hub chain
            setChainBalances(prev => ({
                ...prev,
                [config.wormholeChainId]: balances,
            }));
        } catch (error) {
            logger.error('Error fetching balances:', error);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    /**
     * Refresh balances for a specific chain by Wormhole chain ID
     * Each EVM chain has its own vault address and balances
     */
    const refreshBalancesForChain = async (wormholeChainId: number) => {
        if (!sdk) return;
        
        setIsLoadingBalances(true);
        try {
            // Use the new SDK method that properly computes per-chain vault addresses
            const balances = await sdk.getVaultBalancesForChain(wormholeChainId, true);
            
            setChainBalances(prev => ({
                ...prev,
                [wormholeChainId]: balances,
            }));
            
            // If this is the hub chain, also update vaultBalances for backward compatibility
            if (wormholeChainId === config.wormholeChainId) {
                setVaultBalances(balances);
            }
        } catch (error) {
            logger.error(`Error fetching balances for chain ${wormholeChainId}:`, error);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    const getTokenBalance = async (tokenAddress: string): Promise<TokenBalance> => {
        if (!sdk) throw new Error('SDK not initialized');
        return await sdk.getVaultTokenBalance(tokenAddress);
    };

    const getTokenList = (): TokenInfo[] => {
        if (!sdk) return [];
        return sdk.getTokenList();
    };

    // ========================================================================
    // Issue #26: Human-Readable Transaction Summaries
    // ========================================================================

    /**
     * Parse a prepared transaction into a human-readable summary
     * Includes risk warnings, formatted amounts, and action descriptions
     */
    const parseTransaction = useCallback(async (
        prepared: PreparedTransfer | PreparedBridge
    ): Promise<TransactionSummary> => {
        if (!sdk) throw new Error('SDK not initialized');
        return await sdk.transactionParser.parse(prepared, vaultAddress || undefined);
    }, [sdk, vaultAddress]);

    // ========================================================================
    // Issue #27: Spending Limits
    // ========================================================================

    /**
     * Refresh spending limits for the current vault
     */
    const refreshSpendingLimits = useCallback(async () => {
        if (!sdk || !vaultAddress) return;
        
        setIsLoadingSpendingLimits(true);
        try {
            const chainId = config.wormholeChainId;
            const limits = await sdk.spendingLimits.getSpendingLimits(vaultAddress, chainId);
            setSpendingLimits(limits);
            
            const formatted = await sdk.spendingLimits.getFormattedSpendingLimits(
                vaultAddress, 
                chainId,
                { decimals: 18, symbol: 'ETH' }
            );
            setFormattedSpendingLimits(formatted);
        } catch (error) {
            logger.error('Error fetching spending limits:', error);
        } finally {
            setIsLoadingSpendingLimits(false);
        }
    }, [sdk, vaultAddress]);

    /**
     * Check if a transaction amount is within spending limits
     */
    const checkTransactionLimit = useCallback(async (amount: bigint): Promise<LimitCheckResult | null> => {
        if (!sdk || !vaultAddress) return null;
        
        const chainId = config.wormholeChainId;
        return await sdk.spendingLimits.checkTransactionLimit(vaultAddress, chainId, amount);
    }, [sdk, vaultAddress]);

    /**
     * Set a new daily spending limit (requires passkey signature)
     */
    const setDailyLimit = useCallback(async (newLimit: bigint): Promise<void> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');
        if (!vaultAddress) throw new Error('No vault address');

        setIsLoading(true);
        try {
            // Prepare and execute the daily limit update
            const prepared = await sdk.prepareSetDailyLimit(newLimit);
            await sdk.executeTransfer(prepared, signer);

            // Refresh limits after update
            await refreshSpendingLimits();
        } finally {
            setIsLoading(false);
        }
    }, [sdk, signer, vaultAddress, refreshSpendingLimits]);

    /**
     * Pause the vault (emergency freeze)
     */
    const pauseVault = useCallback(async (): Promise<void> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');
        if (!vaultAddress) throw new Error('No vault address');

        setIsLoading(true);
        try {
            // Prepare and execute the pause action
            const prepared = await sdk.preparePauseVault();
            await sdk.executeTransfer(prepared, signer);

            // Refresh limits after pause
            await refreshSpendingLimits();
        } finally {
            setIsLoading(false);
        }
    }, [sdk, signer, vaultAddress, refreshSpendingLimits]);

    /**
     * Unpause the vault
     */
    const unpauseVault = useCallback(async (): Promise<void> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');
        if (!vaultAddress) throw new Error('No vault address');

        setIsLoading(true);
        try {
            // Prepare and execute the unpause action
            const prepared = await sdk.prepareUnpauseVault();
            await sdk.executeTransfer(prepared, signer);

            // Refresh limits after unpause
            await refreshSpendingLimits();
        } finally {
            setIsLoading(false);
        }
    }, [sdk, signer, vaultAddress, refreshSpendingLimits]);

    // Auto-refresh spending limits when vault address changes
    useEffect(() => {
        if (vaultAddress && vaultDeployed) {
            refreshSpendingLimits();
        }
    }, [vaultAddress, vaultDeployed, refreshSpendingLimits]);

    // ========================================================================
    // Solana Balance Methods
    // ========================================================================

    const refreshSolanaBalance = async () => {
        if (!solanaClient || !solanaVaultAddress) return;

        setIsLoadingSolanaBalance(true);
        try {
            // Use the Solana client's connection to fetch the balance
            const response = await fetch(solanaConfig.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getBalance',
                    params: [solanaVaultAddress],
                }),
            });

            const data = await response.json();
            if (data.result && typeof data.result.value === 'number') {
                const lamports = BigInt(data.result.value);
                const solAmount = Number(lamports) / 1_000_000_000;
                setSolanaBalance({
                    address: solanaVaultAddress,
                    lamports,
                    sol: solAmount,
                    native: solAmount,
                    // TODO: Fetch SOL price from an oracle/API for USD value
                    usdValue: undefined,
                });
            } else {
                // Default to zero (unfunded account or unexpected RPC response)
                setSolanaBalance({
                    address: solanaVaultAddress,
                    lamports: 0n,
                    sol: 0,
                    native: 0,
                    usdValue: undefined,
                });
            }
        } catch (error) {
            logger.error('Error fetching Solana balance:', error);
            // Set zero balance on error so UI doesn't hang
            setSolanaBalance({
                address: solanaVaultAddress,
                lamports: 0n,
                sol: 0,
                native: 0,
                usdValue: undefined,
            });
        } finally {
            setIsLoadingSolanaBalance(false);
        }
    };

    const getSolanaReceiveAddress = (): string | null => {
        return solanaVaultAddress;
    };

    // ========================================================================
    // Sui Balance Methods
    // ========================================================================

    const refreshSuiBalance = async () => {
        if (!suiVaultAddress) return;

        setIsLoadingSuiBalance(true);
        try {
            // Sui RPC call to get balance
            const response = await fetch(suiConfig.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'suix_getBalance',
                    params: [suiVaultAddress, '0x2::sui::SUI'],
                }),
            });

            const data = await response.json();
            if (data.result && data.result.totalBalance) {
                const mist = BigInt(data.result.totalBalance);
                const suiAmount = Number(mist) / 1_000_000_000; // 9 decimals
                setSuiBalance({
                    address: suiVaultAddress,
                    mist,
                    sui: suiAmount,
                    usdValue: undefined,
                });
            } else {
                // No balance or new account
                setSuiBalance({
                    address: suiVaultAddress,
                    mist: 0n,
                    sui: 0,
                    usdValue: undefined,
                });
            }
        } catch (error) {
            logger.error('Error fetching Sui balance:', error);
            // Set zero balance on error so UI doesn't hang
            setSuiBalance({
                address: suiVaultAddress,
                mist: 0n,
                sui: 0,
                usdValue: undefined,
            });
        } finally {
            setIsLoadingSuiBalance(false);
        }
    };

    // ========================================================================
    // Aptos Balance Methods
    // ========================================================================

    const refreshAptosBalance = async () => {
        if (!aptosVaultAddress) return;

        setIsLoadingAptosBalance(true);
        try {
            // Normalize address - ensure it has 0x prefix
            const normalizedAddress = aptosVaultAddress.startsWith('0x') 
                ? aptosVaultAddress 
                : `0x${aptosVaultAddress}`;
            
            // Determine base URL - Alchemy URLs need /v1/ appended, Aptoslabs already has it
            const baseUrl = aptosConfig.rpcUrl.includes('alchemy.com') 
                ? `${aptosConfig.rpcUrl}/v1`
                : aptosConfig.rpcUrl;

            const fetchAptCoinBalance = async (viewBaseUrl: string): Promise<bigint | null> => {
                const viewUrl = `${viewBaseUrl}/view`;
                const viewResponse = await fetch(viewUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        function: '0x1::coin::balance',
                        type_arguments: ['0x1::aptos_coin::AptosCoin'],
                        arguments: [normalizedAddress],
                    }),
                });

                if (!viewResponse.ok) return null;

                const viewData = await viewResponse.json();
                const raw = Array.isArray(viewData) ? viewData[0] : null;
                if (raw === null || raw === undefined) return null;

                return BigInt(raw);
            };

            // Primary: use the configured provider's view endpoint.
            // This returns the correct balance even when CoinStore isn't present in /resources.
            let octas: bigint | null = null;
            try {
                octas = await fetchAptCoinBalance(baseUrl);
            } catch {
                octas = null;
            }

            // Fallback: Aptos Labs fullnode (helps when third-party providers have view quirks).
            if (octas === null) {
                try {
                    octas = await fetchAptCoinBalance('https://fullnode.testnet.aptoslabs.com/v1');
                } catch {
                    octas = null;
                }
            }

            // If both queries fail, default to zero (don't block the UI).
            const safeOctas = octas ?? 0n;
            const aptAmount = Number(safeOctas) / 100_000_000; // 8 decimals

            setAptosBalance({
                address: aptosVaultAddress,
                octas: safeOctas,
                apt: aptAmount,
                usdValue: undefined,
            });
        } catch (error) {
            logger.error('Error fetching Aptos balance:', error);
            // Set zero balance on error so UI doesn't hang
            setAptosBalance({
                address: aptosVaultAddress,
                octas: 0n,
                apt: 0,
                usdValue: undefined,
            });
        } finally {
            setIsLoadingAptosBalance(false);
        }
    };

    // ========================================================================
    // Starknet Balance Methods
    // ========================================================================

    const refreshStarknetBalance = async () => {
        if (!starknetVaultAddress) return;

        setIsLoadingStarknetBalance(true);
        try {
            // Starknet RPC call to get STRK balance
            // STRK token contract on Sepolia
            const strkContractAddress = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
            
            const response = await fetch(starknetConfig.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'starknet_call',
                    params: [{
                        contract_address: strkContractAddress,
                        entry_point_selector: '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e', // balanceOf
                        calldata: [starknetVaultAddress],
                    }, 'latest'],
                }),
            });

            const data = await response.json();
            if (data.result && data.result.length >= 2) {
                // Starknet returns u256 as two felt252 (low, high)
                const low = BigInt(data.result[0]);
                const high = BigInt(data.result[1]);
                const wei = low + (high << 128n);
                const strkAmount = Number(wei) / 1e18; // 18 decimals
                setStarknetBalance({
                    address: starknetVaultAddress,
                    wei,
                    strk: strkAmount,
                    usdValue: undefined,
                });
            } else {
                setStarknetBalance({
                    address: starknetVaultAddress,
                    wei: 0n,
                    strk: 0,
                    usdValue: undefined,
                });
            }
        } catch (error) {
            logger.error('Error fetching Starknet balance:', error);
            // Set zero balance on error
            setStarknetBalance({
                address: starknetVaultAddress,
                wei: 0n,
                strk: 0,
                usdValue: undefined,
            });
        } finally {
            setIsLoadingStarknetBalance(false);
        }
    };

    /**
     * Get vault address for any supported chain by Wormhole chain ID
     * This is the universal accessor for multi-chain vault addresses
     * 
     * IMPORTANT: Each EVM chain has its own vault address computed from
     * the chain's factory contract. This is NOT the same as the hub vault address.
     */
    const getVaultAddressForChain = useCallback((wormholeChainId: number): string | null => {
        // For EVM chains, use SDK's method to compute the correct per-chain address
        if (sdk && identity?.keyHash) {
            const isEvmChain = wormholeChainId === 10004 || wormholeChainId === 10005 || 
                               wormholeChainId === 10003 || wormholeChainId === 40;
            if (isEvmChain) {
                try {
                    return sdk.getVaultAddressForChain(wormholeChainId, identity.keyHash);
                } catch (error) {
                    logger.warn(`Failed to derive vault address for chain ${wormholeChainId}:`, error);
                    // Fallback to hub vault address (may be wrong, but better than null)
                    return vaultAddress;
                }
            }
        }

        switch (wormholeChainId) {
            // EVM chains - fallback when SDK not available
            case 10004: // Base Sepolia (hub)
                return vaultAddress;
            case 10005: // Optimism Sepolia
            case 10003: // Arbitrum Sepolia
            case 40:    // Sei Atlantic-2
                // Without SDK, we can't compute the correct address
                // Return vaultAddress as fallback (this may show wrong balances)
                logger.warn(`SDK not available, returning hub vault address for chain ${wormholeChainId}`);
                return vaultAddress;
            
            // Solana
            case 1:
                return solanaVaultAddress;
            
            // Sui
            case 21:
                return suiVaultAddress;
            
            // Aptos
            case 22:
                return aptosVaultAddress;
            
            // Starknet
            case 50001:
                return starknetVaultAddress;
            
            default:
                logger.warn(`Unknown chain ID: ${wormholeChainId}`);
                return null;
        }
    }, [sdk, identity?.keyHash, vaultAddress, solanaVaultAddress, suiVaultAddress, aptosVaultAddress, starknetVaultAddress]);

    /**
     * All vault addresses across chains (computed)
     */
    const multiChainVaultAddresses: MultiChainVaultAddresses = {
        evm: vaultAddress,
        solana: solanaVaultAddress,
        sui: suiVaultAddress,
        aptos: aptosVaultAddress,
        starknet: starknetVaultAddress,
    };

    /**
     * Create a Solana vault via the relayer (sponsored/gasless)
     * The vault PDA can receive SOL even before on-chain creation,
     * but sending requires the vault account to exist.
     */
    const createSolanaVault = async (): Promise<VaultCreationResult> => {
        if (!solanaClient) throw new Error('Solana client not initialized');
        if (!identity?.keyHash) throw new Error('Not logged in');

        setIsLoading(true);
        try {
            const result = await solanaClient.createVaultViaRelayer(
                identity.keyHash,
                config.relayerUrl
            );
            
            // Update vault exists state
            setSolanaVaultExists(true);
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create a Sui vault via the relayer (sponsored/gasless)
     * Sui uses implicit accounts - the vault address can receive funds without explicit creation.
     */
    const createSuiVault = async (): Promise<VaultCreationResult> => {
        if (!suiClient) throw new Error('Sui client not initialized');
        if (!identity?.keyHash) throw new Error('Not logged in');

        setIsLoading(true);
        try {
            const result = await suiClient.createVaultViaRelayer(
                identity.keyHash,
                config.relayerUrl
            );
            
            // Sui implicit accounts always exist
            setSuiVaultExists(true);
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create an Aptos vault via the relayer (sponsored/gasless)
     * Aptos requires an explicit on-chain vault creation via the spoke::create_vault entry function.
     */
    const createAptosVault = async (): Promise<VaultCreationResult> => {
        if (!aptosClient) throw new Error('Aptos client not initialized');
        if (!identity?.keyHash) throw new Error('Not logged in');

        setIsLoading(true);
        try {
            const result = await aptosClient.createVaultViaRelayer(
                identity.keyHash,
                config.relayerUrl
            );
            
            // Update vault exists state
            setAptosVaultExists(true);
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Create a Starknet vault via the relayer (sponsored/gasless)
     * Starknet vault creation is async - requires Hub dispatch via custom bridge.
     */
    const createStarknetVault = async (): Promise<VaultCreationResult> => {
        if (!starknetClient) throw new Error('Starknet client not initialized');
        if (!identity?.keyHash) throw new Error('Not logged in');

        setIsLoading(true);
        try {
            const result = await starknetClient.createVaultViaRelayer(
                identity.keyHash,
                config.relayerUrl
            );
            
            // Set the vault address from the result
            if (result.address) {
                setStarknetVaultAddress(result.address);
                logger.log('Starknet vault created:', result.address);
            }
            setStarknetVaultExists(true);
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-refresh Solana balance when vault address changes
    useEffect(() => {
        if (solanaVaultAddress) {
            refreshSolanaBalance();
        }
    }, [solanaVaultAddress]);

    // ========================================================================
    // Phase 2: Transfer Methods
    // ========================================================================

    const prepareTransfer = async (params: TransferParams): Promise<PreparedTransfer> => {
        if (!sdk) throw new Error('SDK not initialized');
        return await sdk.prepareTransfer(params);
    };

    const executeTransfer = async (prepared: PreparedTransfer): Promise<TransferResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');
        
        setIsLoading(true);
        try {
            const result = await sdk.executeTransfer(prepared, signer);
            
            // Update pending transactions
            updatePendingTransactions();
            
            // Refresh balances after transfer
            await refreshBalances();
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    const transfer = async (params: TransferParams): Promise<TransferResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');
        
        setIsLoading(true);
        try {
            const result = await sdk.transferWithTracking(params, signer, (state) => {
                updatePendingTransactions();
            });
            
            // Refresh balances after transfer
            await refreshBalances();
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Execute a gasless transfer using the relayer
     * 
     * This method allows users to send funds without paying gas themselves.
     * The relayer service pays the gas fees on behalf of the user.
     * Users only need to authenticate with their passkey.
     */
    const transferGasless = async (params: TransferParams): Promise<TransferResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        
        setIsLoading(true);
        try {
            logger.log('[Veridex] Starting gasless transfer:', params);
            const result = await sdk.transferViaRelayer(params, (state) => {
                updatePendingTransactions();
            });
            logger.log('[Veridex] Gasless transfer successful:', result);
            
            // Refresh balances after transfer
            await refreshBalances();
            
            return result;
        } catch (err: any) {
            logger.error('[Veridex] Gasless transfer failed:', err?.message || err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Execute a gasless bridge using the relayer
     * 
     * This method allows users to bridge funds across chains without paying gas themselves.
     * The relayer service pays the gas fees on behalf of the user.
     */
    const bridgeGasless = async (
        params: BridgeParams,
        onProgress?: (progress: CrossChainProgress) => void
    ): Promise<BridgeResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        
        setIsLoading(true);
        try {
            logger.log('[Veridex] Starting gasless bridge:', params);
            const result = await sdk.bridgeViaRelayer(params, (progress) => {
                setBridgeProgress(progress);
                onProgress?.(progress);
                updatePendingBridges();
            });
            logger.log('[Veridex] Gasless bridge successful:', result);
            
            // Refresh balances after bridge
            await refreshBalances();
            
            return result;
        } catch (err: any) {
            logger.error('[Veridex] Gasless bridge failed:', err?.message || err);
            throw err;
        } finally {
            setIsLoading(false);
            setBridgeProgress(null);
        }
    };

    const updatePendingTransactions = () => {
        if (!sdk) return;
        const pending = sdk.transactions.getPending();
        setPendingTransactions(pending);
    };

    const waitForTransaction = async (hash: string): Promise<TransactionState> => {
        if (!sdk) throw new Error('SDK not initialized');
        return await sdk.waitForTransaction(hash);
    };

    // ========================================================================
    // Phase 2: Receive Methods
    // ========================================================================

    const getPaymentRequest = (
        amount: bigint, 
        tokenAddress: string = 'native', 
        decimals: number = 18
    ): ReceiveAddress | null => {
        if (!sdk) return null;
        return sdk.getPaymentRequest(amount, tokenAddress, decimals);
    };

    // ========================================================================
    // Phase 3: Cross-Chain Methods
    // ========================================================================

    const prepareBridge = async (params: BridgeParams): Promise<PreparedBridge> => {
        if (!sdk) throw new Error('SDK not initialized');
        return await sdk.prepareBridge(params);
    };

    const executeBridge = async (
        prepared: PreparedBridge, 
        onProgress?: (progress: CrossChainProgress) => void
    ): Promise<BridgeResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');

        setIsLoading(true);
        try {
            const result = await sdk.executeBridge(prepared, signer, (progress) => {
                setBridgeProgress(progress);
                onProgress?.(progress);
                updatePendingBridges();
            });

            // Refresh balances after bridge
            await refreshBalances();

            return result;
        } finally {
            setIsLoading(false);
            setBridgeProgress(null);
        }
    };

    const bridgeWithTracking = async (
        params: BridgeParams,
        onProgress?: (progress: CrossChainProgress) => void
    ): Promise<BridgeResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');

        setIsLoading(true);
        try {
            const result = await sdk.bridgeWithTracking(params, signer, (progress) => {
                setBridgeProgress(progress);
                onProgress?.(progress);
                updatePendingBridges();
            });

            // Refresh balances after bridge
            await refreshBalances();

            return result;
        } finally {
            setIsLoading(false);
            setBridgeProgress(null);
        }
    };

    const updatePendingBridges = () => {
        if (!sdk) return;
        const pending = sdk.getPendingBridges();
        setPendingBridges(pending);
    };

    // ========================================================================
    // Sponsored Vault Creation (Gasless)
    // ========================================================================

    const isSponsorshipAvailable = (): boolean => {
        if (!sdk) return false;
        return sdk.isSponsorshipAvailable();
    };

    const createSponsoredVaults = async (): Promise<MultiChainVaultResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!credential) throw new Error('Not registered');

        setIsCreatingSponsoredVaults(true);
        try {
            // Use ensureSponsoredVaultsOnAllChains to create vaults only where needed
            // The SDK uses the internal credential's keyHash
            const result = await sdk.ensureSponsoredVaultsOnAllChains();
            setSponsoredVaultStatus(result);

            // Refresh identity to update vault deployment status
            await loadIdentity(sdk);

            return result;
        } catch (error) {
            logger.error('Sponsored vault creation error:', error);
            throw error;
        } finally {
            setIsCreatingSponsoredVaults(false);
        }
    };

    const refreshIdentity = async () => {
        if (!sdk) return;
        setIsLoading(true);
        try {
            await loadIdentity(sdk);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, displayName: string) => {
        if (!sdk) throw new Error('SDK not initialized');

        setIsLoading(true);
        try {
            const cred = await sdk.passkey.register(username, displayName);
            sdk.setCredential(cred);
            setCredential(cred);
            sdk.passkey.saveToLocalStorage();

            // Save to relayer for cross-device recovery (fire and forget)
            sdk.passkey.saveCredentialToRelayer().catch(err => {
                logger.warn('Failed to save credential to relayer (cross-device recovery may not work):', err);
            });

            // Load identity which includes deterministic vault address
            await loadIdentity(sdk);

            // Automatically create vaults on all chains using gas sponsorship
            // This makes the experience truly gasless for the user
            if (sdk.isSponsorshipAvailable()) {
                logger.log('Auto-creating vaults on all chains (sponsored)...');
                setIsCreatingSponsoredVaults(true);
                try {
                    // SDK uses the internal credential's keyHash
                    const vaultResult = await sdk.ensureSponsoredVaultsOnAllChains();
                    setSponsoredVaultStatus(vaultResult);
                    logger.log('Sponsored vaults created:', vaultResult);
                    
                    // Refresh identity to update vault deployment status
                    await loadIdentity(sdk);
                } catch (vaultError) {
                    logger.warn('Auto vault creation failed (can be retried manually):', vaultError);
                    // Don't throw - registration was successful, vault creation is optional
                } finally {
                    setIsCreatingSponsoredVaults(false);
                }
            }

            // Auto-create vaults on non-EVM chains via relayer
            await autoCreateNonEvmVaults(cred.keyHash);
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async () => {
        if (!sdk) throw new Error('SDK not initialized');

        setIsLoading(true);
        try {
            // Use discoverable credential authentication
            // This will show all available passkeys for this site
            const { credential: cred } = await sdk.passkey.authenticate();
            
            sdk.setCredential(cred);
            setCredential(cred);
            
            // Save to localStorage in case it wasn't saved before
            sdk.passkey.saveToLocalStorage();
            
            // Load identity
            await loadIdentity(sdk);

            // Auto-create vaults on chains where they don't exist (sponsored)
            if (sdk.isSponsorshipAvailable()) {
                logger.log('Checking vaults on all chains...');
                setIsCreatingSponsoredVaults(true);
                try {
                    // ensureSponsoredVaultsOnAllChains only creates vaults where they don't exist
                    const vaultResult = await sdk.ensureSponsoredVaultsOnAllChains();
                    
                    // Only show status if any vaults were created (not just already existing)
                    const newlyCreated = vaultResult.results.filter(r => r.success && !r.alreadyExists);
                    if (newlyCreated.length > 0) {
                        logger.log('Created vaults on:', newlyCreated.map(r => r.chain).join(', '));
                        setSponsoredVaultStatus(vaultResult);
                        // Refresh identity to update vault deployment status
                        await loadIdentity(sdk);
                    } else {
                        logger.log('All vaults already exist');
                    }
                } catch (vaultError) {
                    logger.warn('Vault check/creation failed (can be retried manually):', vaultError);
                    // Don't throw - login was successful, vault creation is optional
                } finally {
                    setIsCreatingSponsoredVaults(false);
                }
            }

            // Auto-create vaults on non-EVM chains via relayer
            await autoCreateNonEvmVaults(cred.keyHash);
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const createVault = async (): Promise<VaultCreationResult> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected');

        setIsLoading(true);
        try {
            const result = await sdk.createVault(signer);
            
            // Refresh identity to update vault status
            await loadIdentity(sdk);
            
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not installed');
        }

        setIsLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            // Request account access
            await provider.send('eth_requestAccounts', []);

            // Get signer
            const walletSigner = await provider.getSigner();
            const walletAddress = await walletSigner.getAddress();

            // Check if we're on the right network
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== config.chainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
                    });
                } catch (switchError: any) {
                    // Chain not added, try to add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: `0x${config.chainId.toString(16)}`,
                                chainName: config.chainName,
                                rpcUrls: [config.rpcUrl],
                                blockExplorerUrls: [config.explorerUrl],
                            }],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            setSigner(walletSigner);
            setAddress(walletAddress);
        } catch (error) {
            logger.error('Wallet connection error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setSigner(null);
        setAddress(null);
    };

    const logout = () => {
        if (sdk) {
            // Note: We intentionally do NOT remove the credential from localStorage
            // This allows users to sign back in with the same passkey
            // Only clear the session state
            sdk.clearCredential();
            sdk.wallet.clearCache();
            sdk.transactions.stopAll();
        }
        setCredential(null);
        setIdentity(null);
        setVaultAddress(null);
        setVaultDeployed(false);
        setVaultBalances(null);
        setReceiveAddress(null);
        setPendingTransactions([]);
    };

    /**
     * Fully delete the credential from localStorage
     * Use this when the user wants to completely remove their passkey data
     */
    const deleteCredential = () => {
        if (sdk) {
            sdk.passkey.removeFromLocalStorage();
            sdk.clearCredential();
            sdk.wallet.clearCache();
            sdk.transactions.stopAll();
        }
        setCredential(null);
        setIdentity(null);
        setVaultAddress(null);
        setVaultDeployed(false);
        setVaultBalances(null);
        setReceiveAddress(null);
        setPendingTransactions([]);
    };

    /**
     * Check if there's a stored credential that can be used for login
     */
    const hasStoredCredential = (): boolean => {
        if (!sdk) return false;
        // Check if the method exists (in case of SDK version mismatch)
        if (typeof sdk.passkey.hasStoredCredential !== 'function') {
            // Fallback: check localStorage directly
            if (typeof window === 'undefined') return false;
            return localStorage.getItem('veridex_credential') !== null;
        }
        return sdk.passkey.hasStoredCredential();
    };

    /**
     * Check if user has backup passkeys registered (Issue #22/#25)
     */
    const checkBackupPasskeyStatus = async (): Promise<void> => {
        if (!sdk || !credential) {
            setHasBackupPasskey(false);
            return;
        }
        try {
            // Check if SDK has the method (may not be available in all versions)
            if (typeof (sdk as any).hasBackupPasskeys === 'function') {
                const hasBackup = await (sdk as any).hasBackupPasskeys();
                setHasBackupPasskey(hasBackup);
            } else {
                setHasBackupPasskey(false);
            }
        } catch (err) {
            logger.warn('Failed to check backup passkey status:', err);
            setHasBackupPasskey(false);
        }
    };

    /**
     * Add a backup passkey for the current identity (Issue #22/#25)
     * Requires wallet connection (signer) for gas payment.
     * Prompts user to create a new passkey and registers it as a backup.
     */
    const addBackupPasskey = async (): Promise<void> => {
        if (!sdk) throw new Error('SDK not initialized');
        if (!signer) throw new Error('Wallet not connected. Please connect your wallet first.');
        if (!credential) throw new Error('No passkey registered. Please register a passkey first.');

        // Check if SDK has the method (may not be available in all versions)
        if (typeof (sdk as any).addBackupPasskey !== 'function') {
            throw new Error('Backup passkey feature not available in this SDK version');
        }

        setIsAddingBackupPasskey(true);
        try {
            // Create a new passkey credential for backup
            // Use a different username to distinguish from primary
            const backupUsername = `${credential.credentialId.slice(0, 8)}-backup-${Date.now()}`;
            const backupCred = await sdk.passkey.register(backupUsername, 'Backup Passkey');

            // Add the backup passkey to the identity
            const result = await (sdk as any).addBackupPasskey(backupCred, signer);
            logger.log('Backup passkey added:', result);

            // Update backup status
            setHasBackupPasskey(true);

            // Re-set the original credential (registration changes the active credential)
            sdk.setCredential(credential);
        } finally {
            setIsAddingBackupPasskey(false);
        }
    };

    return (
        <VeridexContext.Provider
            value={{
                sdk,
                credential,
                identity,
                signer,
                address,
                isConnected: !!signer && !!address,
                isRegistered: !!credential,
                vaultAddress,
                vaultDeployed,
                isLoading,
                
                // Phase 1
                register,
                login,
                connectWallet,
                disconnectWallet,
                logout,
                deleteCredential,
                hasStoredCredential,
                createVault,
                refreshIdentity,
                
                // Sponsored Vault Creation (Gasless)
                createSponsoredVaults,
                isSponsorshipAvailable,
                sponsoredVaultStatus,
                isCreatingSponsoredVaults,
                
                // Phase 2: Balances
                vaultBalances,
                chainBalances,
                isLoadingBalances,
                refreshBalances,
                refreshBalancesForChain,
                getTokenBalance,
                getTokenList,
                
                // Phase 2: Transfers
                prepareTransfer,
                executeTransfer,
                transfer,
                transferGasless,
                bridgeGasless,
                
                // Phase 2: Receive
                receiveAddress,
                getPaymentRequest,
                
                // Phase 2: Tracking
                pendingTransactions,
                waitForTransaction,

                // Phase 3: Cross-Chain
                prepareBridge,
                executeBridge,
                bridgeWithTracking,
                pendingBridges,
                bridgeProgress,

                // Solana
                solanaClient,
                solanaVaultAddress,
                solanaBalance,
                isLoadingSolanaBalance,
                refreshSolanaBalance,
                getSolanaReceiveAddress,
                createSolanaVault,
                solanaVaultExists,

                // Multi-chain vault addresses (Sui, Aptos, Starknet)
                suiVaultAddress,
                aptosVaultAddress,
                starknetVaultAddress,
                getVaultAddressForChain,
                multiChainVaultAddresses,

                // Sui vault management
                suiVaultExists,
                createSuiVault,
                suiBalance,
                isLoadingSuiBalance,
                refreshSuiBalance,

                // Aptos vault management
                aptosVaultExists,
                createAptosVault,
                aptosBalance,
                isLoadingAptosBalance,
                refreshAptosBalance,

                // Starknet vault management
                starknetVaultExists,
                createStarknetVault,
                starknetBalance,
                isLoadingStarknetBalance,
                refreshStarknetBalance,

                // Backup Passkey Management (Issue #22/#25)
                hasBackupPasskey,
                isAddingBackupPasskey,
                addBackupPasskey,
                checkBackupPasskeyStatus,

                // Issue #26: Human-Readable Transaction Summaries
                parseTransaction,

                // Issue #27: Spending Limits
                spendingLimits,
                formattedSpendingLimits,
                isLoadingSpendingLimits,
                refreshSpendingLimits,
                checkTransactionLimit,
                setDailyLimit,
                pauseVault,
                unpauseVault,
            }}
        >
            {children}
        </VeridexContext.Provider>
    );
}

export function useVeridex() {
    const context = useContext(VeridexContext);
    if (context === undefined) {
        throw new Error('useVeridex must be used within a VeridexProvider');
    }
    return context;
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        ethereum?: any;
    }
}
