'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
} from '@veridex/sdk';
import { EVMClient } from '@veridex/sdk/chains/evm';
import { ethers } from 'ethers';
import { config, spokeConfigs } from '@/lib/config';

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
    
    // Phase 2: Balances
    vaultBalances: PortfolioBalance | null;
    isLoadingBalances: boolean;
    refreshBalances: () => Promise<void>;
    getTokenBalance: (tokenAddress: string) => Promise<TokenBalance>;
    getTokenList: () => TokenInfo[];
    
    // Phase 2: Transfers
    prepareTransfer: (params: TransferParams) => Promise<PreparedTransfer>;
    executeTransfer: (prepared: PreparedTransfer) => Promise<TransferResult>;
    transfer: (params: TransferParams) => Promise<TransferResult>;
    
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
    const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
    const [receiveAddress, setReceiveAddress] = useState<ReceiveAddress | null>(null);
    const [pendingTransactions, setPendingTransactions] = useState<TransactionState[]>([]);

    // Phase 3 state
    const [pendingBridges, setPendingBridges] = useState<CrossChainResult[]>([]);
    const [bridgeProgress, setBridgeProgress] = useState<CrossChainProgress | null>(null);

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
                    // Use Optimism Sepolia factory for vault address computation
                    // (Hub chain doesn't have vaults, spokes do)
                    vaultFactory: spokeConfigs.optimismSepolia.vaultFactory,
                    vaultImplementation: spokeConfigs.optimismSepolia.vaultImplementation,
                });

                const veridexSdk = new VeridexSDK({
                    chain: evmClient,
                    persistWallet: true,
                    testnet: true,
                });

                setSdk(veridexSdk);

                // Try to load existing credential
                const savedCred = veridexSdk.passkey.loadFromLocalStorage();
                if (savedCred) {
                    veridexSdk.setCredential(savedCred);
                    setCredential(savedCred);
                    
                    // Load unified identity (includes vault address)
                    await loadIdentity(veridexSdk);
                }
            } catch (error) {
                console.error('SDK initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSdk();
    }, []);

    const loadIdentity = async (sdkInstance: VeridexSDK) => {
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
                    console.warn('Could not compute vault address');
                }
            }

            // Set receive address
            try {
                const recvAddr = sdkInstance.getReceiveAddress();
                setReceiveAddress(recvAddr);
            } catch {
                console.warn('Could not get receive address');
            }
        } catch (error) {
            console.warn('Could not load identity:', error);
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

    // ========================================================================
    // Phase 2: Balance Methods
    // ========================================================================

    const refreshBalances = async () => {
        if (!sdk || !vaultAddress) return;
        
        setIsLoadingBalances(true);
        try {
            const balances = await sdk.getVaultBalances(true);
            setVaultBalances(balances);
        } catch (error) {
            console.error('Error fetching balances:', error);
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

            // Load identity which includes deterministic vault address
            await loadIdentity(sdk);
        } catch (error) {
            console.error('Registration error:', error);
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
        } catch (error) {
            console.error('Login error:', error);
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
            console.error('Wallet connection error:', error);
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
                
                // Phase 2: Balances
                vaultBalances,
                isLoadingBalances,
                refreshBalances,
                getTokenBalance,
                getTokenList,
                
                // Phase 2: Transfers
                prepareTransfer,
                executeTransfer,
                transfer,
                
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
